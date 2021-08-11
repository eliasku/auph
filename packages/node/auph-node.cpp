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
    return Napi::Number::New(env, data.id);
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

void stopBuffer(const Napi::CallbackInfo& info) {
    const uint32_t voiceHandle = _toSMI(info[0], 0);
    auph::stopBuffer({voiceHandle});
}

/** Voice controls **/

void setVoiceParam(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t param = _toSMI(info[1], 0);
    const float value = _toFloat(info[2], 0.0f);
    auph::setVoiceParam({name}, (auph::VoiceParam) param, value);
}

Napi::Value getVoiceParam(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t param = _toSMI(info[1], 0);
    const float value = auph::getVoiceParam({name}, (auph::VoiceParam) param);
    return Napi::Number::New(info.Env(), value);
}

void setVoiceFlag(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t flag = _toSMI(info[1], 0);
    const bool value = _toBool(info[2], false);
    auph::setVoiceFlag({name}, (auph::VoiceFlag) flag, value);
}

//uint32_t getVoiceState(Voice voice);
Napi::Value getVoiceState(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t value = auph::getVoiceState({name});
    return Napi::Number::New(info.Env(), value);
}

//bool getVoiceFlag(Voice voice, VoiceFlag flag)
Napi::Value getVoiceFlag(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t flag = _toSMI(info[1], 0);
    const bool value = auph::getVoiceFlag({name}, (auph::VoiceFlag) flag);
    return Napi::Boolean::New(info.Env(), value);
}

/** Bus controls **/

void setBusParam(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t param = _toSMI(info[1], 0);
    const float value = _toFloat(info[2], false);
    auph::setBusParam({name}, (auph::BusParam) param, value);
}

//float getBusParam(Bus bus, BusParam param);
Napi::Value getBusParam(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t param = _toSMI(info[1], 0);
    const uint32_t value = auph::getBusParam({name}, (auph::BusParam) param);
    return Napi::Number::New(info.Env(), value);
}

void setBusFlag(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t flag = _toSMI(info[1], 0);
    const bool value = _toBool(info[2], false);
    auph::setBusFlag({name}, (auph::BusFlag) flag, value);
}

//bool getBusFlag(Bus bus, BusFlag flag);
Napi::Value getBusFlag(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t flag = _toSMI(info[1], 0);
    const bool value = auph::getBusFlag({name}, (auph::BusFlag) flag);
    return Napi::Boolean::New(info.Env(), value);
}

/** Buffer control **/

//uint32_t getBufferState(Buffer buffer)
Napi::Value getBufferState(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t value = auph::getBufferState({name});
    return Napi::Number::New(info.Env(), value);
}

//bool getBufferFlag(Buffer buffer, BufferFlag flag);
Napi::Value getBufferFlag(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t flag = _toSMI(info[1], 0);
    const bool value = auph::getBufferFlag({name}, (auph::BufferFlag) flag);
    return Napi::Boolean::New(info.Env(), value);
}

//float getBufferParam(Buffer buffer, BufferParam param);
Napi::Value getBufferParam(const Napi::CallbackInfo& info) {
    const uint32_t name = _toSMI(info[0], 0);
    const uint32_t param = _toSMI(info[1], 0);
    const uint32_t value = auph::getBufferParam({name}, (auph::BufferParam) param);
    return Napi::Number::New(info.Env(), value);
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
    exports.Set(Napi::String::New(env, "stopBuffer"), Napi::Function::New(env, stopBuffer));

    exports.Set(Napi::String::New(env, "setVoiceParam"), Napi::Function::New(env, setVoiceParam));
    exports.Set(Napi::String::New(env, "getVoiceParam"), Napi::Function::New(env, getVoiceParam));
    exports.Set(Napi::String::New(env, "setVoiceFlag"), Napi::Function::New(env, setVoiceFlag));
    exports.Set(Napi::String::New(env, "getVoiceState"), Napi::Function::New(env, getVoiceState));
    exports.Set(Napi::String::New(env, "getVoiceFlag"), Napi::Function::New(env, getVoiceFlag));
    exports.Set(Napi::String::New(env, "setBusParam"), Napi::Function::New(env, setBusParam));
    exports.Set(Napi::String::New(env, "getBusParam"), Napi::Function::New(env, getBusParam));
    exports.Set(Napi::String::New(env, "setBusFlag"), Napi::Function::New(env, setBusFlag));
    exports.Set(Napi::String::New(env, "getBusFlag"), Napi::Function::New(env, getBusFlag));
    exports.Set(Napi::String::New(env, "getBufferState"), Napi::Function::New(env, getBufferState));
    exports.Set(Napi::String::New(env, "getBufferFlag"), Napi::Function::New(env, getBufferFlag));
    exports.Set(Napi::String::New(env, "getBufferParam"), Napi::Function::New(env, getBufferParam));

    return exports;
}

}

NODE_API_MODULE(Auph, Auph
)