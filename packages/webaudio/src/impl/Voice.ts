import {StreamPlayer, StreamPlayer_resume, StreamPlayer_stop} from "./StreamPlayer";
import {AudioSource} from "./AudioSource";
import {getContext} from "./Context";

export type Voice = number;

export const enum VoiceStateFlag {
    Running = 1,
    Paused = 2,
    Loop = 4
}

const vMask = 0xFFFF00;
const vIncr = 0x000100;
const iMask = 0x0000FF;

export class VoiceObj {
    stream: StreamPlayer | null = null;

    // buffer playback
    buffer: AudioBufferSourceNode | null = null;

    // common nodes

    // "Pitch" / "Playback Rate"
    rate = 1.0;

    // Control Flags
    cf = 0;

    target: AudioNode | null = null;

    src: AudioSource = 0;

    // handle version (maybe will add index as well)
    v = 0;

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
        if ((v.cf & VoiceStateFlag.Running) !== 0) {
            buffer.stop();
        }
        buffer.disconnect();
        v.buffer = null;
    }

    Voice_resetDestination(v);
    v.src = 0;
    v.cf = 0;
    v.v = (v.v + vIncr) & vMask;
}

export function Voice_startBuffer(v: VoiceObj) {
    if ((v.cf & VoiceStateFlag.Running) === 0) {
        const source = v.buffer;
        if (source) {
            source.addEventListener("ended", (e) => {
                // maybe check is useless
                if (v.buffer === e.target) {
                    Voice_stop(v);
                }
            });
            source.loop = (v.cf & VoiceStateFlag.Loop) !== 0;
            source.start();
            v.cf |= VoiceStateFlag.Running;
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
    const current = (v.cf & VoiceStateFlag.Loop) !== 0;
    if (value !== current) {
        v.cf ^= VoiceStateFlag.Loop;

        if (v.stream) {
            v.stream.el.loop = value;
        } else if (v.buffer) {
            v.buffer.loop = value;
        }
    }
}

export function Voice_pause(v: VoiceObj, value: boolean): void {
    const paused = (v.cf & VoiceStateFlag.Paused) !== 0;
    if (value !== paused) {
        v.cf ^= VoiceStateFlag.Paused;

        if (value) {
            if (v.stream) {
                v.stream.el.pause();
            } else if (v.buffer) {
                v.buffer.playbackRate.value = 0.0;
            }
        } else {
            if (v.stream) {
                StreamPlayer_resume(v.stream);
            } else if (v.buffer) {
                v.buffer.playbackRate.value = v.rate;
                // restart if play called in pause mode
                Voice_startBuffer(v);
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
            if (!(v.cf & VoiceStateFlag.Paused)) {
                v.buffer.playbackRate.value = value;
            }
        }
    }
}

export let voicePool: (VoiceObj | null)[] = [null];
const voicesMaxCount = 64;

export function _checkVoiceHandle(handle: Voice): boolean {
    const obj = voicePool[handle & iMask];
    return !!obj && obj.v === (handle & vMask);
}

export function _getVoiceObjAt(index:number): VoiceObj | null {
    return voicePool[index];
}

export function _getVoiceObj(handle: Voice): VoiceObj | null {
    const obj = voicePool[handle & iMask];
    return (obj && obj.v === (handle & vMask)) ? obj : null;
}

export function getNextVoice(): Voice {
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.src === 0) {
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