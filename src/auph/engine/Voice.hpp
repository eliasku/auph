#pragma once

#include "Types.hpp"

namespace auph {

struct BufferDataSource;

struct VoiceObj {
    int id = 0;
    int state = 0;
    int gain = Unit;
    int pan = Unit;
    // playback speed
    int rate = Unit;
    // playback position in frames :(
    double position = 0.0;
    Bus bus = {0};

    const BufferDataSource* data = nullptr;

    void stop() {
        state = 0;
        data = nullptr;

        position = 0.0;
        gain = Unit;
        pan = Unit;
        rate = Unit;

        id = nextHandle(id);
    }

    [[nodiscard]]
    double rateF64() const {
        return (double) rate / Unit;
    }

    [[nodiscard]]
    float gainF32() const {
        return (float) gain / Unit;
    }

    [[nodiscard]]
    float panF32() const {
        return (float) pan / Unit - 1.0f;
    }
};

}