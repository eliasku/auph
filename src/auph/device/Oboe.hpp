#pragma once

#include "AudioDevice.hpp"
#include <oboe/Oboe.h>
#include <android/log.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <jni.h>

#include <stdio.h>
#include <math.h>

// implement oboe-lib:
#include <oboe-all.cpp>

#undef LOGV
#undef LOGD
#undef LOGI
#undef LOGW
#undef LOGE
#undef LOGF
#undef ASSERT

#if 1

#ifdef MODULE_NAME
#undef MODULE_NAME
#endif

#define MODULE_NAME  "AUPH"

#define LOGV(...) __android_log_print(ANDROID_LOG_VERBOSE,MODULE_NAME,__VA_ARGS__)
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG,MODULE_NAME,__VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,MODULE_NAME,__VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN,MODULE_NAME,__VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR,MODULE_NAME,__VA_ARGS__)
#define LOGF(...) __android_log_print(ANDROID_LOG_FATAL,MODULE_NAME,__VA_ARGS__)
#define ASSERT(cond, ...) if (!(cond)) {__android_log_assert(#cond,MODULE_NAME,__VA_ARGS__);}

#else

#define LOGV(...)
#define LOGD(...)
#define LOGI(...)
#define LOGW(...)
#define LOGE(...)
#define LOGF(...)
#define ASSERT(cond, ...)

#endif

namespace auph {

static jobject _androidAssetManagerRef = nullptr;
static AAssetManager* _androidAssetManager = nullptr;
static jobject _androidActivity = nullptr;
static JNIEnv* _jniEnv = nullptr;

void setAndroidActivity(JNIEnv* env, jobject activity, jobject assetManager) {
    _jniEnv = env;
    if(_jniEnv) {
        if(activity) {
            _androidActivity = env->NewGlobalRef(activity);
        }
        if(assetManager) {
            _androidAssetManagerRef = env->NewGlobalRef(assetManager);
            if(_androidAssetManagerRef) {
                _androidAssetManager = AAssetManager_fromJava(env, _androidAssetManagerRef);
            }
        }
    }
}

class AudioDevice :
        public oboe::AudioStreamDataCallback,
        public oboe::AudioStreamErrorCallback {

public:
    static AudioDevice* instance;

    oboe::AudioStream* audioStream = nullptr;
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;
    AudioStreamInfo playbackStreamInfo{};
    std::mutex mLock{};

    bool onError(oboe::AudioStream* stream, oboe::Result error) {
        return false;
    }

    void onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) {
    }

    void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) {
        // Restart the stream if the error is a disconnect, otherwise do nothing and log the error
        // reason.
        if (error == oboe::Result::ErrorDisconnected) {
            LOGI("Restarting AudioStream");
            _restartStream();
        } else {
            LOGE("Error was %s", oboe::convertToText(error));
        }
    }

    oboe::DataCallbackResult onAudioReady(oboe::AudioStream* stream, void* audioData, int32_t numFrames) {
        if (onPlayback) {
            AudioDeviceCallbackData data;
            data.data = audioData;
            data.stream = playbackStreamInfo;
            data.userData = userData;
            data.frames = numFrames;
            onPlayback(&data);
        } else {
            memset(audioData, 0, numFrames * stream->getBytesPerFrame());
        }
        return oboe::DataCallbackResult::Continue;
    }

    AudioDevice() {
        AudioDevice::instance = this;
    }

    void _restartStream() {
        _openStream();
        if (audioStream != nullptr) {
            audioStream->requestStart();
        }
    }

    void _openStream() {
        audioStream = nullptr;
        //std::lock_guard<std::mutex> lock(mLock);
        oboe::AudioStreamBuilder builder{};
//        builder.setAudioApi(oboe::AudioApi::OpenSLES);
        builder.setDirection(oboe::Direction::Output);
        builder.setPerformanceMode(oboe::PerformanceMode::LowLatency);
        builder.setSharingMode(oboe::SharingMode::Exclusive);
        builder.setFormat(oboe::AudioFormat::I16);
        builder.setChannelCount(oboe::ChannelCount::Stereo);
        builder.setDataCallback(this);
        builder.setErrorCallback(this);
//        builder.setFramesPerDataCallback(128);

        oboe::Result result = builder.openStream(&audioStream);
        if (result != oboe::Result::OK) {
            LOGE("Failed to create stream. Error: %s", oboe::convertToText(result));
            return;
        }

        playbackStreamInfo.bytesPerFrame = audioStream->getBytesPerFrame();
        playbackStreamInfo.bytesPerSample = audioStream->getBytesPerSample();
        playbackStreamInfo.sampleRate = audioStream->getSampleRate();
        playbackStreamInfo.channels = audioStream->getChannelCount();
        playbackStreamInfo.format = SampleFormat_I16;
    }

    bool start() {
        _openStream();
        if (audioStream != nullptr) {
            auto result = audioStream->requestStart();
            if (result != oboe::Result::OK) {
                LOGE("Error starting playback stream. Error: %s", oboe::convertToText(result));
                audioStream->requestStop();
                audioStream = nullptr;
                return false;
            }

            if (_jniEnv && _androidActivity) {
                jclass cls = _jniEnv->FindClass("com/eliasku/auph/Auph");
                if (cls) {
                    jmethodID fn = _jniEnv->GetStaticMethodID(cls, "start", "(Landroid/app/Activity;)V");
                    if (fn) {
                        _jniEnv->CallStaticVoidMethod(cls, fn, _androidActivity);
                    } else {
                        LOGE("Error cannot get start() function");
                    }
                } else {
                    LOGE("Error cannot find Auph class");
                }
            }
            return true;
        }
        return false;
    }

    bool stop() {
        if (audioStream != nullptr) {
            if (_jniEnv && _androidActivity) {
                jclass cls = _jniEnv->FindClass("com/eliasku/auph/Auph");
                if (cls) {
                    jmethodID fn = _jniEnv->GetStaticMethodID(cls, "stop", "(Landroid/app/Activity;)V");
                    if (fn) {
                        _jniEnv->CallStaticVoidMethod(cls, fn, _androidActivity);
                    } else {
                        LOGE("Error cannot get stop() function");
                    }
                } else {
                    LOGE("Error cannot find Auph class");
                }
            }

            audioStream->close();
            audioStream = nullptr;
            return true;
        }
        return false;
    }

    ~AudioDevice() {
        userData = nullptr;
        onPlayback = nullptr;
        stop();
        instance = nullptr;
    }
};

AudioDevice* AudioDevice::instance = nullptr;

}

extern "C" JNIEXPORT jint
JNICALL Java_com_eliasku_auph_Auph_restart(JNIEnv* env, jclass clazz) {
    auto* device = auph::AudioDevice::instance;
    if (device) {
        if (device->stop()) {
            if (device->start()) {
                return 0;
            }
            return 1;
        }
        return 2;
    }
    return 3;
}


