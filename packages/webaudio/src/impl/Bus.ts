import {getContext} from "./Device";

export type Bus = number;

const busGain: GainNode[] = [];
const busState: number[] = [];

export function _createBus(ctx: AudioContext, destination: AudioNode): number {
    const gain = ctx.createGain();
    gain.connect(destination);
    const index = busGain.length;
    busGain[index] = gain;
    busState[index] = 1;
    return index;
}

export function initBusPool(ctx: AudioContext) {
    _createBus(ctx, ctx.destination);
    const masterGain = busGain[0];
    _createBus(ctx, masterGain);
    _createBus(ctx, masterGain);
    _createBus(ctx, masterGain);
}

export function termBusPool() {
    for (let i = 0; i < busGain.length; ++i) {
        busGain[i].disconnect();
    }
    busGain.length = 0;
}

export function _getBusNode(index: number): AudioNode {
    return busGain[index];
}

export function _getBusGain(index: number): number {
    const gain = busGain[index];
    return gain ? busGain[index].gain.value : 1.0;
}

export function _setBusGain(index: number, gain: number): void {
    const node = busGain[index];
    if (node && node.gain.value !== gain) {
        node.gain.value = gain;
    }
}

export function _getBusState(index: number): number {
    const state = busState[index];
    return state !== undefined ? state : 0;
}

export function _setBusState(index: number, state: number): void {
    const prev = busState[index] & 1;
    if (prev !== state) {
        const dest = index === 0 ? getContext()!.destination : busGain[0].gain;
        const gain = busGain[index];
        if (state) {
            gain.connect(dest);
        } else {
            gain.disconnect(dest);
        }
        busState[index] = state;
    }
}