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

int getInteger(Var param) {
    return EM_ASM_INT(return Auph.getInteger($0), (int) param);
}

AudioData load(const char* filepath, bool streaming) {
    int r = EM_ASM_INT(return Auph.load(UTF8ToString($0), $1), filepath, streaming);
    return {(uint32_t) r};
}

void unload(AudioData data) {
    EM_ASM(Auph.unload($0), data.id);
}

Voice play(AudioData data,
           float gain,
           float pan,
           float pitch,
           bool loop,
           bool paused,
           Bus bus) {
    int r = EM_ASM_INT(return Auph.play($0, $1, $2, $3, $4, $5, $6), data.id, gain, pan, pitch, loop, paused, bus.id);
    return {(uint32_t) r};
}

void stop(Voice voice) {
    EM_ASM(Auph.stop($0), voice.id);
}

void stopAudioData(AudioData data) {
    EM_ASM(Auph.stopAudioData($0), data.id);
}

// private
void* _getAudioContext() {
    return nullptr;
}

/** Bus controls **/
void setBusVolume(Bus bus, float gain) {
    EM_ASM(Auph.setBusVolume($0, $1), bus.id, gain);
}

float getBusVolume(Bus bus) {
    double r = EM_ASM_DOUBLE(return Auph.getBusVolume($0), bus.id);
    return (float) r;
}

void setBusEnabled(Bus bus, bool enabled) {
    EM_ASM(Auph.setBusEnabled($0, $1), bus.id, enabled);
}

bool getBusEnabled(Bus bus) {
    int r = EM_ASM_INT(return Auph.getBusEnabled($0), bus.id);
    return r != 0;
}

/** Audio Data object's state **/
AudioDataState getAudioDataState(AudioData data) {
    int r = EM_ASM_INT(return Auph.getAudioDataState($0), data.id);
    return (AudioDataState) r;
}

double getAudioSourceLength(AudioData data) {
    double r = EM_ASM_DOUBLE(return Auph.getAudioSourceLength($0), data.id);
    return r;
}

double getVoiceLength(Voice voice) {
    double r = EM_ASM_DOUBLE(return Auph.getVoiceLength($0), voice.id);
    return r;
}

double getVoicePosition(Voice voice) {
    double r = EM_ASM_DOUBLE(return Auph.getVoicePosition($0), voice.id);
    return r;
}

/** Voice parameters control **/

bool isVoiceValid(Voice voice) {
    int r = EM_ASM_INT(return Auph.isVoiceValid($0), voice.id);
    return r != 0;
}

uint32_t getVoiceState(Voice voice) {
    int r = EM_ASM_INT(return Auph.getVoiceState($0), voice.id);
    return (uint32_t) r;
}

void setPan(Voice voice, float value) {
    EM_ASM(Auph.setPan($0, $1), voice.id, value);
}

void setVolume(Voice voice, float value) {
    EM_ASM(Auph.setVolume($0, $1), voice.id, value);
}

void setPitch(Voice voice, float value) {
    EM_ASM(Auph.setPitch($0, $1), voice.id, value);
}

void setPause(Voice voice, bool value) {
    EM_ASM(Auph.setPause($0, $1), voice.id, value);
}

void setLoop(Voice voice, bool value) {
    EM_ASM(Auph.setLoop($0, $1), voice.id, value);
}

float getPan(Voice voice) {
    double r = EM_ASM_DOUBLE(return Auph.getPan($0), voice.id);
    return (float) r;
}

float getVolume(Voice voice) {
    double r = EM_ASM_DOUBLE(return Auph.getVolume($0), voice.id);
    return (float) r;
}

float getPitch(Voice voice) {
    double r = EM_ASM_DOUBLE(return Auph.getPitch($0), voice.id);
    return (float) r;
}

bool getPause(Voice voice) {
    int r = EM_ASM_INT(return Auph.getPause($0), voice.id);
    return r != 0;
}

bool getLoop(Voice voice) {
    int r = EM_ASM_INT(return Auph.getLoop($0), voice.id);
    return r != 0;
}

}

