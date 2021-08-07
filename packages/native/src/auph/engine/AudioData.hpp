#pragma once

#include "../device/AudioDevice.hpp"

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

    AudioDataSource source{};

    ~AudioDataObj();

    bool loadFile_MP3(const char* filepath);

    bool loadFile_WAV(const char* filepath);

    bool loadFile_OGG(const char* filepath);

    bool streamFile_OGG(const char* filepath);

    bool load(const char* filepath, bool streaming);

    void unload();
};

}

