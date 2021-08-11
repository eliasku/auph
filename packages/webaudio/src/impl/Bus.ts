import {getAudioContextObject} from "./Mixer";
import {AuphBus, BusFlag} from "./types";

export class BusObj {
    v = 0;
    s = BusFlag.Active | BusFlag.Connected;

    constructor(readonly gain: GainNode) {
    }
}

const busPool: BusObj[] = [];

export function createBusObj(ctx: AudioContext): BusObj {
    const obj = new BusObj(ctx.createGain());
    busPool.push(obj);
    return obj;
}

export function initBusPool(ctx: AudioContext) {
    const master = createBusObj(ctx).gain;
    master.connect(ctx.destination);
    createBusObj(ctx).gain.connect(master);
    createBusObj(ctx).gain.connect(master);
    createBusObj(ctx).gain.connect(master);
}

export function termBusPool() {
    for (let i = 0; i < busPool.length; ++i) {
        busPool[i].gain.disconnect();
    }
    busPool.length = 0;
}

export function _getBus(handle: AuphBus): BusObj | undefined {
    return busPool[handle];
}

export function _getBusGain(handle: AuphBus): GainNode | undefined {
    const obj = _getBus(handle);
    return obj ? obj.gain : undefined;
}

export function _setBusConnected(bus: BusObj, connected: boolean): void {
    const flag = (bus.s & BusFlag.Connected) !== 0;
    if (flag !== connected) {
        const master = busPool[0];
        const dest = bus === master ? getAudioContextObject()!.destination : master.gain;
        if (connected) {
            bus.gain.connect(dest);
        } else {
            bus.gain.disconnect(dest);
        }
        bus.s ^= BusFlag.Connected;
    }
}