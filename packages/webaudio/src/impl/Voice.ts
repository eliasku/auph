import {StreamPlayer, StreamPlayer_resume, StreamPlayer_stop} from "./StreamPlayer";
import {getContext} from "./Mixer";
import {AuphBuffer, AuphVoice, iMask, vIncr, vMask, VoiceFlag} from "./types";

export class VoiceObj {
    // handle version (maybe will add index as well)
    v = 0;
    // Control Flags
    s: number = VoiceFlag.Active;

    stream: StreamPlayer | null = null;

    // buffer playback
    buffer: AudioBufferSourceNode | null = null;

    // common nodes

    // "Pitch" / "Playback Rate"
    rate = 1.0;

    target: AudioNode | null = null;

    data: AuphBuffer = 0;

    _e = (e: Event) => {
        // maybe check is useless
        if (this.buffer === e.target) {
            Voice_stop(this);
        }
    }

    constructor(readonly gain: GainNode,
                readonly pan: StereoPannerNode) {
    }
}

export function Voice_create(ctx: AudioContext) {
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.connect(gain);
    return new VoiceObj(gain, pan);
}

export function Voice_changeDestination(v: VoiceObj, target: AudioNode) {
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

export function Voice_resetDestination(v: VoiceObj) {
    if (v.target) {
        v.gain.disconnect(v.target);
        v.target = null;
    }
}

export function Voice_stop(v: VoiceObj) {
    // stop stream
    if (v.stream) {
        StreamPlayer_stop(v.stream);
        v.stream = null;
    }

    // stop buffer
    const buffer = v.buffer;
    if (buffer) {
        if ((v.s & VoiceFlag.Running) !== 0) {
            buffer.stop();
        }
        buffer.disconnect();
        v.buffer = null;
    }

    Voice_resetDestination(v);
    v.data = 0;
    v.s = 0;
    v.v = (v.v + vIncr) & vMask;
}

export function Voice_startBuffer(v: VoiceObj) {
    if ((v.s & VoiceFlag.Running) === 0) {
        const source = v.buffer;
        if (source) {
            //source.addEventListener("ended", v._e, {once: true});
            source.onended = v._e;
            source.loop = (v.s & VoiceFlag.Loop) !== 0;
            source.start();
            v.s |= VoiceFlag.Running;
        }
    }
}

export function Voice_prepareBuffer(v: VoiceObj, ctx: AudioContext, audioBuffer: AudioBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(v.pan);
    v.buffer = source;
}

export function Voice_loop(v: VoiceObj, value: boolean): void {
    const current = (v.s & VoiceFlag.Loop) !== 0;
    if (value !== current) {
        v.s ^= VoiceFlag.Loop;

        if (v.stream) {
            v.stream.el.loop = value;
        } else if (v.buffer) {
            v.buffer.loop = value;
        }
    }
}

export function Voice_running(v: VoiceObj, value: boolean): void {
    const running = (v.s & VoiceFlag.Running) !== 0;
    if (value !== running) {
        v.s ^= VoiceFlag.Running;
        if (value) {
            if (v.stream) {
                StreamPlayer_resume(v.stream);
            } else if (v.buffer) {
                v.buffer.playbackRate.value = v.rate;
                // restart if play called in pause mode
                Voice_startBuffer(v);
            }
        } else {
            if (v.stream) {
                v.stream.el.pause();
            } else if (v.buffer) {
                v.buffer.playbackRate.value = 0.0;
            }
        }
    }
}

export function Voice_pitch(v: VoiceObj, value: number): void {
    if (v.rate !== value) {
        v.rate = value;
        if (v.stream) {
            v.stream.el.playbackRate = value;
        } else if (v.buffer) {
            if ((v.s & VoiceFlag.Running) !== 0) {
                v.buffer.playbackRate.value = value;
            }
        }
    }
}

export let voicePool: (VoiceObj | null)[] = [null];
const voicesMaxCount = 64;

export function _getVoiceObj(handle: AuphVoice): VoiceObj | null {
    const obj = voicePool[handle & iMask];
    return (obj && obj.v === (handle & vMask)) ? obj : null;
}

export function createVoiceObj(): AuphVoice {
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.s === 0) {
            return i | v.v;
        }
    }
    const index = voicePool.length;
    if (index < voicesMaxCount) {
        const ctx = getContext();
        if (ctx) {
            voicePool.push(Voice_create(ctx));
            return index;
        }
    }
    return 0;
}