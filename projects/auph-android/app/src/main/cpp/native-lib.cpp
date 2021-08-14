#include <jni.h>
#include <auph/auph.hpp>

extern "C" JNIEXPORT
void JNICALL Java_com_eliasku_AuphTest_MainActivity_start(JNIEnv *env) {
    auph::init();
    auph::resume();
    //example->device->start();
}