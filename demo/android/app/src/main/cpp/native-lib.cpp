#include <jni.h>

#include <auph/auph.hpp>

#define AUPH_OGG
#define AUPH_WAV
#define AUPH_MP3

#include <auph/auph_impl.hpp>

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>

inline JNIEnv* jniEnv = nullptr;
inline JNIEnv* getJNIEnv() {
    return jniEnv;
}

extern "C" JNIEXPORT
void JNICALL Java_com_eliasku_AuphTest_MainActivity_start(JNIEnv *env, jclass clazz, jobject activity, jobject assetManager) {
    jniEnv = env;
    auph::setAndroidActivity(getJNIEnv, activity, assetManager);
    auph::init();

    const char* path = "mp3/FUNKY_HOUSE.mp3";
    auto music = auph::load(path, auph::Flag_Stream);
    if(music.id) {
        auph::play(music, 1.0f, 0.0f, 1.0f, true, false, auph::Bus_Music);
    }
}

extern "C" JNIEXPORT
void JNICALL Java_com_eliasku_AuphTest_MainActivity_auphResume(JNIEnv *env, jclass clazz) {
auph::resume();
}

extern "C" JNIEXPORT
void JNICALL Java_com_eliasku_AuphTest_MainActivity_auphPause(JNIEnv *env, jclass clazz) {
auph::pause();
}