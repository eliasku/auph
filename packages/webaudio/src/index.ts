import {
    destroyStreamPlayersPool,
    getNextStreamPlayer,
    getStreamPlayersCount,
    StreamPlayer_resume
} from "./impl/StreamPlayer";
import {
    closeContext,
    getAudioContextObject,
    getContext,
    getContextState,
    initContext,
    resumeAudioContext
} from "./impl/Mixer";
import {
    _getVoiceObj,
    createVoiceObj,
    Voice_changeDestination,
    Voice_loop,
    Voice_pitch,
    Voice_prepareBuffer,
    Voice_running,
    Voice_startBuffer,
    Voice_stop,
    voicePool
} from "./impl/Voice";
import {_getBus, _getBusGain, _setBusConnected, initBusPool, termBusPool} from "./impl/Bus";
import {error, log, measure, warn} from "./impl/debug";
import {
    AuphBuffer,
    AuphBus,
    AuphVoice,
    BufferFlag,
    BufferParam,
    BusFlag,
    BusParam,
    iMask,
    MixerFlag,
    MixerParam,
    vMask,
    VoiceFlag,
    VoiceParam
} from "./impl/types";
import {buffers, createBufferObj, destroyBufferObj, getBufferObj} from "./impl/Buffer";

export function init(): void {
    const ctx = initContext();
    if (ctx) {
        initBusPool(ctx);
    }
}

export function resume(): void {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
        resumeAudioContext(ctx);
    }
}

export function pause(): void {
    const ctx = getContext();
    if (ctx && ctx.state === "running") {
        log("pausing");
        ctx.suspend().then(() => {
            log("paused");
        }).catch((reason) => {
            error("pause error", reason);
        });
    }
}

export function shutdown(): void {
    const ctx = getContext();
    if (ctx) {
        termBusPool();
        voicePool.length = 1;
        buffers.length = 1;
        destroyStreamPlayersPool();
        closeContext(ctx);
    }
}

export function getMixerParam(param: MixerParam): number {
    const ctx = getAudioContextObject();
    if (ctx) {
        switch (param) {
            case MixerParam.VoicesInUse: {
                let count = 0;
                for (let i = 1; i < voicePool.length; ++i) {
                    if (voicePool[i]!.buffer) {
                        ++count;
                    }
                }
                return count;
            }
            case MixerParam.StreamsInUse: {
                return getStreamPlayersCount();
            }
            case MixerParam.BuffersLoaded: {
                let count = 0;
                for (let i = 1; i < buffers.length; ++i) {
                    if (buffers[i]!.s !== 0) {
                        ++count;
                    }
                }
                return count;
            }
            case MixerParam.StreamsLoaded: {
                return 0;
            }
            case MixerParam.SampleRate: {
                return ctx.sampleRate;
            }
        }
    }
    return 0;
}

export function getMixerState(): number {
    const ctx = getAudioContextObject();
    return ctx ? getContextState(ctx) : 0;
}

export function getMixerFlag(flag: MixerFlag): boolean {
    return (getMixerState() & flag) !== 0;
}

/**
 * private function to get native HTMl5 AudioContext
 */
export function _getAudioContext(): AudioContext | null {
    return getContext();
}

// TODO: move

function fetchURL<T>(filepath: string, cb: (response: Response) => Promise<T>): Promise<T> {
    return fetch(new Request(filepath)).then(cb);
}

/***/
export function load(filepath: string, streaming: boolean): AuphBuffer {
    let handle = createBufferObj();
    if (handle === 0) {
        return 0;
    }
    const obj = buffers[handle & iMask]!;
    if (streaming) {
        obj.s |= BufferFlag.Stream;
        fetchURL(filepath, (response) => response.blob()).then((blob) => {
            obj.data = URL.createObjectURL(blob);
            obj.s |= BufferFlag.Loaded;
        }).catch((reason) => {
            error("can't load audio stream data " + filepath, reason);
        });
    } else {
        let timeDecoding = 0;
        fetchURL(filepath, (response) => response.arrayBuffer()).then((buffer) => {
            const ctx = getContext();
            if (ctx) {
                timeDecoding = measure();
                return ctx.decodeAudioData(buffer);
            }
            return null;
        }).then((buffer) => {
            obj.data = buffer;
            if (buffer) {
                log("decoding time: " + (measure(timeDecoding) | 0) + " ms.");
                obj.s |= BufferFlag.Loaded;
            }
        }).catch((reason) => {
            error("can't load audio buffer from " + filepath, reason);
        });
    }
    return handle;
}

export function unload(buffer: AuphBuffer): void {
    if (buffer === 0) {
        return;
    }
    stopBuffer(buffer);
    const obj = getBufferObj(buffer);
    if (obj) {
        if ((obj.s & BufferFlag.Stream) !== 0 && obj.data) {
            URL.revokeObjectURL(obj.data as string);
        }
        destroyBufferObj(buffer);
    }
}

