#pragma once

namespace auph {

struct AudioDataSource;

enum VoiceStateFlags : uint8_t {
    Voice_Running = 1,
    Voice_Paused = 2,
    Voice_Loop = 4
};

constexpr uint32_t vMask = 0xFFFF00;
constexpr uint32_t vIncr = 0x000100;
constexpr uint32_t iMask = 0x0000FF;

struct VoiceObj {
    uint32_t v = 0;
    float gain = 1.0f;
    float pan = 0.0f;
    // playback speed
    float pitch = 1.0f;
    // playback position in frames :(
    double position = 0.0;
    uint32_t bus = 0;
    uint8_t controlFlags = 0;

    const AudioDataSource* data = nullptr;

    void stop() {
        controlFlags = 0;
        data = nullptr;

        position = 0.0;
        gain = 1.0f;
        pan = 0.0f;
        pitch = 1.0f;

        v = (v + vIncr) & vMask;
    }
};

}