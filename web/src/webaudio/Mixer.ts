import {error, log, warn} from "./debug";
import {Flag, Message, u31} from "../protocol/interface";
import {unlock} from "./Unlock";

let ctx: AudioContext | null = null;
export let emptyAudioBuffer: AudioBuffer | null = null;
const defaultSampleRate = 22050;

export function getContext(): AudioContext | null {
    if (!ctx || ctx.state === "closed") {
        warn(Message.InvalidState);
        return null;
    }
    return ctx;
}

export function getAudioContextObject(): AudioContext | null {
    return ctx;
}

export function getContextState(ctx: AudioContext): u31 {
    let state = 0;
    if (ctx.state !== "closed") {
        state |= Flag.Active;
        if (ctx.state === "running") {
            state |= Flag.Running;
        }
    }
    return state;
}

export function audioContextResume(ctx: AudioContext) {
    log(Message.DeviceResuming);
    ctx.resume().then(() => {
        log(Message.DeviceResumed);
    }).catch((reason) => {
        error(Message.DeviceResumeError, reason);
    });
}

export function audioContextPause(ctx: AudioContext) {
    log(Message.DevicePausing);
    ctx.suspend().then(() => {
        log(Message.DevicePaused);
    }).catch((reason) => {
        error(Message.DevicePauseError, reason);
    });
}

function newAudioContext(options?: AudioContextOptions): AudioContext | null {
    const scope: any = window;
    const audioContext: any = scope.AudioContext || scope.webkitAudioContext;

    // TODO: set sample rate could lead to wrong playback on safari mobile (maybe it should be recreated after unlock?)
    //try {
    //    return new audioContext(options);
    //} catch (err) {
    //    error(Message.WebAudio_TryDefaultOptions, err);
    //}

    try {
        return new audioContext();
    } catch (err) {
        error(Message.NotSupported, err);
    }

    return null;
}

export function initContext(): AudioContext | null {
    if (ctx) {
        warn(Message.Warning_AlreadyInitialized);
        return ctx;
    }
    ctx = newAudioContext({
        latencyHint: "interactive",
        sampleRate: defaultSampleRate
    });
    if (ctx) {
        if (!emptyAudioBuffer) {
            emptyAudioBuffer = ctx.createBuffer(1, 1, defaultSampleRate);
        }
        unlock((): boolean => {
            if (ctx!.state === "suspended") {
                audioContextResume(ctx!);
                return false;
            }
            return true;
        });
    }
    return ctx;
}

export function closeContext(context: AudioContext) {
    log(Message.DeviceClosing);
    context.close().then(() => {
        log(Message.DeviceClosed);
    }).catch((reason) => {
        error(Message.DeviceCloseError, reason);
    });
    ctx = null;
}

export function _setAudioParam(param: AudioParam, value: number) {
    if (param.value !== value) {
        param.value = value;
    }
}