#include <napi.h>
#include <auph/auph.hpp>

#define AUPH_OGG
#define AUPH_WAV
#define AUPH_MP3

#include <auph/auph_impl.hpp>

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

    if (!info[0].IsString() || !info[1].IsBoolean()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    const char* filepath = info[0].As<Napi::String>().Utf8Value().c_str();
    bool streaming = info[1].As<Napi::Boolean>().Value();
    auto data = auph::load(filepath, streaming);
    Napi::Number dataHandle = Napi::Number::New(env, data.id);
    return dataHandle;
}

void unload(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments")
                .ThrowAsJavaScriptException();
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

    auto dataHandle = info[0].IsNumber() ? info[0].As<Napi::Number>().Uint32Value() : 0;
    float gain = info[1].IsNumber() ? info[1].As<Napi::Number>().FloatValue() : 1.0f;
    float pan = info[2].IsNumber() ? info[2].As<Napi::Number>().FloatValue() : 0.0f;
    float pitch = info[3].IsNumber() ? info[3].As<Napi::Number>().FloatValue() : 1.0f;
    bool loop = info[4].IsBoolean() ? info[4].As<Napi::Boolean>().Value() : false;
    bool pause = info[5].IsBoolean() ? info[5].As<Napi::Boolean>().Value() : false;
    uint32_t busIndex = info[6].IsNumber() ? info[6].As<Napi::Number>().Uint32Value() : auph::Bus_Sound.id;

    if (dataHandle) {
        voice = auph::play({dataHandle}, gain, pan, pitch, loop, pause, {busIndex});
    }

    return Napi::Number::New(env, voice.id);
}

void stop(const Napi::CallbackInfo& info) {
    uint32_t voiceHandle = info[0].IsNumber() ? info[0].As<Napi::Number>().Uint32Value() : 0;
    if (voiceHandle) {
        auph::stop({voiceHandle});
    }
}

Napi::Object Auph(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"),
                Napi::Function::New<init>(env));
    exports.Set(Napi::String::New(env, "shutdown"),
                Napi::Function::New<shutdown>(env));
    exports.Set(Napi::String::New(env, "resume"),
                Napi::Function::New<resume>(env));
    exports.Set(Napi::String::New(env, "pause"),
                Napi::Function::New<pause>(env));

    exports.Set(Napi::String::New(env, "load"),
                Napi::Function::New(env, load));
    exports.Set(Napi::String::New(env, "unload"),
                Napi::Function::New<unload>(env));

    exports.Set(Napi::String::New(env, "play"),
                Napi::Function::New(env, play));
    exports.Set(Napi::String::New(env, "stop"),
                Napi::Function::New<stop>(env));

    return exports;
}

NODE_API_MODULE(Auph, Auph
)