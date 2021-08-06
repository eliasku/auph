import { DeviceState } from "./impl/Context";
import { Voice } from "./impl/Voice";
import { AudioSource } from "./impl/AudioSource";
import { Bus } from "./impl/Bus";
export declare const enum Var {
    VoicesInUse = 0,
    StreamsInUse = 1,
    BuffersLoaded = 2,
    StreamsLoaded = 3,
    Device_SampleRate = 4,
    Device_State = 5
}
export declare function init(): void;
export declare function resume(): void;
export declare function pause(): void;
export declare function shutdown(): void;
/*** Context State ***/
export declare function getInteger(param: number): number;
/**
 * private function to get native HTMl5 AudioContext
 */
export declare function _getAudioContext(): AudioContext | null;
/***/
export declare function loadAudioSource(filepath: string, streaming: boolean): AudioSource;
export declare function destroyAudioSource(source: AudioSource): void;
export declare const INFINITE_LOOPING = 1073741824;
/***
 *
 * @param source
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
export declare function play(source: AudioSource, volume?: number, pan?: number, pitch?: number, paused?: boolean, loop?: boolean, bus?: Bus): Voice;
export declare function stop(voice: Voice): void;
export declare function isVoiceValid(voice: Voice): boolean;
export declare function getVoiceState(voice: Voice): number;
export declare function setPan(voice: Voice, value: number): void;
export declare function setVolume(voice: Voice, value: number): void;
export declare function setPitch(voice: Voice, value: number): void;
export declare function setPause(voice: Voice, value: boolean): void;
export declare function setLoop(voice: Voice, value: boolean): void;
export declare function getPan(voice: Voice): number;
export declare function getVolume(voice: Voice): number;
export declare function getPitch(voice: Voice): number;
export declare function getPause(voice: Voice): boolean;
export declare function getLoop(voice: Voice): boolean;
export declare function stopAudioSource(source: AudioSource): void;
/** Bus controls **/
export declare function setBusVolume(bus: Bus, value: number): void;
export declare function getBusVolume(bus: Bus): number;
export declare function setBusEnabled(bus: Bus, enabled: boolean): void;
export declare function getBusEnabled(bus: Bus): boolean;
/** length / position **/
export declare function getAudioSourceLength(source: AudioSource): number;
export declare function getVoiceLength(voice: Voice): number;
export declare function getVoicePosition(voice: Voice): number;
/** Export Constants only for pre-bundled usage **/
export declare const VOICES_IN_USE = Var.VoicesInUse;
export declare const STREAMS_IN_USE = Var.StreamsInUse;
export declare const BUFFERS_LOADED = Var.BuffersLoaded;
export declare const STREAMS_LOADED = Var.StreamsLoaded;
export declare const DEVICE_SAMPLE_RATE = Var.Device_SampleRate;
export declare const DEVICE_STATE = Var.Device_State;
export declare const BUS_MASTER = 0;
export declare const BUS_SFX = 1;
export declare const BUS_MUSIC = 2;
export declare const BUS_SPEECH = 2;
export declare function getDeviceStateString(state: DeviceState): string;
