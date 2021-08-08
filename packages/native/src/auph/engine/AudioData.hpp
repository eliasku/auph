#pragma once

#include "../device/AudioDevice.hpp"

namespace auph {

enum AudioDataState : uint8_t {
    AudioData_Invalid = 0,
    AudioData_Empty = 1,
    AudioData_Loaded = 2,
    AudioData_Stream = 4
};

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

struct AudioDataSource;

/**
 * stream reader function
 * reads num of frames and return number of read frames
 */
typedef void (* SourceReader)(MixSample*, const double, const double, const double, const AudioDataSource*,
                              MixSample gain);

struct AudioDataSource {
    void* streamData = nullptr;
    SamplesData data = {nullptr};
    // length in frames (samples / channels)
    uint32_t length = 0;

    SampleFormat format = SampleFormat_I16;
    uint32_t sampleRate = 0;
    uint32_t channels = 0;
    SourceReader reader = nullptr;
};

struct AudioDataObj {
    uint8_t state = AudioData_Empty;
    AudioDataSource source{};

    ~AudioDataObj();

    bool load(const char* filepath, bool streaming);

    void unload();
};

}

