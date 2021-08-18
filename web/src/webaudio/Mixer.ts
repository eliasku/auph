import {error, log, warn} from "./debug";
import {Flag, Message, u31} from "../protocol/interface";

let ctx: AudioContext | null = null;
const unlockEvents = ["mousedown", "pointerdown", "touchstart"];
let unlocked = false;

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
        if (!unlocked) {
            log(Message.UserInteractionRequiredToStart);
            setupUnlockHandler();
        } else {
            error(Message.DeviceResumeError, reason);
        }
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

function unlock() {
    unlocked = true;
    const removeEventListener = document.removeEventListener;
    for (let i = 0; i < unlockEvents.length; ++i) {
        removeEventListener(unlockEvents[i], unlock);
    }
    if (ctx && ctx.state === "suspended") {
        audioContextResume(ctx);
    }
}

function setupUnlockHandler() {
    const addEventListener = document.addEventListener;
    for (let i = 0; i < unlockEvents.length; ++i) {
        addEventListener(unlockEvents[i], unlock);
    }
}

function newAudioContext(options?: AudioContextOptions): AudioContext | null {
    try {
        const scope: any = window;
        const audioContext: any = scope.AudioContext || scope.webkitAudioContext;
        //scope.AudioContext = audioContext;
        return new audioContext({
            latencyHint: "interactive",
            sampleRate: 22050
        });
    } catch {
        error(Message.NotSupported);
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
        sampleRate: 22050
    });
    if (ctx && ctx.state === "running") {
        audioContextPause(ctx);
    }
    return ctx;
}

export function closeContext(_notNullCtx: AudioContext) {
    log(Message.DeviceClosing);
    _notNullCtx.close().then(() => {
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