/***
 *
 * @param buffer
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
export function play(buffer: AuphBuffer,
                     volume = 1.0,
                     pan = 0.0,
                     pitch = 1.0,
                     paused = false,
                     loop = false,
                     bus: AuphBus = 1): AuphVoice {
    if (buffer === 0) {
        return 0;
    }
    const ctx = getContext();
    if (!ctx) {
        return 0;
    }
    const bufferObj = buffers[buffer & iMask];
    if (!bufferObj || bufferObj.v !== (buffer & vMask)) {
        warn("audio source not found");
        return 0;
    }
    if ((bufferObj.s & BufferFlag.Loaded) === 0) {
        warn("audio source is not loaded yet");
        return 0;
    }
    if (bufferObj.data === null) {
        warn("nothing to play, no audio data");
        return 0;
    }
    const targetNode = _getBusGain(bus);
    if (!targetNode) {
        warn("invalid target bus!");
        return 0;
    }
    const voice = createVoiceObj();
    if (voice === 0) {
        log("no more free voices!");
        return 0;
    }
    const voiceObj = _getVoiceObj(voice)!;
    if (loop) {
        voiceObj.s |= VoiceFlag.Loop;
    }
    voiceObj.rate = 1.0;
    voiceObj.data = buffer;
    voiceObj.gain.gain.value = volume;
    voiceObj.pan.pan.value = pan;

    if (bufferObj.s & BufferFlag.Stream) {
        const mes = getNextStreamPlayer(bufferObj.data as string);
        if (!mes) {
            log("no more free media stream elements!");
            return 0;
        }
        voiceObj.stream = mes;
        mes.el.loop = loop;
        mes.node.connect(voiceObj.pan);
        if (!paused) {
            StreamPlayer_resume(mes);
            voiceObj.s |= VoiceFlag.Running;
        }
    } else {
        Voice_prepareBuffer(voiceObj, ctx, bufferObj.data as AudioBuffer);
        if (!paused) {
            Voice_startBuffer(voiceObj);
        }
    }

    // maybe we need to set target before `startBuffer()`
    Voice_changeDestination(voiceObj, targetNode);
    Voice_pitch(voiceObj, pitch);
    return voice;
}

export function stop(voice: AuphVoice): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        Voice_stop(obj);
    }
}

export function stopBuffer(buffer: AuphBuffer): void {
    if (buffer !== 0) {
        for (let i = 1; i < voicePool.length; ++i) {
            const v = voicePool[i]!;
            if (v.data === buffer) {
                Voice_stop(v);
            }
        }
    }
}

export function setVoiceParam(voice: AuphVoice, param: VoiceParam, value: number): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        switch (param) {
            case VoiceParam.Gain:
                _setAudioParam(obj.gain.gain, value);
                break;
            case VoiceParam.Pan:
                _setAudioParam(obj.pan.pan, value);
                break;
            case VoiceParam.Rate:
                Voice_pitch(obj, value);
                break;
        }
    }
}

export function getVoiceParam(voice: AuphVoice, param: VoiceParam): number {
    const obj = _getVoiceObj(voice);
    if (obj) {
        switch (param) {
            case VoiceParam.Gain:
                return obj.gain.gain.value;
            case VoiceParam.Pan:
                return obj.pan.pan.value;
            case VoiceParam.Rate:
                return obj.rate;
            case VoiceParam.Duration: {
                let d = 0.0;
                if (obj.buffer && obj.buffer.buffer) {
                    d = obj.buffer.buffer.duration;
                } else if (obj.stream) {
                    d = obj.stream.el.duration;
                }
                return d;
            }
            case VoiceParam.CurrentTime: {
                let d = 0.0;
                if (obj.buffer && obj.buffer.buffer) {
                    // TODO: :(
                } else if (obj.stream) {
                    d = obj.stream.el.currentTime;
                }
                return d;
            }
        }
    }
    return 0.0;
}

export function setVoiceFlag(voice: AuphVoice, flag: VoiceFlag, value: boolean): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        switch (flag) {
            case VoiceFlag.Running:
                Voice_running(obj, value);
                break;
            case VoiceFlag.Loop:
                Voice_loop(obj, value);
                break;
        }
    }
}

export function getVoiceState(voice: AuphVoice): number {
    const obj = _getVoiceObj(voice);
    return obj ? obj.s : 0;
}

export function getVoiceFlag(voice: AuphVoice, flag: VoiceFlag): boolean {
    return (getVoiceState(voice) & flag) !== 0;
}

function _setAudioParam(param: AudioParam, value: number) {
    if (param.value !== value) {
        param.value = value;
    }
}

/** Bus controls **/

export function setBusParam(bus: AuphBus, param: BusParam, value: number): void {
    const gain = _getBusGain(bus);
    if (gain) {
        switch (param) {
            case BusParam.Gain:
                _setAudioParam(gain.gain, value);
                break;
        }
    }
}

export function getBusParam(bus: AuphBus, param: BusParam): number {
    const gain = _getBusGain(bus);
    if (gain) {
        switch (param) {
            case BusParam.Gain:
                return gain.gain.value;
        }
    }
    return 0.0;
}

export function setBusFlag(bus: AuphBus, flag: BusFlag, value: boolean): void {
    const obj = _getBus(bus);
    if (obj) {
        switch (flag) {
            case BusFlag.Connected:
                _setBusConnected(obj, value);
                break;
        }
    }
}

export function getBusFlag(bus: AuphBus, flag: BusFlag): boolean {
    const obj = _getBus(bus);
    return !!obj && (obj.s & flag) !== 0;
}

export function getBufferState(buffer: AuphBuffer): number {
    const obj = getBufferObj(buffer);
    return obj ? obj.s : 0;
}

export function getBufferFlag(buffer: AuphBuffer, flag: BufferFlag): boolean {
    return (getBufferState(buffer) & flag) !== 0;
}

export function getBufferParam(buffer: AuphBuffer, param: BufferParam): number {
    const obj = getBufferObj(buffer);
    let d = 0.0;
    if (obj) {
        switch (param) {
            case BufferParam.Duration:
                if (obj.s & BufferFlag.Stream) {
                    // TODO: :(
                } else if (obj.data) {
                    d = (obj.data as AudioBuffer).duration;
                }
                break;
        }
    }
    return d;
}
