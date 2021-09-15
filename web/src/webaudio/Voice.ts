import {AuphBuffer, AuphBus, AuphVoice, Flag, iMask, Type, u31, Unit} from "../protocol/interface";
import {connectAudioNode, disconnectAudioNode, len, nextHandle, Obj, setAudioParamValue} from "./common";
import {emptyAudioBuffer} from "./Mixer";

export class VoiceObj implements Obj {
    // handle passport
    h = 0;
    // Control Flags
    s = 0;

    // Gain
    G = Unit;

    // Pan
    P = Unit;

    // Rate
    R = Unit;

    // Source auph Buffer
    bf: AuphBuffer = 0;

    // Destination auph Bus
    bs: AuphBus = 0;

    // is source-node started: static buffer playback
    _s = 0;

    // Source-Node
    sn: AudioBufferSourceNode | null = null;

    // Destination-Node: connected destination audio node
    dn: AudioNode | null = null;

    _e = () => {
        // maybe check is useful
        //if (this.buffer === e.target || (this.stream && this.stream.el === e.target)) {
        _voiceStop(this);
        //}
    }

    constructor(readonly g: GainNode,
                readonly p: StereoPannerNode,
                index: u31) {
        this.h = Type.Voice | index;
    }
}

export function _voiceNew(ctx: AudioContext, index: u31) {
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    connectAudioNode(pan, gain);
    return new VoiceObj(gain, pan, index);
}

export function _voiceChangeDestination(v: VoiceObj, target: AudioNode) {
    if (target !== v.dn) {
        const gain = v.g;
        if (v.dn) {
            disconnectAudioNode(gain, v.dn);
        }
        v.dn = target;
        if (target) {
            connectAudioNode(gain, target);
        }
    }
}

export function _voiceResetDestination(v: VoiceObj) {
    if (v.dn) {
        disconnectAudioNode(v.g, v.dn);
        v.dn = null;
    }
}

export function _voiceStop(v: VoiceObj) {
    // stop buffer
    const buffer = v.sn;
    if (buffer) {
        if ((v.s & Flag.Running) !== 0) {
            buffer.stop();
        }
        buffer.onended = null;
        disconnectAudioNode(buffer);
        try {
            buffer.buffer = emptyAudioBuffer;
        } catch {
        }
        v.sn = null;
    }

    _voiceResetDestination(v);
    v.bf = 0;
    v.bs = 0;
    v.s = 0;
    v.h = nextHandle(v.h);
}

export function _voiceStartBuffer(v: VoiceObj) {
    const source = v.sn;
    if (source && !v._s) {
        //source.addEventListener("ended", v._e, {once: true});
        source.onended = v._e;
        source.loop = (v.s & Flag.Loop) !== 0;
        source.start();
        v._s = 1;
    }
}

export function _voicePrepareBuffer(v: VoiceObj, ctx: AudioContext, audioBuffer: AudioBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    connectAudioNode(source, v.p);
    v.sn = source;
    v._s = 0;
}

export function _voiceSetLoop(v: VoiceObj, value: boolean): void {
    const current = (v.s & Flag.Loop) !== 0;
    if (value !== current) {
        v.s ^= Flag.Loop;
        if (v.sn) {
            v.sn.loop = value;
        }
    }
}

export function _voiceSetRunning(v: VoiceObj, value: boolean): void {
    const current = !!(v.s & Flag.Running);
    if (value !== current) {
        v.s ^= Flag.Running;
        const playbackRate = value ? (v.R / Unit) : 0.0;
        if (v.sn) {
            setAudioParamValue(v.sn.playbackRate, playbackRate);
            if (value) {
                // restart if play called in pause mode
                _voiceStartBuffer(v);
            }
        }
    }
}

export function _voiceApplyPitch(v: VoiceObj, value: u31): void {
    if (!!(v.s & Flag.Running)) {
        if (v.sn) {
            setAudioParamValue(v.sn.playbackRate, value / Unit);
        }
    }
}

export let voicePool: (VoiceObj | null)[] = [null];
const voicesMaxCount = 64;

export function _getVoiceObj(handle: AuphVoice): VoiceObj | null {
    const obj = voicePool[handle & iMask];
    return (obj && obj.h === handle) ? obj : null;
}

export function createVoiceObj(ctx: AudioContext): AuphVoice {
    const next = len(voicePool);
    for (let i = 1; i < next; ++i) {
        const v = voicePool[i]!;
        if (v.s === 0) {
            return v.h;
        }
    }
    if (next < voicesMaxCount) {
        const v = _voiceNew(ctx, next);
        v.h = Type.Voice | next;
        voicePool.push(v);
        return v.h;
    }
    return 0;
}