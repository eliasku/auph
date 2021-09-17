import {AuphBuffer, AuphBus, AuphVoice, Name, Param, u31} from "../protocol/interface";

export function init(): void {
}

export function shutdown(): void {
}

export function load(filepath: string, flags: u31): AuphBuffer {
    return 0;
}

export function loadMemory(data: Uint8Array, flags: u31): AuphBuffer {
    return 0;
}

export function unload(name: Name): void {
}

export function voice(buffer: AuphBuffer,
                      gain: u31,
                      pan: u31,
                      rate: u31,
                      flags: u31,
                      bus: AuphBus): AuphVoice {
    return 0;
}

export function stop(name: Name): void {
}

export function set(name: Name, param: Param, value: u31): void {
}

export function get(name: Name, param: u31): u31 {
    return 0;
}

export function vibrate(duration: u31): u31 {
    return 1;
}