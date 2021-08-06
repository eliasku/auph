#pragma once

#include <cstdint>

namespace auph {

enum SampleFormat : uint8_t {
    SampleFormat_F32 = 0,
    SampleFormat_I16 = 1
};

struct AudioStreamInfo {
    uint32_t channels = 0;
    uint32_t bytesPerSample = 0;
    uint32_t bytesPerFrame = 0;
    float sampleRate = 0.0f;
    SampleFormat format = SampleFormat_F32;
};

struct AudioDeviceCallbackData {
    void* data = nullptr;
    void* userData = nullptr;
    uint32_t frames = 0;
    AudioStreamInfo stream;
};

enum class AudioDeviceStatus {
    Success = 0,
    InvalidArguments = 1,
    InitializeError = 2
};

typedef void (* AudioDeviceCallback)(AudioDeviceCallbackData* data);

class AudioDevice;

}