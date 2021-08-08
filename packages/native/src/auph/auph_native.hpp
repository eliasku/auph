#pragma once

#include "device/AudioDevice_impl.hpp"
#include "engine/Mixer.hpp"
#include "engine/AudioData_impl.hpp"
#include "auph.hpp"

namespace auph {

constexpr uint32_t AudioSourcesMaxCount = 128;

struct Context {
    AudioDevice device{};
    Mixer mixer{};
    DeviceState state = DeviceState::Paused;
    AudioDataObj dataPool[AudioSourcesMaxCount];
    VoiceObj voicePool[Mixer::VoicesMaxCount];
    BusObj busLine[4]{};

    Context() {
        mixer.voices = voicePool;
        mixer.busLine = busLine;
        device.onPlayback = Mixer::playback;
        device.userData = &mixer;
        state = DeviceState::Paused;
    }

    VoiceObj* getVoiceObj(Voice voice) {
        const auto index = voice.id & iMask;
        if (index > 0 && index < Mixer::VoicesMaxCount) {
            auto* obj = voicePool + index;
            if (obj->v == (voice.id & vMask)) {
                return obj;
            }
        }
        return nullptr;
    }

    [[nodiscard]]
    Voice getNextVoice() const {
        for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
            const auto* obj = voicePool + i;
            if (obj->data == nullptr) {
                return {i | obj->v};
            }
        }
        return {0};
    }
};

Context* ctx = nullptr;

void init() {
    if (!ctx) {
        ctx = new Context();
    }
}

void resume() {
    if (ctx) {
        ctx->device.start();
        ctx->state = DeviceState::Running;
    }
}

void pause() {
    if (ctx) {
        ctx->device.stop();
        ctx->state = DeviceState::Paused;
    }
}

void shutdown() {
    delete ctx;
    ctx = nullptr;
}

AudioData load(const char* filepath, bool streaming) {
    for (uint32_t i = 1; i < AudioSourcesMaxCount; ++i) {
        auto* src = &ctx->dataPool[i];
        // data slot is free
        if (src->source.reader == nullptr) {
            // data slot is loading
            if (src->load(filepath, streaming)) {
                return {i};
            }
        }
    }
    return {0};
}

void unload(AudioData data) {
    auto* obj = &ctx->dataPool[data.id];
    obj->unload();
}

void* _getAudioContext() {
    return &ctx;
}

int getInteger(Var param) {
    switch (param) {
        case Var::VoicesInUse: {
            uint32_t count = 0;
            for (uint32_t i = 0; i < Mixer::VoicesMaxCount; ++i) {
                if (ctx->voicePool[i].controlFlags & Voice_Running) {
                    ++count;
                }
            }
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
            return static_cast<int>(ctx->state);
        }
    }
    return 0;
}

Voice play(AudioData data, float gain, float pan, float pitch, bool loop, bool paused, Bus bus) {
    auto voice = ctx->getNextVoice();
    if (voice.id) {
        auto* obj = &ctx->voicePool[voice.id & iMask];
        obj->controlFlags = Voice_Running;
        if (loop) {
            obj->controlFlags |= Voice_Loop;
        }
        if (paused) {
            obj->controlFlags |= Voice_Paused;
        }
        obj->data = &ctx->dataPool[data.id].source;
        obj->gain = gain;
        obj->pan = pan;
        obj->pitch = pitch;
        obj->position = 0.0;
        obj->bus = bus.id;
    }
    return voice;
}

void stop(Voice voice) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        obj->stop();
    }
}

void stopAudioData(AudioData data) {
    const auto* dataSourcePtr = &ctx->dataPool[data.id].source;
    for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
        auto* voiceObj = &ctx->voicePool[i];
        if (voiceObj->data == dataSourcePtr) {
            voiceObj->stop();
        }
    }
}


/** Bus controls **/
void setBusVolume(Bus bus, float gain) {
    ctx->busLine[bus.id].gain = gain;
}

float getBusVolume(Bus bus) {
    return ctx->busLine[bus.id].gain;
}

void setBusEnabled(Bus bus, bool enabled) {
    ctx->busLine[bus.id].enabled = enabled;
}

bool getBusEnabled(Bus bus) {
    return ctx->busLine[bus.id].enabled;
}


/** Voice parameters control **/

bool isVoiceValid(Voice voice) {
    return ctx->getVoiceObj(voice) != nullptr;
}

uint32_t getVoiceState(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj ? obj->controlFlags : 0;
}

void setPan(Voice voice, float pan) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        obj->pan = pan;
    }
}

void setVolume(Voice voice, float gain) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        obj->gain = gain;
    }
}

void setPitch(Voice voice, float rate) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        obj->pitch = rate;
    }
}

void setPause(Voice voice, bool paused) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        auto isOnPause = (obj->controlFlags & Voice_Paused) != 0;
        if(isOnPause != paused) {
            obj->controlFlags ^= Voice_Paused;
        }
    }
}

void setLoop(Voice voice, bool loopMode) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        auto looping = (obj->controlFlags & Voice_Loop) != 0;
        if(looping != loopMode) {
            obj->controlFlags ^= Voice_Loop;
        }
    }
}

float getPan(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj ? obj->pan : 0.0f;
}

float getVolume(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj ? obj->gain : 1.0f;
}

float getPitch(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj ? obj->pitch : 1.0f;
}

bool getPause(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj != nullptr && (obj->controlFlags & Voice_Paused) != 0;
}

bool getLoop(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj != nullptr && (obj->controlFlags & Voice_Loop) != 0;
}

}
