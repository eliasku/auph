import {_streamPlayerResume, StreamPlayer, StreamPlayer_stop} from "./StreamPlayer";
import {getContext} from "./Mixer";
import {AuphBuffer, AuphBus, AuphVoice, Flag, iMask, Type, u31, Unit} from "../protocol/interface";
import {nextHandle, Obj} from "./common";

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

    stream: StreamPlayer | null = null;

    // static buffer playback
    _started = false;
    buffer: AudioBufferSourceNode | null = null;

    // common nodes
    target: AudioNode | null = null;

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
    if (target !== v.target) {
        const gain = v.gain;
        if (v.target) {
            gain.disconnect(v.target);
        }
        v.target = target;
        if (target) {
            gain.connect(target);
        }
    }
}

export function _voiceResetDestination(v: VoiceObj) {
    if (v.target) {
        v.gain.disconnect(v.target);
        v.target = null;
    }
}

export function _voiceStop(v: VoiceObj) {
    // stop stream
    if (v.stream) {
        StreamPlayer_stop(v.stream);
        v.stream = null;
    }

    // stop buffer
    const buffer = v.buffer;
    if (buffer) {
        if ((v.s & Flag.Running) !== 0) {
            buffer.stop();
        }
        buffer.disconnect();
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

        if (v.stream) {
            v.stream.el.loop = value;
        } else if (v.buffer) {
            v.buffer.loop = value;
        }
    }
}

export function _voiceSetRunning(v: VoiceObj, value: boolean): void {
    const current = !!(v.s & Flag.Running);
    if (value !== current) {
        v.s ^= Flag.Running;
        if (v.stream) {
            if (value) {
                _streamPlayerResume(v.stream);
            } else {
                v.stream.el.pause();
            }
        } else if (v.buffer) {
            v.buffer.playbackRate.value = value ? (v._rate / Unit) : 0.0;
            if (value) {
                // restart if play called in pause mode
                _voiceStartBuffer(v);
            }
        }
    }
}

export function _voiceSetPitch(v: VoiceObj, value: u31): void {
    if (v._rate !== value) {
        v._rate = value;
        if (v.stream) {
            v.stream.el.playbackRate = value / Unit;
        } else if (v.buffer) {
            if ((v.s & Flag.Running) !== 0) {
                v.buffer.playbackRate.value = value / Unit;
            }
        }
    }
}

export let voicePool: (VoiceObj | null)[] = [null];
const voicesMaxCount = 64;

export function _getVoiceObj(handle: AuphVoice): VoiceObj | null {
    const obj = voicePool[handle & iMask];
    return (obj && obj.h === handle) ? obj : null;
}

export function createVoiceObj(): AuphVoice {
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.s === 0) {
            return v.h;
        }
    }
    const index = voicePool.length;
    if (index < voicesMaxCount) {
        const ctx = getContext();
        if (ctx) {
            const v = _voiceNew(ctx, index);
            v.h = Type.Voice | index;
            voicePool.push(v);
            return v.h;
        }
    }
    return 0;
}