#pragma once

#include "Types.hpp"

namespace auph {

struct BufferDataSource;

struct VoiceObj {
    uint32_t version = 0;
    uint32_t state = 0;
    float gain = 1.0f;
    float pan = 0.0f;
    // playback speed
    float pitch = 1.0f;
    // playback position in frames :(
    double position = 0.0;
    Bus bus = {0};

    const BufferDataSource* data = nullptr;

    void stop() {
        state = 0;
        data = nullptr;

        position = 0.0;
        gain = 1.0f;
        pan = 0.0f;
        pitch = 1.0f;

        version = (version + vIncr) & vMask;
    }
};

}