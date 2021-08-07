export const enum AudioDataFlag {
    Invalid = 0,
    Empty = 1,
    Loaded = 2,
    Stream = 4
}

export const enum DeviceState {
    Invalid = 0,
    Running = 1,
    Paused = 2
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