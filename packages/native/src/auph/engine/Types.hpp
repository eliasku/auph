#pragma once

namespace auph {

constexpr uint32_t vMask = 0xFFFF00;
constexpr uint32_t vIncr = 0x000100;
constexpr uint32_t iMask = 0x0000FF;

/** Mixer **/

enum MixerFlag : uint8_t {
    Mixer_Active = 1,
    Mixer_Running = 2
};

enum class MixerParam : uint8_t {
    SampleRate = 1,
    VoicesInUse = 2,
    StreamsInUse = 3,
    BuffersLoaded = 4,
    StreamsLoaded = 5
};

/** Buffer Object **/

struct Buffer {
    uint32_t id;
};

enum BufferFlag : uint8_t {
    Buffer_Active = 1,
    Buffer_Loaded = 2,
    Buffer_Stream = 4
};

enum class BufferParam : uint8_t {
    Duration = 1
};

/** Bus Object **/

struct Bus {
    uint32_t id;
};

enum BusFlag : uint8_t {
    Bus_Active = 1,
    Bus_Connected = 2
};

enum class BusParam : uint8_t {
    Gain = 1
};

/** Voice Object **/

struct Voice {
    uint32_t id;
};

enum VoiceFlag : uint8_t {
    Voice_Active = 1,
    Voice_Running = 2,
    Voice_Loop = 4
};

enum class VoiceParam : uint8_t {
    Gain = 1,
    Pan = 2,
    Rate = 3,
    CurrentTime = 4,
    Duration = 5
};

}