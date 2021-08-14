import {error, log, warn} from "./debug";
import {Flag, u31} from "../protocol/interface";

let ctx: AudioContext | null = null;
const unlockEvents = ["mousedown", "pointerdown", "touchstart"];
let unlocked = false;

export function getContext(): AudioContext | null {
    if (!ctx) {
        warn("not initialized");
        return null;
    }
    if (ctx.state === "closed") {
        error("invalid state:", "Context is closed");
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
    log("resuming...");
    ctx.resume().then(() => {
        log("resumed");
    }).catch((reason) => {
        if (!unlocked) {
            log("cannot resume until user interaction, setup unlock handler...");
            setupUnlockHandler();
        } else {
            error("error resuming AudioContext", reason);
        }
    });
}

export function audioContextPause(ctx: AudioContext) {
    log("AudioContext suspending...");
    ctx.suspend().then(() => {
        log("AudioContext suspended");
    }).catch((reason) => {
        error("error suspending AudioContext", reason);
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

export function initContext(): AudioContext | null {
    if (ctx) {
        warn("already initialized");
        return ctx;
    }
    ctx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 22050
    });
    if (!ctx) {
        error("error create AudioContext");
        return null;
    }
    if (ctx.state === "running") {
        audioContextPause(ctx);
    }
    log("Latency: " + ctx.baseLatency);
    log("Sample rate: " + ctx.sampleRate);
    return ctx;
}

export function closeContext(_notNullCtx: AudioContext) {
    log("shutdown...");
    _notNullCtx.close().then(() => {
        log("shutdown completed");
    }).catch((reason) => {
        error("shutdown error", reason);
    });
    ctx = null;
}

export function _setAudioParam(param: AudioParam, value: number) {
    if (param.value !== value) {
        param.value = value;
    }
}