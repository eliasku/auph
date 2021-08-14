#pragma once

#include "../device/ThreadWrapper.hpp"

namespace auph {

class NoisePlaybackExample {
public:
    AudioDevice* device{};
//    ThreadWrapper* threaded{};

    float t = 0.0f;
    float fr = 110.0f;
    float fr2 = 220.0f;
    float t2 = 0.0f;

    NoisePlaybackExample() {
        device = new AudioDevice();
        device->userData = this;
        device->onPlayback = onPlayback;

//        threaded = new ThreadWrapper(device);
//        threaded->userData = this;
//        threaded->onPlayback = onPlayback;
    }

    ~NoisePlaybackExample() {
//        delete threaded;
        delete device;
    }

    static void onPlayback(AudioDeviceCallbackData* data) {
        const float pi = 3.1415926535f;
        const float pi2 = pi * 2.0f;
        const float sampleRate = data->stream.sampleRate;
        auto* dest = static_cast<int16_t*>(data->data);
        auto* state = static_cast<NoisePlaybackExample*>(data->userData);
        uint32_t p = 0;
        for (uint32_t frame = 0; frame < data->frames; ++frame) {
            float v = sinf(state->t) - (float) (0.05f * drand48());
            if(v > 1.0f) v = 1.0f;
            if(v < -1.0f) v = -1.0f;
            int16_t s = (int16_t)(32767.0f * v);
            dest[p++] = s;
            dest[p++] = s;
            const auto F = (state->fr + 0.5f * (sinf(state->t2) + 1.0f) * (state->fr2 - state->fr));
            state->t += F * (pi2 / sampleRate);
            state->t2 += 0.001f;
            //fr -= 0.1f;
            if (state->t > pi2) state->t -= pi2;
        }
    }
};

}
