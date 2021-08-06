import {
    destroyStreamPlayersPool,
    getNextStreamPlayer,
    getStreamPlayersCount,
    StreamPlayer_resume
} from "./impl/StreamPlayer";
import {closeContext, getContext, initContext, resumeAudioContext} from "./impl/Context";
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
    voicePool,
    VoiceStateFlag
} from "./impl/Voice";
import {AudioSource, AudioSourceObj, audioSources} from "./impl/AudioSource";
import {_getBus, _getBusGain, Bus, Bus_enable, initBusPool, termBusPool} from "./impl/Bus";
import {error, log, measure, warn} from "./impl/debug";

export const enum Var {
    VoicesInUse = 0,
    StreamsInUse = 1,
    BuffersLoaded = 2,
    StreamsLoaded = 3,
    SampleRate = 4,
}

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
        audioSources.length = 1;
        destroyStreamPlayersPool();
        closeContext(ctx);
    }
}

/*** Context State ***/
export function getInteger(param: number): number {
    switch (param) {
        case VOICES_IN_USE: {
            let count = 0;
            for (let i = 1; i < voicePool.length; ++i) {
                if (voicePool[i]!.buffer) {
                    ++count;
                }
            }
            return count;
        }
        case STREAMS_IN_USE: {
            return getStreamPlayersCount();
        }
        case BUFFERS_LOADED: {
            return 0;
        }
        case STREAMS_LOADED: {
            return 0;
        }
        case SAMPLE_RATE: {
            const ctx = getContext();
            return ctx ? ctx.sampleRate : 0;
        }
    }
    return -1;
}

/**
 * private function to get native HTMl5 AudioContext
 */
export function _getAudioContext(): AudioContext | null {
    return getContext();
}

/***/
export function loadAudioSource(filepath: string, streaming: boolean): AudioSource {
    if (!getContext()) {
        return 0;
    }
    let handle = 0;
    for (let i = 1; i < audioSources.length; ++i) {
        if (audioSources[i]!.isFree) {
            handle = i;
        }
    }
    if (handle === 0) {
        audioSources.push(new AudioSourceObj());
        handle = audioSources.length - 1;
    }
    const obj = audioSources[handle]!;
    obj.isFree = false;
    if (streaming) {
        obj.url = filepath;
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
            obj.buffer = buffer;
            if (buffer) {
                log("decoding time: " + (measure(timeDecoding) | 0) + " ms.");
            }
        }).catch((reason) => {
            error("can't load audio buffer from " + filepath, reason);
        });
    }
    return handle;
}

export function destroyAudioSource(source: AudioSource): void {
    if (source === 0) {
        return;
    }
    stopAudioSource(source);
    const sourceObj = audioSources[source]!;
    if (sourceObj) {
        sourceObj.buffer = null;
        sourceObj.url = null;
        sourceObj.isFree = true;
    }
}

export const INFINITE_LOOPING = 0x40000000; // for SMI optimization we use 31-th bit

/***
 *
 * @param source
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
export function play(source: AudioSource,
                     volume = 1.0,
                     pan = 0.0,
                     pitch = 1.0,
                     paused = false,
                     loop = false,
                     bus: Bus = 1): Voice {
    if (source === 0) {
        return 0;
    }
    const ctx = getContext();
    if (!ctx) {
        return 0;
    }
    const sourceObj = audioSources[source];
    if (!sourceObj || sourceObj.isFree) {
        warn("audio source not found");
        return 0;
    }
    if (!sourceObj.url && !sourceObj.buffer) {
        warn("nothing to play, audio source is empty!");
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
    voiceObj.src = source;
    voiceObj.gain.gain.value = volume;
    voiceObj.pan.pan.value = pan;

    if (sourceObj.url) {
        const mes = getNextStreamPlayer(sourceObj.url);
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
    } else if (sourceObj.buffer) {
        Voice_prepareBuffer(voiceObj, ctx, sourceObj.buffer);
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

export function stopAudioSource(source: AudioSource): void {
    if (source === 0) {
        console.warn("invalid source");
        return;
    }
    for (let i = 1; i < voicePool.length; ++i) {
        const v = voicePool[i]!;
        if (v.src === source) {
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
export function getAudioSourceLength(source: AudioSource): number {
    let d = 0.0;
    if (source !== 0) {
        const obj = audioSources[source];
        if (obj) {
            if (obj.buffer) {
                obj.buffer.duration
            } else if (obj.url) {
                // TODO: :(
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


/** Export Constants only for pre-bundled usage **/

export const VOICES_IN_USE = Var.VoicesInUse;
export const STREAMS_IN_USE = Var.StreamsInUse;
export const BUFFERS_LOADED = Var.BuffersLoaded;
export const STREAMS_LOADED = Var.StreamsLoaded;
export const SAMPLE_RATE = Var.SampleRate;

