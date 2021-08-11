#pragma once

#include "auph.hpp"
#include <emscripten.h>

namespace auph {

void init() {
    EM_ASM(Auph.init());
}

void resume() {
    EM_ASM(Auph.resume());
}

void pause() {
    EM_ASM(Auph.pause());
}

void shutdown() {
    EM_ASM(Auph.shutdown());
}

// private
void* _getAudioContext() {
    return nullptr;
}

int getMixerParam(MixerParam param) {
    return EM_ASM_INT(return Auph.getMixerParam($0), (uint32_t) param);
}

uint32_t getMixerState() {
    return EM_ASM_INT(return Auph.getMixerState());
}

Buffer load(const char* filepath, bool streaming) {
    int r = EM_ASM_INT(return Auph.load(UTF8ToString($0), $1), filepath, streaming);
    return {(uint32_t) r};
}

void unload(Buffer buffer) {
    EM_ASM(Auph.unload($0), buffer.id);
}

Voice play(Buffer buffer,
           float gain,
           float pan,
           float pitch,
           bool loop,
           bool paused,
           Bus bus) {
    int r = EM_ASM_INT(return Auph.play($0, $1, $2, $3, $4, $5, $6), buffer.id, gain, pan, pitch, loop, paused, bus.id);
    return {(uint32_t) r};
}

void stop(Voice name) {
    EM_ASM(Auph.stop($0), name.id);
}

void stopBuffer(Buffer name) {
    EM_ASM(Auph.stopBuffer($0), name.id);
}

void setVoiceParam(Voice name, VoiceParam param, float value) {
    EM_ASM(Auph.setVoiceParam($0, $1, $2), name.id, (int) param, value);
}

float getVoiceParam(Voice name, VoiceParam param) {
    double r = EM_ASM_DOUBLE(return Auph.getVoiceParam($0, $1), name.id, (int) param);
    return (float) r;
}

void setVoiceFlag(Voice name, VoiceFlag flag, bool value) {
    EM_ASM(Auph.setVoiceFlag($0, $1, $2), name.id, (int) flag, value);
}

uint32_t getVoiceState(Voice name) {
    int r = EM_ASM_INT(Auph.getVoiceState($0), name.id);
    return (uint32_t) r;
}

bool getVoiceFlag(Voice name, VoiceFlag flag) {
    int r = EM_ASM_INT(Auph.getVoiceFlag($0, $1), name.id, (int) flag);
    return r != 0;
}

/** Bus controls **/

void setBusParam(Bus name, BusParam param, float value) {
    EM_ASM(Auph.setBusParam($0, $1, $2), name.id, (int) param, value);
}

float getBusParam(Bus name, BusParam param) {
    double r = EM_ASM_DOUBLE(Auph.getBusParam($0, $1), name.id, (int) param);
    return (float) r;
}

void setBusFlag(Bus name, BusFlag flag, bool value) {
    EM_ASM(Auph.setBusFlag($0, $1, $2), name.id, (int) flag, value);
}

bool getBusFlag(Bus name, BusFlag flag) {
    int r = EM_ASM_INT(Auph.getBusFlag($0, $1), name.id, (int) flag);
    return r != 0;
}

uint32_t getBufferState(Buffer name) {
    int r = EM_ASM_INT(Auph.getBufferState($0), name.id);
    return (uint32_t) r;
}

bool getBufferFlag(Buffer name, BufferFlag flag) {
    int r = EM_ASM_INT(Auph.getBufferFlag($0, $1), name.id, (int) flag);
    return r != 0;
}

float getBufferParam(Buffer name, BufferParam param) {
    double r = EM_ASM_DOUBLE(Auph.getBufferParam($0, $1), name.id, (int) param);
    return (float) r;
}

}

