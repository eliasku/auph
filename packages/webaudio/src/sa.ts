import {
    AuphBuffer,
    AuphBus,
    AuphVoice,
    BufferParam,
    BusFlag,
    BusParam,
    MixerFlag,
    MixerParam,
    VoiceFlag,
    VoiceParam
} from "./impl/types";
import {
    getBufferParam,
    getBusFlag,
    getBusParam,
    getVoiceFlag,
    getVoiceParam,
    setBusFlag,
    setBusParam,
    setVoiceFlag,
    setVoiceParam,
} from "./index";

/** Export Constants only for pre-bundled usage **/

export const VOICES_IN_USE = MixerParam.VoicesInUse;
export const STREAMS_IN_USE = MixerParam.StreamsInUse;
export const BUFFERS_LOADED = MixerParam.BuffersLoaded;
export const STREAMS_LOADED = MixerParam.StreamsLoaded;
export const SAMPLE_RATE = MixerParam.SampleRate;
export const ACTIVE = MixerFlag.Active;
export const RUNNING = MixerFlag.Running;

export const BUS_MASTER = 0;
export const BUS_SFX = 1;
export const BUS_MUSIC = 2;
export const BUS_SPEECH = 3;

export function getMixerStateString(state: number): string {
    return ["closed", "paused", "", "running"][state & 3];
}

export function getBufferStateString(state: number): string {
    return ["free", "loading", "", "loaded"][state & 0x3] + ["", " streaming"][(state >>> 2) & 0x1];
}

export * from "./index";


/** Methods for Voice **/

export function setPan(voice: AuphVoice, value: number): void {
    setVoiceParam(voice, VoiceParam.Pan, value);
}

export function setGain(voice: AuphVoice, value: number): void {
    setVoiceParam(voice, VoiceParam.Gain, value);
}

export function setRate(voice: AuphVoice, value: number): void {
    setVoiceParam(voice, VoiceParam.Rate, value);
}

export function setPause(voice: AuphVoice, value: boolean): void {
    setVoiceFlag(voice, VoiceFlag.Running, !value);
}

export function setLoop(voice: AuphVoice, value: boolean): void {
    setVoiceFlag(voice, VoiceFlag.Loop, value);
}

export function getPan(voice: AuphVoice): number {
    return getVoiceParam(voice, VoiceParam.Pan);
}

export function getGain(voice: AuphVoice): number {
    return getVoiceParam(voice, VoiceParam.Gain);
}

export function getRate(voice: AuphVoice): number {
    return getVoiceParam(voice, VoiceParam.Rate);
}

export function getPause(voice: AuphVoice): boolean {
    return !getVoiceFlag(voice, VoiceFlag.Running);
}

export function getLoop(voice: AuphVoice): boolean {
    return getVoiceFlag(voice, VoiceFlag.Loop);
}

export function getVoiceDuration(voice: AuphVoice): number {
    return getVoiceParam(voice, VoiceParam.Duration);
}

export function getCurrentTime(voice: AuphVoice | 0): number {
    return getVoiceParam(voice, VoiceParam.CurrentTime);
}

export function isVoiceValid(voice: AuphVoice): boolean {
    return getVoiceFlag(voice, VoiceFlag.Active);
}

/** Methods for Bus **/

export function setBusGain(bus: AuphBus, value: number): void {
    setBusParam(bus, BusParam.Gain, value);
}

export function getBusGain(bus: AuphBus): number {
    return getBusParam(bus, BusParam.Gain);
}

export function setBusConnected(bus: AuphBus, connected: boolean): void {
    setBusFlag(bus, BusFlag.Connected, connected);
}

export function getBusConnected(bus: AuphBus): boolean {
    return getBusFlag(bus, BusFlag.Connected);
}

/** Methods for Buffer **/
export function getBufferDuration(buffer: AuphBuffer): number {
    return getBufferParam(buffer, BufferParam.Duration);
}