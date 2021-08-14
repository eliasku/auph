import {getAudioContextObject} from "./Mixer";
import {AuphBus, Flag, iMask, Type, Unit} from "../protocol/interface";
import {Obj} from "./common";

export class BusObj implements Obj {
    h = 0;
    s = Flag.Active | Flag.Running;
    _gain = Unit;

    constructor(readonly gain: GainNode) {
    }
}

export const busLine: BusObj[] = [];

export function createBusObj(ctx: AudioContext): BusObj {
    const next = busLine.length;
    const obj = new BusObj(ctx.createGain());
    obj.h = next | Type.Bus;
    busLine.push(obj);
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
    for (let i = 0; i < busLine.length; ++i) {
        busLine[i].gain.disconnect();
    }
    busLine.length = 0;
}

export function _getBus(bus: AuphBus): BusObj | null {
    const obj = busLine[bus & iMask];
    return (obj && obj.h === bus) ? obj : null;
}

export function _getBusGain(handle: AuphBus): GainNode | undefined {
    const obj = _getBus(handle);
    return obj ? obj.gain : undefined;
}

export function _setBusConnected(bus: BusObj, connected: boolean): void {
    const flag = !!(bus.s & Flag.Running);
    if (flag !== connected) {
        const master = busLine[0];
        const dest = bus === master ? getAudioContextObject()!.destination : master.gain;
        if (connected) {
            bus.gain.connect(dest);
        } else {
            bus.gain.disconnect(dest);
        }
        bus.s ^= Flag.Running;
    }
}