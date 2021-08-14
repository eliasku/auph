#include <napi.h>
#include <auph/auph.hpp>

#define AUPH_OGG
#define AUPH_WAV
#define AUPH_MP3

#include <auph/auph_impl.hpp>

namespace {

int _toSMI(const Napi::Value value, int defValue) {
    return value.IsNumber() ? value.As<Napi::Number>().Int32Value() : defValue;
}

void init(const Napi::CallbackInfo& info) {
    auph::init();
}

void shutdown(const Napi::CallbackInfo& info) {
    auph::shutdown();
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
    int flags = _toSMI(info[1], 0);
    auto data = auph::load(filepath, flags);
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

    auto handle = info[0].As<Napi::Number>().Int32Value();
    auph::unload({handle});
}

Napi::Value voice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    const int buffer = _toSMI(info[0], 0);
    const int gain = _toSMI(info[1], auph::Unit);
    const int pan = _toSMI(info[2], auph::Unit);
    const int rate = _toSMI(info[3], auph::Unit);
    const int flags = _toSMI(info[4], auph::Flag_Running);
    const int bus = _toSMI(info[6], 0);

    const auph::Voice voice = auph::voice({buffer}, gain, pan, rate, flags, {bus});
    return Napi::Number::New(env, voice.id);
}

void stop(const Napi::CallbackInfo& info) {
    const int name = _toSMI(info[0], 0);
    auph::stop(name);
}

/** Voice controls **/

void set(const Napi::CallbackInfo& info) {
    const int name = _toSMI(info[0], 0);
    const int param = _toSMI(info[1], 0);
    const int value = _toSMI(info[2], 0);
    auph::set(name, param, value);
}

Napi::Value get(const Napi::CallbackInfo& info) {
    const int name = _toSMI(info[0], 0);
    const int param = _toSMI(info[1], 0);
    const int value = auph::get(name, param);
    return Napi::Number::New(info.Env(), value);
}

Napi::Object exportAuph(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, init));
    exports.Set(Napi::String::New(env, "shutdown"), Napi::Function::New(env, shutdown));
    exports.Set(Napi::String::New(env, "load"), Napi::Function::New(env, load));
    exports.Set(Napi::String::New(env, "unload"), Napi::Function::New(env, unload));
    exports.Set(Napi::String::New(env, "voice"), Napi::Function::New(env, voice));
    exports.Set(Napi::String::New(env, "stop"), Napi::Function::New(env, stop));
    exports.Set(Napi::String::New(env, "set"), Napi::Function::New(env, set));
    exports.Set(Napi::String::New(env, "get"), Napi::Function::New(env, get));
    return exports;
}

}

NODE_API_MODULE(auph, exportAuph)