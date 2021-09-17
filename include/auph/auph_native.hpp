#pragma once

#include "device/AudioDevice_impl.hpp"
#include "engine/Mixer.hpp"
#include "engine/BufferImpl.hpp"
#include "auph_interface.hpp"

namespace auph {

constexpr int BuffersMaxCount = 128;

struct Context {
    AudioDevice device{};
    Mixer mixer{};
    int state = 0;
    BufferObj buffers[BuffersMaxCount];
    VoiceObj voices[Mixer::VoicesMaxCount];
    BusObj busLine[4]{};

    Context() {
        mixer.voices = voices;
        mixer.busLine = busLine;
        device.onPlayback = Mixer::playback;
        device.userData = &mixer;
        state = Flag_Active;

        for (int i = 1; i < BuffersMaxCount; ++i) {
            buffers[i].id = Type_Buffer | i;
        }
        for (int i = 1; i < Mixer::VoicesMaxCount; ++i) {
            voices[i].id = Type_Voice | i;
        }
        for (int i = 0; i < 4; ++i) {
            busLine[i].id = Type_Bus | i;
        }
    }

    BufferObj* getBufferObj(int name) {
        const auto index = name & iMask;
        if (index > 0 && index < BuffersMaxCount) {
            auto* obj = buffers + index;
            if (obj->id == name) {
                return obj;
            }
        }
        return nullptr;
    }

    VoiceObj* getVoiceObj(int name) {
        const auto index = name & iMask;
        if (index > 0 && index < Mixer::VoicesMaxCount) {
            auto* obj = voices + index;
            if (obj->id == name) {
                return obj;
            }
        }
        return nullptr;
    }

    [[nodiscard]]
    int getNextVoice() const {
        for (int i = 1; i < Mixer::VoicesMaxCount; ++i) {
            const auto* obj = voices + i;
            if (!obj->state) {
                return obj->id;
            }
        }
        return 0;
    }

    int getNextBuffer() const {
        for (int i = 1; i < BuffersMaxCount; ++i) {
            const auto* obj = buffers + i;
            // data slot is free
            if (!obj->state) {
                return obj->id;
            }
        }
        return 0;
    }

