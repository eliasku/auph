import {AudioDataFlag, DeviceState, Param} from "./impl/Constants";

/** Export Constants only for pre-bundled usage **/

export const VOICES_IN_USE = Param.VoicesInUse;
export const STREAMS_IN_USE = Param.StreamsInUse;
export const BUFFERS_LOADED = Param.BuffersLoaded;
export const STREAMS_LOADED = Param.StreamsLoaded;
export const DEVICE_SAMPLE_RATE = Param.Device_SampleRate;
export const DEVICE_STATE = Param.Device_State;

export const BUS_MASTER = 0;
export const BUS_SFX = 1;
export const BUS_MUSIC = 2;
export const BUS_SPEECH = 2;

export function getDeviceStateString(state: DeviceState): string {
    return ["invalid", "running", "paused"][state] ?? "undefined";
}

export function getAudioDataStateString(state: AudioDataFlag): string {
    return ["invalid", "loading", "-", "loaded"][state & 0x3] ?? "undefined";
}

export * from "./index";
