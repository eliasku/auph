import {Flag, Mixer, Param, Type} from "./interface";

/** Export Constants only for pre-bundled usage **/

export const SAMPLE_RATE = Param.SampleRate;
export const STATE = Param.State;
export const COUNT = Param.Count;

export const ACTIVE = Flag.Active;
export const RUNNING = Flag.Running;
export const STREAM = Flag.Stream;
export const LOOP = Flag.Loop;

export const MIXER = Mixer;

export const BUS = Type.Bus;
export const VOICE = Type.Voice;
export const BUFFER = Type.Buffer;

export const BUS_MASTER = Type.Bus | 0;
export const BUS_SFX = Type.Bus | 1;
export const BUS_MUSIC = Type.Bus | 2;
export const BUS_SPEECH = Type.Bus | 3;