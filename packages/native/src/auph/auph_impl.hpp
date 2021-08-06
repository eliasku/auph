#pragma once

#include "device/AudioDevice_impl.hpp"
#include "engine/SoundEngine.hpp"
#include "engine/Decoders_impl.hpp"
#include "auph.hpp"

namespace auph {

constexpr uint32_t AudioSourcesMaxCount = 128;


struct Context {
    AudioDevice* device = nullptr;
    SoundEngine* engine = nullptr;
    DeviceState state = DeviceState::Invalid;

    SoundResource sources[AudioSourcesMaxCount];
};

Context ctx{};

void init() {
    ctx.device = new AudioDevice();
    ctx.engine = new SoundEngine();
    ctx.device->onPlayback = SoundEngine::playback;
    ctx.device->userData = ctx.engine;
    ctx.state = DeviceState::Paused;
}

void resume() {
    ctx.device->start();
    ctx.state = DeviceState::Running;
}

void pause() {
    ctx.device->stop();
    ctx.state = DeviceState::Paused;
}

void shutdown() {
    delete ctx.engine;
    delete ctx.device;
    ctx = {};
    ctx.state = DeviceState::Invalid;
}

const char* ext(const char* filepath) {
    const char* lastDot = filepath;
    while (*filepath != '\0') {
        if (*filepath == '.') {
            lastDot = filepath;
        }
        filepath++;
    }
    return lastDot;
}

AudioSourceHandle loadAudioSource(const char* filepath, bool streaming) {
    for (uint32_t i = 0; i < AudioSourcesMaxCount; ++i) {
        auto* src = &ctx.sources[i];
        if (src->source.reader == nullptr) {
            const char* e = ext(filepath);
            if (e[1] == 'm' && e[2] == 'p' && e[3] == '3') {
                src->loadFile_MP3(filepath);
            } else if (e[1] == 'o' && e[2] == 'g' && e[3] == 'g') {
                if (streaming) {
                    src->streamFile_OGG(filepath);
                } else {
                    src->loadFile_OGG(filepath);
                }
            } else if (e[1] == 'w' && e[2] == 'a' && e[3] == 'v') {
                src->loadFile_WAV(filepath);
            }
            return {i};
        }
    }
    return {0};
}

void* _getAudioContext() {
    return &ctx;
}

int getInteger(Var param) {
    switch (param) {
        case Var::VoicesInUse: {
            uint32_t count = 0;
            return count;
        }
        case Var::StreamsInUse: {
            return 0;//getStreamPlayersCount();
        }
        case Var::BuffersLoaded: {
            return 0;
        }
        case Var::StreamsLoaded: {
            return 0;
        }
        case Var::Device_SampleRate: {
            // TODO:
            return 44100;
        }
        case Var::Device_State: {
            return static_cast<int>(ctx.state);
        }
    }
    return 0;
}

VoiceHandle play(AudioSourceHandle source, float gain, float pan, float pitch, bool loop, bool paused, Bus bus) {
    auto* voices = ctx.engine->voices;
    for (uint32_t i = 0; i < SoundEngine::VoicesMaxCount; ++i) {
        auto* voice = &voices[i];
        if ((voice->controlFlags & Voice_Running) == 0) {
            voice->controlFlags = Voice_Running;
            if (loop) {
                voice->controlFlags |= Voice_Loop;
            }
            if (paused) {
                voice->controlFlags |= Voice_Paused;
            }
            voice->source = &ctx.sources[source.id].source;
            voice->gain = gain;
            voice->pan = pan;
            voice->pitch = pitch;
            voice->position = 0.0;
            return {i};
        }
    }
    return {0};
}

}
