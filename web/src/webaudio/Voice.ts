import {AuphBuffer, AuphBus, AuphVoice, Flag, iMask, Type, u31, Unit} from "../protocol/interface";
import {nextHandle, Obj} from "./common";
import {emptyAudioBuffer} from "./Mixer";

export class VoiceObj implements Obj {
    // handle passport
    h = 0;
    // Control Flags
    s = 0;

    _gain = Unit;
    _pan = Unit;
    _rate = Unit;
    data: AuphBuffer = 0;
    bus: AuphBus = 0;

    // static buffer playback
    _started = false;
    buffer: AudioBufferSourceNode | null = null;

    // connected destination audio node
    out: AudioNode | null = null;

    _e = () => {
        // maybe check is useful
        //if (this.buffer === e.target || (this.stream && this.stream.el === e.target)) {
        _voiceStop(this);
        //}
    }

    constructor(readonly gain: GainNode,
                readonly pan: StereoPannerNode,
                index: u31) {
        this.h = Type.Voice | index;
    }
}

export function _voiceNew(ctx: AudioContext, index: u31) {
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.connect(gain);
    return new VoiceObj(gain, pan, index);
}

export function _voiceChangeDestination(v: VoiceObj, target: AudioNode) {
    if (target !== v.out) {
        const gain = v.gain;
        if (v.out) {
            gain.disconnect(v.out);
        }
        v.out = target;
        if (target) {
            gain.connect(target);
        }
    }
}

export function _voiceResetDestination(v: VoiceObj) {
    if (v.out) {
        v.gain.disconnect(v.out);
        v.out = null;
    }
}

export function _voiceStop(v: VoiceObj) {
    // stop buffer
    const buffer = v.buffer;
    if (buffer) {
        if ((v.s & Flag.Running) !== 0) {
            buffer.stop();
        }
        buffer.onended = null;
        buffer.disconnect();
        try {
            buffer.buffer = emptyAudioBuffer;
        } catch {
        }
        v.buffer = null;
    }

    _voiceResetDestination(v);
    v.data = 0;
    v.bus = 0;
    v.s = 0;
    v.h = nextHandle(v.h);
}

export function _voiceStartBuffer(v: VoiceObj) {
    const source = v.buffer;
    if (source && !v._started) {
        //source.addEventListener("ended", v._e, {once: true});
        source.onended = v._e;
        source.loop = (v.s & Flag.Loop) !== 0;
        source.start();
        v._started = true;
    }
}

export function _voicePrepareBuffer(v: VoiceObj, ctx: AudioContext, audioBuffer: AudioBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(v.pan);
    v.buffer = source;
    v._started = false;
}

export function _voiceSetLoop(v: VoiceObj, value: boolean): void {
    const current = (v.s & Flag.Loop) !== 0;
    if (value !== current) {
        v.s ^= Flag.Loop;
        if (v.buffer) {
            v.buffer.loop = value;
        }
    }
}

export function _voiceSetRunning(v: VoiceObj, value: boolean): void {
    const current = !!(v.s & Flag.Running);
    if (value !== current) {
        v.s ^= Flag.Running;
        const playbackRate = value ? (v._rate / Unit) : 0.0;
        if (v.buffer) {
            v.buffer.playbackRate.value = playbackRate;
            if (value) {
                // restart if play called in pause mode
                _voiceStartBuffer(v);
            }
        }
    }
}

export function _voiceApplyPitch(v: VoiceObj, value: u31): void {
    if (!!(v.s & Flag.Running)) {
        if (v.buffer) {
            v.buffer.playbackRate.value = value / Unit;
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
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.s === 0) {
            return v.h;
        }
    }
    const index = voicePool.length;
    if (index < voicesMaxCount) {
        const v = _voiceNew(ctx, index);
        v.h = Type.Voice | index;
        voicePool.push(v);
        return v.h;
    }
    return 0;
}