    BusObj* getBusObj(int name) {
        const auto index = name & iMask;
        if (index >= 0 && index < 4) {
            auto* obj = busLine + index;
            if (obj->id == name) {
                return obj;
            }
        }
        return nullptr;
    }
};

Context* ctx = nullptr;

void init() {
    if (!ctx) {
        ctx = new Context();
        ctx->state = Flag_Active;
    }
}

void shutdown() {
    ctx->device.stop();
    ctx->state = 0;
    delete ctx;
    ctx = nullptr;
}

void set(int name, int param, int value) {
    if (name == 0) {
        return;
    }

    if (name == hMixer && (param & Param_Flags) && (param & Flag_Running)) {
        if (ctx) {
            if (!value && (ctx->state & Flag_Running)) {
                ctx->state ^= Flag_Running;
                ctx->device.stop();
            } else if (value && !(ctx->state & Flag_Running)) {
                ctx->state ^= Flag_Running;
                ctx->device.start();
            }
        }
    }

    const auto type = name & tMask;
    if (type == Type_Voice) {
        auto* obj = ctx->getVoiceObj(name);
        if (obj) {
            if (param & Param_Flags) {
                const auto enabled = value != 0;
                if (param & Flag_Running) {
                    if ((obj->state & Flag_Running) != enabled) {
                        obj->state ^= Flag_Running;
                    }
                } else if (param & Flag_Loop) {
                    if ((obj->state & Flag_Loop) != enabled) {
                        obj->state ^= Flag_Loop;
                    }
                }
            } else {
                switch (param) {
                    case Param_Gain:
                        obj->gain = value;
                        break;
                    case Param_Pan:
                        obj->pan = value;
                        break;
                    case Param_Rate:
                        obj->rate = value;
                        break;
                    case Param_CurrentTime:
                        // TODO: convert to seconds
                        obj->position = value;
                        break;
                    default:
                        break;
                }
            }
        }
    } else if (type == Type_Bus) {
        auto* obj = ctx->getBusObj(name);
        if (obj) {
            if (param & Param_Flags) {
                if (param & Flag_Running) {
                    const bool was = (obj->state & Flag_Running) != 0;
                    if (was != (value != 0)) {
                        obj->state ^= Flag_Running;
                    }
                }
            } else {
                switch (param) {
                    case Param_Gain:
                        if (obj->gain != value) {
                            obj->gain = value;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

int get(int name, int param) {
    if (name == 0 || !ctx) {
        return 0;
    }
    if (name == hMixer) {
        if (param == Param_State) {
            return ctx->state;
        } else if (param == Param_SampleRate) {
            // TODO:
            return 44100;
        }
        return 0;
    }
    const int type = name & tMask;
    if ((param & Param_Count) && !(name & iMask)) {
        const auto stateMask = param & Param_StateMask;
        int count = 0;
        if (type == Type_Voice) {
            for (int i = 1; i < Mixer::VoicesMaxCount; ++i) {
                if ((ctx->voices[i].state & stateMask) == stateMask) {
                    ++count;
                }
            }
        } else if (type == Type_Bus) {
            for (int i = 0; i < 4; ++i) {
                if ((ctx->busLine[i].state & stateMask) == stateMask) {
                    ++count;
                }
            }
        } else if (type == Type_Buffer) {
            for (int i = 1; i < BuffersMaxCount; ++i) {
                if ((ctx->buffers[i].state & stateMask) == stateMask) {
                    ++count;
                }
            }
        }
        return count;
    }

    if (type == Type_Voice) {
        const auto* obj = ctx->getVoiceObj(name);
        if (obj) {
            switch (param) {
                case Param_State:
                    return obj->state;
                case Param_Gain:
                    return obj->gain;
                case Param_Pan:
                    return obj->pan;
                case Param_Rate:
                    return obj->rate;
                case Param_Duration:
                    // TODO:
                    return 0.0;
                case Param_CurrentTime:
                    // TODO: convert to seconds
                    //return (int)(obj->position * Unit);
                    return (int) obj->position;
                default:
                    //warn("not supported");
                    break;
            }
        }
        return 0;
    } else if (type == Type_Bus) {
        const auto* obj = ctx->getBusObj(name);
        if (obj) {
            switch (param) {
                case Param_State:
                    return obj->state;
                case Param_Gain:
                    return obj->gain;
                default:
                    //warn("not supported");
                    break;
            }
        }
        return 0;
    } else if (type == Type_Buffer) {
        const auto* obj = ctx->getBufferObj(name);
        if (obj) {
            switch (param) {
                case Param_State:
                    return obj->state;
                case Param_Duration:
                    return (int) obj->data.length;
                default:
                    //warn("param not supported");
                    break;
            }
        }
        return 0;
    }
    return 0;
}

Buffer load(const char* filepath, int flags) {
    auto id = ctx->getNextBuffer();
    if (id) {
        auto* buf = ctx->getBufferObj(id);
        if (buf && buf->load(filepath, flags)) {
            return {id};
        }
    }
    return {0};
}

Buffer loadMemory(const void* data, int size, int flags) {
    if (data && size > 4) {
        auto id = ctx->getNextBuffer();
        if (id) {
            auto* buf = ctx->getBufferObj(id);
            if (buf && buf->loadFromMemory(data, (uint32_t) size, flags)) {
                return {id};
            }
        }
    }
    return {0};
}

void unload(Buffer buffer) {
    auto* obj = ctx->getBufferObj(buffer.id);
    if (obj) {
        obj->unload();
    }
}

Voice voice(Buffer buffer, int gain, int pan, int rate, int flags, Bus bus) {
    auto* bufferObj = ctx->getBufferObj(buffer.id);
    if (!bufferObj) {
        return {0};
    }
    const auto voice = ctx->getNextVoice();
    if (!voice) {
        return {0};
    }
    auto* obj = &ctx->voices[voice & iMask];
    obj->state = Flag_Active;
    if (flags & Flag_Loop) {
        obj->state |= Flag_Loop;
    }
    if (flags & Flag_Running) {
        obj->state |= Flag_Running;
    }
    obj->data = &bufferObj->data;
    obj->gain = gain;
    obj->pan = pan;
    obj->rate = rate;
    obj->position = 0.0;
    obj->bus = bus.id != 0 ? bus : DefaultBus;
    return {voice};
}

void stop(int name) {
    const auto type = name & tMask;
    if (type == Type_Voice) {
        auto* obj = ctx->getVoiceObj(name);
        if (obj) {
            obj->stop();
        }
    } else if (type == Type_Buffer) {
        const auto* bufferObj = ctx->getBufferObj(name);
        if (bufferObj) {
            const auto* pDataSource = &bufferObj->data;
            for (uint32_t i = 1; i < Mixer::VoicesMaxCount; ++i) {
                auto* voiceObj = &ctx->voices[i];
                if (voiceObj->data == pDataSource) {
                    voiceObj->stop();
                }
            }
        }
    }
}

int vibrate(int durationMillis) {
    return AudioDevice::vibrate(durationMillis);
}

}
