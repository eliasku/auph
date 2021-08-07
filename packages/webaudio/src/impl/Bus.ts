import {getContext} from "./Device";

export class BusObj {
    constructor(readonly gain: GainNode,
                public e = true) {
    }
}

export type Bus = number;

const busPool: (BusObj)[] = [];

export function Bus_create(ctx: AudioContext): BusObj {
    const obj = new BusObj(ctx.createGain());
    busPool.push(obj);
    return obj;
}

export function initBusPool(ctx: AudioContext) {
    const master = Bus_create(ctx).gain;
    master.connect(ctx.destination);
    Bus_create(ctx).gain.connect(master);
    Bus_create(ctx).gain.connect(master);
    Bus_create(ctx).gain.connect(master);
}

export function termBusPool() {
    for (let i = 0; i < busPool.length; ++i) {
        busPool[i].gain.disconnect();
    }
    busPool.length = 0;
}

export function _getBus(handle: Bus): BusObj | undefined {
    return busPool[handle];
}

export function _getBusGain(handle: Bus): GainNode | undefined {
    const obj = _getBus(handle);
    return obj ? obj.gain : undefined;
}

export function Bus_enable(bus: BusObj, enabled: boolean): void {
    if (bus.e !== enabled) {
        const master = busPool[0];
        const dest = bus === master ? getContext()!.destination : master.gain;
        if (enabled) {
            bus.gain.connect(dest);
        } else {
            bus.gain.disconnect(dest);
        }
        bus.e = enabled;
    }
}