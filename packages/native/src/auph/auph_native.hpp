#pragma once

#include "device/AudioDevice_impl.hpp"
#include "engine/Mixer.hpp"
#include "engine/BufferLoaders.hpp"
#include "auph.hpp"

namespace auph {

constexpr uint32_t AudioSourcesMaxCount = 128;

struct Context {
    AudioDevice device{};
    Mixer mixer{};
    uint32_t state = 0;
    BufferObj buffers[AudioSourcesMaxCount];
    VoiceObj voices[Mixer::VoicesMaxCount];
    BusObj busLine[4]{};

    Context() {
        mixer.voices = voices;
        mixer.busLine = busLine;
        device.onPlayback = Mixer::playback;
        device.userData = &mixer;
        state = Mixer_Active;
    }

    BufferObj* getBufferObj(Buffer name) {
        const auto index = name.id & iMask;
        if (index > 0 && index < AudioSourcesMaxCount) {
            auto* obj = buffers + index;
            if (obj->version == (name.id & vMask)) {
                return obj;
            }
        }
        return nullptr;
    }

    VoiceObj* getVoiceObj(Voice name) {
        const auto index = name.id & iMask;
        if (index > 0 && index < Mixer::VoicesMaxCount) {
            auto* obj = voices + index;
            if (obj->version == (name.id & vMask)) {
                return obj;
            }
        }
        return nullptr;
    }

    [[nodiscard]]
    Voice getNextVoice() const {
        for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
            const auto* obj = voices + i;
            if (obj->data == nullptr) {
                return {i | obj->version};
            }
        }
        return {0};
    }
};

Context* ctx = nullptr;

void init() {
    if (!ctx) {
        ctx = new Context();
        ctx->state = Mixer_Active;
    }
}

void resume() {
    if (ctx) {
        ctx->device.start();
        ctx->state = Mixer_Active | Mixer_Running;
    }
}

void pause() {
    if (ctx) {
        ctx->device.stop();
        ctx->state = Mixer_Active;
    }
}

void shutdown() {
    ctx->state = 0;
    delete ctx;
    ctx = nullptr;
}

void* _getAudioContext() {
    return &ctx;
}

int getMixerParam(MixerParam param) {
    switch (param) {
        case MixerParam::VoicesInUse: {
            int count = 0;
            for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
                if (ctx->voices[i].state & Voice_Running) {
                    ++count;
                }
            }
            return count;
        }
        case MixerParam::StreamsInUse: {
            return 0;//getStreamPlayersCount();
        }
        case MixerParam::BuffersLoaded: {
            return 0;
        }
        case MixerParam::StreamsLoaded: {
            return 0;
        }
        case MixerParam::SampleRate: {
            // TODO:
            return 44100;
        }
    }
    return 0;
}

uint32_t getMixerState() {
    return ctx->state;
}

Buffer load(const char* filepath, bool streaming) {
    for (uint32_t i = 1; i < AudioSourcesMaxCount; ++i) {
        auto* src = &ctx->buffers[i];
        // data slot is free
        if (src->state == 0) {
            // data slot is loading
            if (src->load(filepath, streaming)) {
                return {i | src->version};
            }
        }
    }
    return {0};
}

void unload(Buffer buffer) {
    auto* obj = ctx->getBufferObj(buffer);
    if (obj) {
        obj->unload();
    }
}

Voice play(Buffer buffer, float gain, float pan, float pitch, bool loop, bool paused, Bus bus) {
    auto* bufferObj = ctx->getBufferObj(buffer);
    if (!bufferObj) {
        return {0};
    }
    const auto voice = ctx->getNextVoice();
    if (!voice.id) {
        return {0};
    }
    auto* obj = &ctx->voices[voice.id & iMask];
    obj->state = Voice_Active;
    if (loop) {
        obj->state |= Voice_Loop;
    }
    if (!paused) {
        obj->state |= Voice_Running;
    }
    obj->data = &bufferObj->data;
    obj->gain = gain;
    obj->pan = pan;
    obj->pitch = pitch;
    obj->position = 0.0;
    obj->bus = bus;
    return voice;
}

void stop(Voice voice) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        obj->stop();
    }
}

void stopBuffer(Buffer buffer) {
    const auto* bufferObj = ctx->getBufferObj(buffer);
    if (!bufferObj) {
        return;
    }
    const auto* pDataSource = &bufferObj->data;
    for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
        auto* voiceObj = &ctx->voices[i];
        if (voiceObj->data == pDataSource) {
            voiceObj->stop();
        }
    }
}

void setVoiceParam(Voice voice, VoiceParam param, float value) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        switch (param) {
            case VoiceParam::Gain:
                obj->gain = value;
                break;
            case VoiceParam::Pan:
                obj->pan = value;
                break;
            case VoiceParam::Rate:
                obj->pitch = value;
                break;
            case VoiceParam::Duration:
                // NO-OP
                break;
            case VoiceParam::CurrentTime:
                // TODO: convert to seconds
                obj->position = value;
                break;
        }
    }
}

float getVoiceParam(Voice voice, VoiceParam param) {
    const auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        switch (param) {
            case VoiceParam::Gain:
                return obj->gain;
            case VoiceParam::Pan:
                return obj->pan;
            case VoiceParam::Rate:
                return obj->pitch;
            case VoiceParam::Duration:
                // TODO:
                return 0.0f;
            case VoiceParam::CurrentTime:
                // TODO: convert to seconds
                return (float) obj->position;
        }
    }
    return 0.0f;
}

void setVoiceFlag(Voice voice, VoiceFlag flag, bool value) {
    auto* obj = ctx->getVoiceObj(voice);
    if (obj) {
        const bool was = (obj->state & flag) != 0;
        if (was != value) {
            obj->state ^= (uint32_t) flag;
        }
    }
}

uint32_t getVoiceState(Voice voice) {
    const auto* obj = ctx->getVoiceObj(voice);
    return obj ? obj->state : 0;
}

bool getVoiceFlag(Voice voice, VoiceFlag flag) {
    return (getVoiceState(voice) & flag) != 0;
}

/** Bus controls **/

void setBusParam(Bus bus, BusParam param, float value) {
    auto* obj = ctx->busLine + bus.id;
    if (obj) {
        switch (param) {
            case BusParam::Gain:
                obj->gain = value;
                break;
        }
    }
}

float getBusParam(Bus bus, BusParam param) {
    auto* obj = ctx->busLine + bus.id;
    if (obj) {
        switch (param) {
            case BusParam::Gain:
                return obj->gain;
        }
    }
    return 0.0;
}

void setBusFlag(Bus bus, BusFlag flag, bool value) {
    auto* obj = ctx->busLine + bus.id;
    if (obj) {
        const bool was = (obj->state & flag) != 0;
        if (was != value) {
            obj->state ^= (uint32_t) flag;
        }
    }
}

bool getBusFlag(Bus bus, BusFlag flag) {
    auto* obj = ctx->busLine + bus.id;
    return obj ? (obj->state & flag) != 0 : false;
}

uint32_t getBufferState(Buffer buffer) {
    auto* obj = ctx->getBufferObj(buffer);
    return obj ? obj->state : 0;
}

bool getBufferFlag(Buffer buffer, BufferFlag flag) {
    return (getBufferState(buffer) & flag) != 0;
}

float getBufferParam(Buffer buffer, BufferParam param) {
    auto* obj = ctx->getBufferObj(buffer);
    if (obj) {
        switch (param) {
            case BufferParam::Duration:
                // TODO:
                return 0.0f;
        }
    }
    return 0.0f;
}

}
