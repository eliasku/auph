import {AuphBuffer, AuphBus, AuphMixer, AuphVoice, f32, Flag, IAuph, Mixer, Param, Unit} from "./protocol/interface";
import * as Null from "./null/index";
import * as Browser from "./webaudio/index";

function haveWebAudio(): boolean {
    return typeof window !== "undefined" && !!(window.AudioContext || (window as any).webkitAudioContext);
}

function loadDriver(): IAuph {
    if (typeof process !== "undefined") {
        return require("bindings")("auph");
    }
    if (haveWebAudio()) {
        return Browser;
    }
    return Null;
}

const _ = loadDriver();

export * from "./protocol/static";
export const init = _.init;
export const shutdown = _.shutdown;
export const set = _.set;
export const get = _.get;
export const load = _.load;
export const loadMemory = _.loadMemory;
export const unload = _.unload;
export const stop = _.stop;

export function pause(name: AuphMixer | AuphVoice | AuphBuffer | AuphBus = Mixer) {
    setPause(name, true);
}

export function resume(name: AuphMixer | AuphVoice | AuphBuffer | AuphBus = Mixer) {
    setPause(name, false);
}

export function play(buffer: AuphBuffer,
                     gain = 1.0,
                     pan = 0.0,
                     rate = 1.0,
                     loop?: boolean,
                     paused?: boolean,
                     bus?: AuphBus): AuphVoice {
    let flags = 0;
    if (!!loop) flags |= Flag.Loop
    if (!paused) flags |= Flag.Running;
    return _.voice(buffer, f2u(gain), f2u(+pan + 1), f2u(rate), flags, 0 | bus as any);
}

export function getMixerStateString(state: number): string {
    return ["closed", "paused", "", "running"][state & 3];
}

export function getBufferStateString(state: number): string {
    return ["free", "loading", "", "loaded"][state & 0x3] + ["", " streaming"][(state >>> 2) & 0x1];
}

export function setGain(busOrVoice: AuphBus | AuphVoice, value: number): void {
    set(busOrVoice, Param.Gain, f2u(value));
}

export function getGain(busOrVoice: AuphBus | AuphVoice): f32 {
    return get(busOrVoice, Param.Gain) / Unit;
}

export function setPan(voice: AuphVoice, pan: f32): void {
    set(voice, Param.Pan, f2u(+pan + 1));
}

export function setRate(voice: AuphVoice, rate: number): void {
    set(voice, Param.Rate, f2u(rate));
}

export function setPause(name: AuphMixer | AuphVoice | AuphBuffer | AuphBus, value: boolean): void {
    set(name, Param.Flags | Flag.Running, 0 | !value as any);
}

export function setLoop(voice: AuphVoice, value: boolean): void {
    set(voice, Param.Flags | Flag.Loop, 0 | value as any);
}

export function getPan(voice: AuphVoice): number {
    return get(voice, Param.Pan) / Unit - 1;
}

export function getRate(voice: AuphVoice): number {
    return get(voice, Param.Rate) / Unit;
}

export function getPause(voice: AuphVoice): boolean {
    return !(get(voice, Param.State) & Flag.Running);
}

export function getLoop(voice: AuphVoice): boolean {
    return !!(get(voice, Param.State) & Flag.Loop);
}

export function getCurrentTime(voice: AuphVoice | AuphMixer): number {
    return get(voice, Param.CurrentTime) / Unit;
}

export function isActive(name: AuphVoice | AuphBus | AuphBuffer | AuphMixer): boolean {
    return !!(get(name, Param.State) & Flag.Active);
}

export function isBufferLoaded(name: AuphBuffer): boolean {
    const mask = Flag.Active | Flag.Loaded;
    return (get(name, Param.State) & mask) === mask;
}

export function getDuration(name: AuphBuffer | AuphVoice): number {
    return get(name, Param.Duration) / Unit;
}

function f2u(x: number) {
    return (x * Unit) | 0;
}