#include <jni.h>

#include <auph/auph.hpp>

#define AUPH_OGG
#define AUPH_WAV
#define AUPH_MP3

#include <auph/auph_impl.hpp>

extern "C" JNIEXPORT
void JNICALL Java_com_eliasku_AuphTest_MainActivity_start(JNIEnv *env) {
    auph::init();
    auph::resume();
    //example->device->start();
}