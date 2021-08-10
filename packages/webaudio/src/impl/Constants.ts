export const enum BufferState {
    Invalid = 0,
    Active = 1,
    Loaded = 2,
    Stream = 4
}

export const enum VoiceState {
    Invalid = 0,
    Active = 1,
    Running = 2,
    Loop = 4
}

export const enum MixerState {
    Invalid = 0,
    Active = 1,
    Running = 2
}

export const enum MixerParam {
    Active = 1,
    Running = 2,
    SampleRate = 3
}

export const enum AudioDataFlag {
    Invalid = 0,
    Empty = 1,
    Loaded = 2,
    Stream = 4
}

export const enum VoiceStateFlag {
    Running = 1,
    Paused = 2,
    Loop = 4
}

export const enum Param {
    VoicesInUse = 0,
    StreamsInUse = 1,
    BuffersLoaded = 2,
    StreamsLoaded = 3,
    Device_SampleRate = 4,
    Device_State = 5
}