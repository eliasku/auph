#pragma once

#include "../device/AudioDevice.hpp"
#include "Types.hpp"

namespace auph {

union SamplesData {
    // hackish const
    mutable void* buffer;
    float* f32;
    int16_t* i16;
};

struct MixSample {
    float L;
    float R;
};

struct BufferDataSource;

/**
 * stream reader function
 * reads num of frames and return number of read frames
 *
 * returns next dest pointer
 */
typedef MixSample* (* SourceReader)(MixSample*, const double, const double, const double, const BufferDataSource*,
                                    MixSample volume);

struct BufferDataSource {
    void* streamData = nullptr;
    SamplesData data = {nullptr};
    // length in frames (samples / channels)
    uint32_t length = 0;

    SampleFormat format = SampleFormat_I16;
    uint32_t sampleRate = 0;
    uint32_t channels = 0;
    SourceReader reader = nullptr;
};

struct BufferObj {
    int id = 0;
    int state = 0;
    BufferDataSource data{};
    void* sourceBufferData = nullptr;

    ~BufferObj();

    bool load(const char* filepath, int flags);

    bool loadFromMemory(const void* data, uint32_t size, int flags);

    void unload();
};

}

