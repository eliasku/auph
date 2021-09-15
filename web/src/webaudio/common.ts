import {iMask, tMask, u31, vIncr, vMask} from "../protocol/interface";

export interface Obj {
    h: u31;
    s: u31;
}

export function nextHandle(h: u31) {
    return ((h + vIncr) & vMask) | (h & (tMask | iMask));
}

export function connectAudioNode(node: AudioNode, dest: AudioNode) {
    node.connect(dest);
}

export function disconnectAudioNode(node: AudioNode, dest?: AudioNode) {
    node.disconnect(dest!);
}

export function setAudioParamValue(param: AudioParam, value: number) {
    param.value = value;
}

export function len<T>(a: T[]): u31 {
    return a.length;
}

export function resize<T>(a: T[], length: u31) {
    a.length = length;
}

export function add<T>(a: T[], e: T) {
    a.push(e);
}
