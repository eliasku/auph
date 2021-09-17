export interface IAuph {
    init(): void;

    shutdown(): void;

    set(name: u31, param: u31, value: u31): void;

    get(name: u31, param: u31): u31;

    voice(buffer: AuphBuffer,
          gain: u31,
          pan: u31,
          rate: u31,
          flags: u31,
          bus: AuphBus): AuphVoice;

    load(filepath: string, flags: u31): AuphBuffer;

    loadMemory(data: Uint8Array, flags: u31): AuphBuffer;

    unload(name: Name): void;

    stop(name: Name): void;

    vibrate(durationMillis: u31): u31;
}

/**
 * Object Name Identifier Layout: [00tt 0000 | vvvv vvvv | vvvv vvvv | iiii iiii]
 */
export const tMask = 0x30000000;
export const vMask = 0x00FFFF00;
export const vIncr = 0x00000100;
export const iMask = 0x000000FF;
export const Mixer = 0x00000001;

// used for integer to float params conversion
export const Unit = 1024;
export const DefaultBus: AuphBus = BusIndex.Sound | Type.Bus;

export type u31 = number;
export type f32 = number;

export type Name = u31;
export type AuphVoice = Name;
export type AuphBus = Name;
export type AuphBuffer = Name;
export type AuphMixer = 1;

export const enum BusIndex {
    Master = 0,
    Sound = 1,
    Music = 2,
    Speech = 3,
}

/** Object Type **/
export const enum Type {
    Reserved = 0,
    Bus = 1 << 28,
    Buffer = 2 << 28,
    Voice = 3 << 28
}

export const enum Param {
    State = 0,
    Gain = 1,
    Pan = 2,
    Rate = 3,
    CurrentTime = 4,
    SampleRate = 5,
    Duration = 6,

    StateMask = (1 << 7) - 1,
    Flags = 1 << 7,
    // counts object by state mask
    Count = 1 << 8
}

export const enum Flag {
    Active = 1,
    // Voice: playback is running (un-paused)
    // Buffer: buffer is loaded and ready for reading from
    // Bus: connected state
    // Mixer: is not paused
    Running = 2,
    Loop = 4,

    // Buffer Flags
    Loaded = 2,
    Stream = 4
}

export const enum Message {
    OK = 0,
    NotSupported,
    InvalidState,

    DeviceResuming,
    DeviceResumed,
    DeviceResumeError,

    DevicePausing,
    DevicePaused,
    DevicePauseError,

    DeviceClosing,
    DeviceClosed,
    DeviceCloseError,

    Warning_NoFreeVoices,
    // only for web, audio elements pool is limited
    Warning_NoFreeStreamPlayers,
    Warning_AlreadyInitialized,

    BufferNotFound,
    BufferIsNotLoaded,
    BufferNoData,
    BufferDecodeError,
    BufferLoadError,

    UserInteractionRequiredToStart,

    BusNotFound,
    InvalidArguments,
    InvalidMixerState,
    NotInitialized,

    WebAudio_TryDefaultOptions
}

