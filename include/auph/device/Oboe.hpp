#pragma once

#include "AudioDevice.hpp"
#include <oboe/Oboe.h>
#include <android/log.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <jni.h>

#include <stdio.h>
#include <math.h>

#ifndef OBOE_NULL

// implement oboe-lib:
#include <oboe-all.cpp>

#endif

//#if defined(NDEBUG)
//
//#define AUPH_ALOGV(...)
//#define AUPH_ALOGD(...)
//#define AUPH_ALOGI(...)
//#define AUPH_ALOGW(...)
//#define AUPH_ALOGE(...)
//#define AUPH_ALOGF(...)
//#define AUPH_AASSERT(cond, ...)
//
//#else

#define AUPH_ALOGV(...) __android_log_print(ANDROID_LOG_VERBOSE,"AUPH",__VA_ARGS__)
#define AUPH_ALOGD(...) __android_log_print(ANDROID_LOG_DEBUG,"AUPH",__VA_ARGS__)
#define AUPH_ALOGI(...) __android_log_print(ANDROID_LOG_INFO,"AUPH",__VA_ARGS__)
#define AUPH_ALOGW(...) __android_log_print(ANDROID_LOG_WARN,"AUPH",__VA_ARGS__)
#define AUPH_ALOGE(...) __android_log_print(ANDROID_LOG_ERROR,"AUPH",__VA_ARGS__)
#define AUPH_ALOGF(...) __android_log_print(ANDROID_LOG_FATAL,"AUPH",__VA_ARGS__)
#define AUPH_AASSERT(cond, ...) if (!(cond)) {__android_log_assert(#cond,"AUPH",__VA_ARGS__);}

//#endif

