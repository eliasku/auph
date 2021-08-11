export type int = number;

export const vMask = 0xFFFF00;
export const vIncr = 0x000100;
export const iMask = 0x0000FF;

/** Mixer **/
export const enum MixerFlag {
    Active = 1,
    Running = 2
}

export const enum MixerParam {
    SampleRate = 1,
    VoicesInUse = 2,
    StreamsInUse = 3,
    BuffersLoaded = 4,
    StreamsLoaded = 5
}

/** Buffer Object **/

export type AuphBuffer = int;

export const enum BufferFlag {
    Active = 1,
    Loaded = 2,
    Stream = 4
}

export const enum BufferParam {
    Duration = 1
}

/** Bus Object **/

export type AuphBus = int;

export const enum BusFlag {
    Active = 1,
    Connected = 2
}

export const enum BusParam {
    Gain = 1
}

/** Voice Object **/

export type AuphVoice = int;

export const enum VoiceFlag {
    Active = 1,
    Running = 2,
    Loop = 4
}

export const enum VoiceParam {
    Gain = 1,
    Pan = 2,
    Rate = 3,
    CurrentTime = 4,
    Duration = 5
}