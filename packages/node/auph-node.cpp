#include <napi.h>
#include <auph/auph.hpp>

#define AUPH_OGG
#define AUPH_WAV
#define AUPH_MP3

#include <auph/auph_impl.hpp>

namespace {

uint32_t _toSMI(const Napi::Value value, uint32_t defValue) {
    return value.IsNumber() ? value.As<Napi::Number>().Uint32Value() : defValue;
}

float _toFloat(const Napi::Value value, float defValue) {
    return value.IsNumber() ? value.As<Napi::Number>().FloatValue() : defValue;
}

bool _toBool(const Napi::Value value, bool defValue) {
    return value.IsBoolean() ? value.As<Napi::Boolean>().Value() : defValue;
}

void init(const Napi::CallbackInfo& info) {
    auph::init();
}

void shutdown(const Napi::CallbackInfo& info) {
    auph::shutdown();
}

void resume(const Napi::CallbackInfo& info) {
    auph::resume();
}

void pause(const Napi::CallbackInfo& info) {
    auph::pause();
}

Napi::Value load(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Wrong number of arguments")
                .ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    const char* filepath = info[0].As<Napi::String>().Utf8Value().c_str();
    bool streaming = _toBool(info[1], false);
    auto data = auph::load(filepath, streaming);
    Napi::Number dataHandle = Napi::Number::New(env, data.id);
    return dataHandle;
}

void unload(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return;
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return;
    }

    auto handle = info[0].As<Napi::Number>().Uint32Value();
    auph::unload({handle});
}

Napi::Value play(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auph::Voice voice{};

    auto dataHandle = _toSMI(info[0], 0);
    float gain = _toFloat(info[1], 1.0f);
    float pan = _toFloat(info[2], 0.0f);
    float pitch = _toFloat(info[3], 1.0f);
    bool loop = _toBool(info[4], false);
    bool pause = _toBool(info[5], false);
    uint32_t busIndex = _toSMI(info[6], auph::Bus_Sound.id);

    if (dataHandle) {
        voice = auph::play({dataHandle}, gain, pan, pitch, loop, pause, {busIndex});
    }

    return Napi::Number::New(env, voice.id);
}

void stop(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    auph::stop({voiceHandle});
}

void stopAudioData(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    auph::stopAudioData({voiceHandle});
}


/** Voice parameters control **/

Napi::Value isVoiceValid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const bool value = auph::isVoiceValid({voiceHandle});
    return Napi::Boolean::New(env, value);
}

Napi::Value getVoiceState(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const uint32_t value = auph::getVoiceState({voiceHandle});
    return Napi::Number::New(env, value);
}

void setPan(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = _toFloat(info[1], 0.0f);
    auph::setPan({voiceHandle}, value);
}

void setVolume(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = _toFloat(info[1], 1.0f);
    auph::setVolume({voiceHandle}, value);
}

void setPitch(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = _toFloat(info[1], 1.0f);
    auph::setPitch({voiceHandle}, value);
}

void setPause(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const bool value = _toBool(info[1], false);
    auph::setPause({voiceHandle}, value);
}

void setLoop(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const bool value = _toBool(info[1], false);
    auph::setLoop({voiceHandle}, value);
}

Napi::Value getPan(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = auph::getPan({voiceHandle});
    return Napi::Number::New(env, value);
}

Napi::Value getVolume(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = auph::getVolume({voiceHandle});
    return Napi::Number::New(env, value);
}

Napi::Value getPitch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const float value = auph::getPitch({voiceHandle});
    return Napi::Number::New(env, value);
}

Napi::Value getPause(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const bool value = auph::getPause({voiceHandle});
    return Napi::Boolean::New(env, value);
}

Napi::Value getLoop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    const bool value = auph::getLoop({voiceHandle});
    return Napi::Boolean::New(env, value);
}

Napi::Object Auph(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, init));
    exports.Set(Napi::String::New(env, "shutdown"), Napi::Function::New(env, shutdown));
    exports.Set(Napi::String::New(env, "resume"), Napi::Function::New(env, resume));
    exports.Set(Napi::String::New(env, "pause"), Napi::Function::New(env, pause));
    exports.Set(Napi::String::New(env, "load"), Napi::Function::New(env, load));
    exports.Set(Napi::String::New(env, "unload"), Napi::Function::New(env, unload));
    exports.Set(Napi::String::New(env, "play"), Napi::Function::New(env, play));
    exports.Set(Napi::String::New(env, "stop"), Napi::Function::New(env, stop));
    exports.Set(Napi::String::New(env, "stopAudioData"), Napi::Function::New(env, stopAudioData));
    exports.Set(Napi::String::New(env, "isVoiceValid"), Napi::Function::New(env, isVoiceValid));
    exports.Set(Napi::String::New(env, "getVoiceState"), Napi::Function::New(env, getVoiceState));
    exports.Set(Napi::String::New(env, "setPan"), Napi::Function::New(env, setPan));
    exports.Set(Napi::String::New(env, "setVolume"), Napi::Function::New(env, setVolume));
    exports.Set(Napi::String::New(env, "setPitch"), Napi::Function::New(env, setPitch));
    exports.Set(Napi::String::New(env, "setPause"), Napi::Function::New(env, setPause));
    exports.Set(Napi::String::New(env, "setLoop"), Napi::Function::New(env, setLoop));
    exports.Set(Napi::String::New(env, "getPan"), Napi::Function::New(env, getPan));
    exports.Set(Napi::String::New(env, "getVolume"), Napi::Function::New(env, getVolume));
    exports.Set(Napi::String::New(env, "getPitch"), Napi::Function::New(env, getPitch));
    exports.Set(Napi::String::New(env, "getPause"), Napi::Function::New(env, getPause));
    exports.Set(Napi::String::New(env, "getLoop"), Napi::Function::New(env, getLoop));
    return exports;
}

}

NODE_API_MODULE(Auph, Auph
)