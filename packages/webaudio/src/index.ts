import {
    destroyStreamPlayersPool,
    getNextStreamPlayer,
    getStreamPlayersCount,
    StreamPlayer_resume
} from "./impl/StreamPlayer";
import {closeContext, getContext, getContextState, initContext, resumeAudioContext} from "./impl/Device";
import {
    _checkVoiceHandle,
    _getVoiceObj,
    getNextVoice,
    Voice,
    Voice_changeDestination,
    Voice_loop,
    Voice_pause,
    Voice_pitch,
    Voice_prepareBuffer,
    Voice_startBuffer,
    Voice_stop,
    voicePool
} from "./impl/Voice";
import {AudioData, audioDataPool, getNextAudioData} from "./impl/AudioData";
import {_getBus, _getBusGain, Bus, Bus_enable, initBusPool, termBusPool} from "./impl/Bus";
import {error, log, measure, warn} from "./impl/debug";
import {AudioDataFlag, Param, VoiceStateFlag} from "./impl/Constants";

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
        audioDataPool.length = 1;
        destroyStreamPlayersPool();
        closeContext(ctx);
    }
}

/*** Context State ***/
export function getInteger(param: number): number {
    switch (param) {
        case Param.VoicesInUse: {
            let count = 0;
            for (let i = 1; i < voicePool.length; ++i) {
                if (voicePool[i]!.buffer) {
                    ++count;
                }
            }
            return count;
        }
        case Param.StreamsInUse: {
            return getStreamPlayersCount();
        }
        case Param.BuffersLoaded: {
            return 0;
        }
        case Param.StreamsLoaded: {
            return 0;
        }
        case Param.Device_SampleRate: {
            const ctx = getContext();
            return ctx ? ctx.sampleRate : 0;
        }
        case Param.Device_State: {
            return getContextState();
        }
    }
    return 0;
}

/**
 * private function to get native HTMl5 AudioContext
 */
export function _getAudioContext(): AudioContext | null {
    return getContext();
}

/***/
export function load(filepath: string, streaming: boolean): AudioData {
    let handle = getNextAudioData();
    if (handle === 0) {
        return 0;
    }
    const obj = audioDataPool[handle]!;
    obj.cf |= AudioDataFlag.Empty;
    if (streaming) {
        obj.cf |= AudioDataFlag.Stream;
        fetch(new Request(filepath)).then((response) => {
            return response.blob();
        }).then((blob) => {
            obj.data = URL.createObjectURL(blob);
            obj.cf |= AudioDataFlag.Loaded;
        });
    } else {
        let timeDecoding = 0;
        fetch(new Request(filepath)).then((response) => {
            return response.arrayBuffer();
        }).then((buffer) => {
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
                obj.cf |= AudioDataFlag.Loaded;
            }
        }).catch((reason) => {
            error("can't load audio buffer from " + filepath, reason);
        });
    }
    return handle;
}

export function unload(data: AudioData): void {
    if (data === 0) {
        return;
    }
    stopAudioData(data);
    const sourceObj = audioDataPool[data]!;
    if (sourceObj) {
        if ((sourceObj.cf & AudioDataFlag.Stream) !== 0 && sourceObj.data) {
            URL.revokeObjectURL(sourceObj.data as string);
        }
        sourceObj.cf = 0;
        sourceObj.data = null;
    }
}

