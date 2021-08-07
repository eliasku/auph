import { Voice } from "./impl/Voice";
import { AudioData } from "./impl/AudioData";
import { Bus } from "./impl/Bus";
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
export declare function load(filepath: string, streaming: boolean): AudioData;
export declare function unload(data: AudioData): void;
/***
 *
 * @param data
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
export declare function play(data: AudioData, volume?: number, pan?: number, pitch?: number, paused?: boolean, loop?: boolean, bus?: Bus): Voice;
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
export declare function stopAudioData(data: AudioData): void;
/** Bus controls **/
export declare function setBusVolume(bus: Bus, value: number): void;
export declare function getBusVolume(bus: Bus): number;
export declare function setBusEnabled(bus: Bus, enabled: boolean): void;
export declare function getBusEnabled(bus: Bus): boolean;
/** length / position **/
export declare function getAudioDataState(data: AudioData): number;
export declare function getAudioSourceLength(data: AudioData): number;
export declare function getVoiceLength(voice: Voice): number;
export declare function getVoicePosition(voice: Voice): number;