namespace auph {

inline jobject _androidAssetManagerRef = nullptr;
inline AAssetManager *_androidAssetManager = nullptr;
inline jobject _androidActivity = nullptr;

typedef JNIEnv *(*GetJNIEnv)();

inline GetJNIEnv _getJNIEnv = nullptr;

void setAndroidActivity(GetJNIEnv getJNIEnv, jobject activity, jobject assetManager) {
    _getJNIEnv = getJNIEnv;
    if (getJNIEnv) {
        auto *env = getJNIEnv();
        if (env) {
            if (activity) {
                _androidActivity = env->NewGlobalRef(activity);
            }
            if (assetManager) {
                _androidAssetManagerRef = env->NewGlobalRef(assetManager);
                if (_androidAssetManagerRef) {
                    _androidAssetManager = AAssetManager_fromJava(env, _androidAssetManagerRef);
                }
            }
        }
    }
}

#ifndef OBOE_NULL
class AudioDevice :
        public oboe::AudioStreamDataCallback,
        public oboe::AudioStreamErrorCallback {

public:
    static AudioDevice *instance;

    oboe::AudioStream *audioStream = nullptr;
    AudioDeviceCallback onPlayback = nullptr;
    void *userData = nullptr;
    AudioStreamInfo playbackStreamInfo{};
    std::mutex mLock{};

    bool onError(oboe::AudioStream *stream, oboe::Result error) override {
        (void) stream;
        (void) error;
        return false;
    }

    void onErrorBeforeClose(oboe::AudioStream *stream, oboe::Result error) override {
        (void) stream;
        (void) error;
    }

    void onErrorAfterClose(oboe::AudioStream *stream, oboe::Result error) override {
        (void) stream;
        // Restart the stream if the error is a disconnect, otherwise do nothing and log the error
        // reason.
        if (error == oboe::Result::ErrorDisconnected) {
            AUPH_ALOGI("AudioStream disconnected. Restart if is active currently");
            if (audioStream != nullptr) {
                AUPH_ALOGI("Restart disconnected AudioStream, because stream should be active");
                _reopenAndStartStream();
            }
        } else {
            AUPH_ALOGE("Error was %s", oboe::convertToText(error));
        }
    }

    oboe::DataCallbackResult onAudioReady(oboe::AudioStream *stream, void *audioData, int32_t numFrames) override {
        // prevent OpenSLES case, `audioData` could be null or no frames are required
        // https://github.com/google/oboe/issues/559
        if (audioData == nullptr || numFrames <= 0) {
            return oboe::DataCallbackResult::Continue;
        }
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

    bool _reopenAndStartStream() {
        _openStream();
        if (audioStream == nullptr) {
            return false;
        }
        const auto result = audioStream->requestStart();
        if (result != oboe::Result::OK) {
            AUPH_ALOGE("Error starting playback stream after disconnection. Error: %s",
                       oboe::convertToText(result));
            audioStream->close();
            audioStream = nullptr;
            return false;
        }
        return true;
    }

    void _openStream() {
        audioStream = nullptr;
        //std::lock_guard<std::mutex> lock(mLock);
        oboe::AudioStreamBuilder builder{};
        //builder.setAudioApi(oboe::AudioApi::OpenSLES);
        builder.setDirection(oboe::Direction::Output);
        builder.setPerformanceMode(oboe::PerformanceMode::LowLatency);
        builder.setSharingMode(oboe::SharingMode::Exclusive);
        builder.setFormat(oboe::AudioFormat::I16);
        builder.setChannelCount(oboe::ChannelCount::Stereo);
        builder.setDataCallback(this);
        builder.setErrorCallback(this);
        //builder.setFramesPerDataCallback(128);

        oboe::Result result = builder.openStream(&audioStream);
        if (result != oboe::Result::OK) {
            AUPH_ALOGE("Failed to create stream. Error: %s", oboe::convertToText(result));
            audioStream = nullptr;
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
                AUPH_ALOGE("Error starting playback stream. Error: %s", oboe::convertToText(result));
                audioStream->close();
                audioStream = nullptr;
                return false;
            }

            if (_getJNIEnv && _androidActivity) {
                auto *env = _getJNIEnv();
                if (env) {
                    jclass cls = env->FindClass("ek/Auph");
                    if (cls) {
                        jmethodID fn = env->GetStaticMethodID(cls, "start",
                                                              "(Landroid/app/Activity;)V");
                        if (fn) {
                            env->CallStaticVoidMethod(cls, fn, _androidActivity);
                        } else {
                            AUPH_ALOGE("Error cannot get start() function");
                        }
                    } else {
                        AUPH_ALOGE("Error cannot find Auph class");
                    }
                }
            }
            return true;
        }
        return false;
    }

    bool stop() {
        if (audioStream != nullptr) {
            if (_getJNIEnv && _androidActivity) {
                auto *env = _getJNIEnv();
                if (env) {
                    jclass cls = env->FindClass("ek/Auph");
                    if (cls) {
                        jmethodID fn = env->GetStaticMethodID(cls, "stop",
                                                              "(Landroid/app/Activity;)V");
                        if (fn) {
                            env->CallStaticVoidMethod(cls, fn, _androidActivity);
                        } else {
                            AUPH_ALOGE("Error cannot get stop() function");
                        }
                    } else {
                        AUPH_ALOGE("Error cannot find Auph class");
                    }
                }
            }

            audioStream->close();
            audioStream = nullptr;
            return true;
        }
        return false;
    }

    ~AudioDevice() override {
        userData = nullptr;
        onPlayback = nullptr;
        stop();
        instance = nullptr;
    }

    static int vibrate(int millis) {
        int result = 1;
        if (_getJNIEnv && _androidActivity) {
            auto *env = _getJNIEnv();
            if (env) {
                jclass cls = env->FindClass("ek/Auph");
                if (cls) {
                    jmethodID mid = env->GetStaticMethodID(cls, "vibrate",
                                                           "(Landroid/app/Activity;I)I");
                    if (mid) {
                        result = env->CallStaticIntMethod(cls, mid, _androidActivity, millis);
                    } else {
                        AUPH_ALOGE("Error cannot get vibrate() function");
                    }
                    env->DeleteLocalRef(cls);
                } else {
                    AUPH_ALOGE("Error cannot find Auph class");
                }
            }
        }
        return result;
    }
};

AudioDevice *AudioDevice::instance = nullptr;

#endif

}

extern "C" JNIEXPORT JNICALL jint Java_ek_Auph_restart(JNIEnv *env, jclass clazz) {
    (void) env;
    (void) clazz;
#ifndef OBOE_NULL
    auto *device = auph::AudioDevice::instance;
    if (device) {
        auto *stream = device->audioStream;
        if (stream != nullptr) {
            stream->close();
            if (device->_reopenAndStartStream()) {
                return 0;
            }
            return 1;
        }
        return 2;
    }
    return 3;
#else
    return 0;
#endif
}

#ifdef OBOE_NULL
#include "Null.hpp"
#endif