/***
 *
 * @param data
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
export function play(data: AudioData,
                     volume = 1.0,
                     pan = 0.0,
                     pitch = 1.0,
                     paused = false,
                     loop = false,
                     bus: Bus = 1): Voice {
    if (data === 0) {
        return 0;
    }
    const ctx = getContext();
    if (!ctx) {
        return 0;
    }
    const dataObj = audioDataPool[data];
    if (!dataObj) {
        warn("audio source not found");
        return 0;
    }
    if ((dataObj.cf & AudioDataFlag.Loaded) === 0) {
        warn("audio source is not loaded yet");
        return 0;
    }
    if (dataObj.data === null) {
        warn("nothing to play, no audio data");
        return 0;
    }
    const targetNode = _getBusGain(bus);
    if (!targetNode) {
        warn("invalid target bus!");
        return 0;
    }
    const voice = getNextVoice();
    if (!voice) {
        warn("no more free simple voices!");
        return 0;
    }
    const voiceObj = _getVoiceObj(voice)!;
    if (loop) {
        voiceObj.cf |= VoiceStateFlag.Loop;
    }
    if (paused) {
        voiceObj.cf |= VoiceStateFlag.Paused;
    }
    voiceObj.rate = 1.0;
    voiceObj.data = data;
    voiceObj.gain.gain.value = volume;
    voiceObj.pan.pan.value = pan;

    if (dataObj.cf & AudioDataFlag.Stream) {
        const mes = getNextStreamPlayer(dataObj.data as string);
        if (!mes) {
            warn("no more free media stream elements!");
            return 0;
        }
        voiceObj.stream = mes;
        mes.el.loop = loop;
        mes.node.connect(voiceObj.pan);
        if (!paused) {
            StreamPlayer_resume(mes);
            voiceObj.cf |= VoiceStateFlag.Running;
        }
    } else {
        Voice_prepareBuffer(voiceObj, ctx, dataObj.data as AudioBuffer);
        if (!paused) {
            Voice_startBuffer(voiceObj);
        }
    }

    // maybe we need to set target before `startBuffer()`
    Voice_changeDestination(voiceObj, targetNode);
    Voice_pitch(voiceObj, pitch);
    return voice;
}

export function stop(voice: Voice): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        Voice_stop(obj);
    }
}

export function isVoiceValid(voice: Voice): boolean {
    return _checkVoiceHandle(voice);
}

export function getVoiceState(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    return obj ? obj.cf : 0;
}

export function setPan(voice: Voice, value: number): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        obj.pan.pan.value = value;
    }
}

export function setVolume(voice: Voice, value: number): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        obj.gain.gain.value = value;
    }
}

export function setPitch(voice: Voice, value: number): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        Voice_pitch(obj, value);
    }
}

export function setPause(voice: Voice, value: boolean): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        Voice_pause(obj, value);
    }
}

export function setLoop(voice: Voice, value: boolean): void {
    const obj = _getVoiceObj(voice);
    if (obj) {
        Voice_loop(obj, value);
    }
}

export function getPan(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    return obj ? obj.pan.pan.value : 0.0;
}

export function getVolume(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    return obj ? obj.gain.gain.value : 1.0;
}

export function getPitch(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    return obj ? obj.rate : 1.0;
}

export function getPause(voice: Voice): boolean {
    const obj = _getVoiceObj(voice);
    return !!obj && (obj.cf & VoiceStateFlag.Paused) !== 0;
}

export function getLoop(voice: Voice): boolean {
    const obj = _getVoiceObj(voice);
    return !!obj && (obj.cf & VoiceStateFlag.Loop) !== 0;
}

export function stopAudioData(data: AudioData): void {
    if (data === 0) {
        console.warn("invalid source");
        return;
    }
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.data === data) {
            Voice_stop(v);
        }
    }
}


/** Bus controls **/
export function setBusVolume(bus: Bus, value: number): void {
    const gain = _getBusGain(bus);
    if (gain) {
        gain.gain.value = value;
    }
}

export function getBusVolume(bus: Bus): number {
    const gain = _getBusGain(bus);
    return gain ? gain.gain.value : 0.0;
}

export function setBusEnabled(bus: Bus, enabled: boolean): void {
    const obj = _getBus(bus);
    if (obj) {
        Bus_enable(obj, enabled);
    }
}

export function getBusEnabled(bus: Bus): boolean {
    const obj = _getBus(bus);
    return !!obj && obj.e;
}

/** length / position **/
export function getAudioDataState(data: AudioData): number {
    if (data !== 0) {
        const obj = audioDataPool[data];
        if (obj) {
            return obj.cf;
        }
    }
    return AudioDataFlag.Invalid
}

export function getAudioSourceLength(data: AudioData): number {
    let d = 0.0;
    if (data !== 0) {
        const obj = audioDataPool[data];
        if (obj && obj.data) {
            if (obj.cf & AudioDataFlag.Stream) {
                // TODO: :(
            } else {
                d = (obj.data as AudioBuffer).duration;
            }
        }
    }
    return d;
}

export function getVoiceLength(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    let d = 0.0;
    if (obj) {
        if (obj.buffer && obj.buffer.buffer) {
            d = obj.buffer.buffer.duration;
        } else if (obj.stream) {
            d = obj.stream.el.duration;
        }
    }
    return d;
}

export function getVoicePosition(voice: Voice): number {
    const obj = _getVoiceObj(voice);
    let d = 0.0;
    if (obj) {
        if (obj.buffer && obj.buffer) {
            // TODO: :(
        } else if (obj.stream) {
            d = obj.stream.el.currentTime;
        }
    }
    return d;
}
