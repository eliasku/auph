import {_streamPlayerResume, destroyStreamPlayersPool, getNextStreamPlayer} from "./StreamPlayer";
import {
    _setAudioParam,
    audioContextPause,
    audioContextResume,
    closeContext,
    getAudioContextObject,
    getContext,
    getContextState,
    initContext
} from "./Mixer";
import {
    _getVoiceObj,
    _voiceChangeDestination,
    _voicePrepareBuffer,
    _voiceSetLoop,
    _voiceSetPitch,
    _voiceSetRunning,
    _voiceStartBuffer,
    _voiceStop,
    createVoiceObj,
    voicePool
} from "./Voice";
import {_getBus, _getBusGain, _setBusConnected, busLine, initBusPool, termBusPool} from "./Bus";
import {setError, warn} from "./debug";
import {
    AuphBuffer,
    AuphBus,
    AuphVoice,
    DefaultBus,
    Flag,
    iMask,
    Message,
    Mixer,
    Name,
    Param,
    tMask,
    Type,
    u31,
    Unit
} from "../protocol/interface";
import {_bufferDestroy, _bufferLoad, _bufferMemory, _getBufferObj, buffers, getNextBufferObj} from "./Buffer";

export function init(): void {
    const ctx = initContext();
    if (ctx) {
        initBusPool(ctx);
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

export function load(filepath: string, flags: u31): AuphBuffer {
    let handle = getNextBufferObj();
    if (handle) {
        const obj = buffers[handle & iMask]!;
        _bufferLoad(obj, filepath, flags);
    }
    return handle;
}

export function loadMemory(data: Uint8Array, flags: u31): AuphBuffer {
    let handle = getNextBufferObj();
    if (handle) {
        const obj = buffers[handle & iMask]!;
        _bufferMemory(obj, data, flags);
    }
    return handle;
}

export function unload(name: Name): void {
    const obj = _getBufferObj(name);
    if (obj) {
        stop(name);
        _bufferDestroy(obj);
    }
}

/***
 *
 * @param buffer
 * @param gain
 * @param pan
 * @param rate
 * @param flags
 * @param bus
 */
export function voice(buffer: AuphBuffer,
                      gain: u31,
                      pan: u31,
                      rate: u31,
                      flags: u31,
                      bus: AuphBus): AuphVoice {
    // arguments check debug
    if (flags & ~(Flag.Running | Flag.Loop)) {
        setError(Message.InvalidArguments);
        return 0;
    }
    ///

    const ctx = getAudioContextObject();
    if (!ctx || ctx.state !== "running") {
        setError(Message.InvalidMixerState, ctx?.state);
        return 0;
    }
    const bufferObj = _getBufferObj(buffer);
    if (!bufferObj) {
        setError(Message.BufferNotFound);
        return 0;
    }
    if (!(bufferObj.s & Flag.Loaded)) {
        setError(Message.BufferIsNotLoaded);
        return 0;
    }
    if (!bufferObj.data) {
        setError(Message.BufferNoData);
        return 0;
    }
    const targetNode = _getBusGain(bus ? bus : DefaultBus);
    if (!targetNode) {
        setError(Message.BusNotFound);
        return 0;
    }
    const voice = createVoiceObj(ctx);
    if (voice === 0) {
        setError(Message.Warning_NoFreeVoices);
        return 0;
    }
    const voiceObj = _getVoiceObj(voice)!;

    voiceObj.s = Flag.Active | flags;
    voiceObj.data = buffer;
    voiceObj._rate = rate;
    voiceObj._gain = gain;
    voiceObj._pan = pan;
    voiceObj.gain.gain.value = gain / Unit;
    voiceObj.pan.pan.value = pan / Unit - 1;

    if (bufferObj.s & Flag.Stream) {
        const mes = getNextStreamPlayer(ctx, bufferObj.data as string);
        if (!mes) {
            setError(Message.Warning_NoFreeStreamPlayers);
            return 0;
        }
        voiceObj.stream = mes;
        mes.el.loop = !!(flags & Flag.Loop);
        mes.node.connect(voiceObj.pan);
        mes.el.onended = voiceObj._e;
        if (flags & Flag.Running) {
            _streamPlayerResume(mes);
        }
    } else {
        _voicePrepareBuffer(voiceObj, ctx, bufferObj.data as AudioBuffer);
        if (flags & Flag.Running) {
            _voiceStartBuffer(voiceObj);
        }
    }

    // maybe we need to set target before `startBuffer()`
    _voiceChangeDestination(voiceObj, targetNode);
    _voiceSetPitch(voiceObj, rate);
    return voice;
}

export function stop(name: Name): void {
    if (name === 0) {
        return;
    }

    const type = name & tMask;
    if (type === Type.Voice) {
        const obj = _getVoiceObj(name);
        if (obj) {
            _voiceStop(obj);
        }
    } else if (type === Type.Buffer) {
        const obj = _getBufferObj(name);
        if (obj) {
            for (let i = 1; i < voicePool.length; ++i) {
                const v = voicePool[i]!;
                if (v.data === name) {
                    _voiceStop(v);
                }
            }
        } else {
            setError(Message.BufferNotFound);
        }
    }
}

export function set(name: Name, param: Param, value: u31): void {
    if (name === 0) {
        return;
    }

    if (name === Mixer && (param & Param.Flags) && (param & Flag.Running)) {
        const ctx = getContext();
        if (ctx) {
            if (value && ctx.state === "suspended") {
                audioContextResume(ctx);
            } else if (!value && ctx.state === "running") {
                audioContextPause(ctx);
            }
        }
    }

    const type = name & tMask;
    if (type === Type.Voice) {
        const obj = _getVoiceObj(name);
        if (obj) {
            if (param & Param.Flags) {
                const enabled = value !== 0;
                if (param & Flag.Running) {
                    _voiceSetRunning(obj, enabled);
                } else if (param & Flag.Loop) {
                    _voiceSetLoop(obj, enabled);
                }
            } else {
                switch (param) {
                    case Param.Gain:
                        if (obj._gain !== value) {
                            obj._gain = value;
                            _setAudioParam(obj.gain.gain, value / Unit);
                        }
                        break;
                    case Param.Pan:
                        if (obj._pan !== value) {
                            obj._pan = value;
                            _setAudioParam(obj.pan.pan, value / Unit - 1);
                        }
                        break;
                    case Param.Rate:
                        _voiceSetPitch(obj, value);
                        break;
                    case Param.CurrentTime:
                        // TODO:
                        break;
                    default:
                        break;
                }
            }
        }
    } else if (type === Type.Bus) {
        const obj = _getBus(name);
        if (obj) {
            if (param & Param.Flags) {
                if (param & Flag.Running) {
                    _setBusConnected(obj, !!value);
                }
            } else {
                switch (param) {
                    case Param.Gain:
                        if (obj._gain !== value) {
                            _setAudioParam(obj.gain.gain, value / Unit);
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

export function get(name: Name, param: u31): u31 {
    if (name === Mixer) {
        const ctx = getAudioContextObject();
        if (ctx) {
            if (param === Param.State) {
                return getContextState(ctx);
            } else if (param === Param.SampleRate) {
                return ctx.sampleRate | 0;
            }
        }
        return 0;
    }

    const type = name & tMask;
    if ((param & Param.Count) && !(name & iMask)) {
        const stateMask = param & Param.StateMask;
        if (type === Type.Voice) {
            return _countObjectsWithFlags(voicePool, stateMask);
        } else if (type === Type.Bus) {
            return _countObjectsWithFlags(busLine, stateMask);
        } else if (type === Type.Buffer) {
            return _countObjectsWithFlags(buffers, stateMask);
        }
        return 0;
    }

    if (type === Type.Voice) {
        const obj = _getVoiceObj(name);
        if (obj) {
            switch (param) {
                case Param.State:
                    return obj.s;
                case Param.Gain:
                    return obj._gain;
                case Param.Pan:
                    return obj._pan;
                case Param.Rate:
                    return obj._rate;
                case Param.Duration: {
                    let d = 0.0;
                    if (obj.buffer && obj.buffer.buffer) {
                        d = obj.buffer.buffer.duration * Unit;
                    } else if (obj.stream) {
                        d = obj.stream.el.duration * Unit;
                    }
                    return (d * Unit) | 0;
                }
                case Param.CurrentTime: {
                    let d = 0.0;
                    if (obj.buffer && obj.buffer.buffer) {
                        // TODO: :(
                    } else if (obj.stream) {
                        d = obj.stream.el.currentTime;
                    }
                    return (d * Unit) | 0;
                }
                default:
                    warn(Message.NotSupported);
                    break;
            }
        }
        return 0;
    } else if (type === Type.Bus) {
        const obj = _getBus(name);
        if (obj) {
            switch (param) {
                case Param.State:
                    return obj.s;
                case Param.Gain:
                    return obj._gain;
                default:
                    warn(Message.NotSupported);
                    break;
            }
        }
        return 0;
    } else if (type === Type.Buffer) {
        const obj = _getBufferObj(name);
        if (obj) {
            switch (param) {
                case Param.State:
                    return obj.s;
                case Param.Duration: {
                    let d = 0.0;
                    if (obj.s & Flag.Stream) {
                        // TODO: :(
                        warn(Message.NotSupported);
                    } else if (obj.data) {
                        d = (obj.data as AudioBuffer).duration;
                    }
                    return (d * Unit) | 0;
                }
                default:
                    warn(Message.NotSupported);
                    break;
            }
        }
        return 0;
    }
    return 0;
}

/** private helpers **/
function _countObjectsWithFlags(arr: ({ s: u31 } | null)[], mask: u31): u31 {
    let cnt = 0;
    for (let i = 1; i < arr.length; ++i) {
        const obj = arr[i];
        if (obj && (obj.s & mask) === mask) {
            ++cnt;
        }
    }
    return cnt;
}