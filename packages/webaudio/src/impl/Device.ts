import {initBusPool, termBusPool} from "./Bus";
import {voicePool} from "./Voice";
import {audioDataPool} from "./AudioData";
import {destroyStreamPlayersPool} from "./StreamPlayer";
import {error, log} from "./debug";
import {closeContext, getAudioContextObject, getContext, initContext, resumeAudioContext} from "./Context";

export function _setDeviceActive(v: number): void {
    let ctx = getAudioContextObject();
    if (v !== 0 && !ctx) {
        ctx = initContext();
        if (ctx) {
            initBusPool(ctx);
        }
    } else if (v === 0 && ctx) {
        termBusPool();
        voicePool.length = 1;
        audioDataPool.length = 1;
        destroyStreamPlayersPool();
        closeContext(ctx);
    }
}

export function _getDeviceActive(): number {
    const ctx = getAudioContextObject();
    return (ctx && ctx.state !== "closed") ? 1 : 0;
}

export function _setDeviceRunning(v: number): void {
    const ctx = getContext();
    if (ctx) {
        if (v === 0 && ctx.state === "running") {
            log("pausing");
            ctx.suspend().then(() => {
                log("paused");
            }).catch((reason) => {
                error("pause error", reason);
            });
        } else if (v !== 0 && ctx.state === "suspended") {
            resumeAudioContext(ctx);
        }
    }
}

export function _getDeviceRunning(): number {
    const ctx = getAudioContextObject();
    return (ctx && ctx.state === "running") ? 1 : 0;
}