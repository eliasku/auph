#pragma once

#include <cstdint>
#include <auph/engine/Buffer.hpp>
#include <auph/engine/Voice.hpp>

namespace auph {

inline Bus Bus_Master = {0};
inline Bus Bus_Sound = {1};
inline Bus Bus_Music = {2};
inline Bus Bus_Speech = {3};

void init();

void resume();

void pause();

void shutdown();

// private
void* _getAudioContext();

int getMixerParam(MixerParam param);

uint32_t getMixerState();

Buffer load(const char* filepath, bool streaming);

void unload(Buffer buffer);

Voice play(Buffer buffer,
           float gain = 1.0f,
           float pan = 0.0f,
           float pitch = 1.0f,
           bool loop = false,
           bool paused = false,
           Bus bus = Bus_Sound);

void stop(Voice voice);

void stopBuffer(Buffer buffer);

/** Voice controls **/

void setVoiceParam(Voice voice, VoiceParam param, float value);

float getVoiceParam(Voice voice, VoiceParam param);

void setVoiceFlag(Voice voice, VoiceFlag flag, bool value);

uint32_t getVoiceState(Voice voice);

bool getVoiceFlag(Voice voice, VoiceFlag flag);

/** Bus controls **/

void setBusParam(Bus bus, BusParam param, float value);

float getBusParam(Bus bus, BusParam param);

void setBusFlag(Bus bus, BusFlag flag, bool value);

bool getBusFlag(Bus bus, BusFlag flag);

/** Buffer control **/

uint32_t getBufferState(Buffer buffer);

bool getBufferFlag(Buffer buffer, BufferFlag flag);

float getBufferParam(Buffer buffer, BufferParam param);


/** Bus controls **/
inline void setBusGain(Bus bus, float gain) {
    setBusParam(bus, BusParam::Gain, gain);
}

inline float getBusGain(Bus bus) {
    return getBusParam(bus, BusParam::Gain);
}

inline void setBusConnected(Bus bus, bool connected) {
    setBusFlag(bus, Bus_Connected, connected);
}

inline bool getBusConnected(Bus bus) {
    return getBusFlag(bus, Bus_Connected);
}

/** Audio Data object's state **/

inline double getBufferDuration(Buffer buffer) {
    return (double) getBufferParam(buffer, BufferParam::Duration);
}

inline double getVoiceDuration(Voice voice) {
    return (double) getVoiceParam(voice, VoiceParam::Duration);
}

inline double getVoiceCurrentTime(Voice voice) {
    return (double) getVoiceParam(voice, VoiceParam::CurrentTime);
}

/** Voice parameters control **/

inline bool isVoiceValid(Voice voice) {
    return getVoiceFlag(voice, Voice_Active);
}

inline void setPan(Voice voice, float pan) {
    setVoiceParam(voice, VoiceParam::Pan, pan);
}

inline void setGain(Voice voice, float gain) {
    setVoiceParam(voice, VoiceParam::Gain, gain);
}

inline void setRate(Voice voice, float rate) {
    setVoiceParam(voice, VoiceParam::Rate, rate);
}

inline void setPause(Voice voice, bool paused) {
    setVoiceFlag(voice, Voice_Running, !paused);
}

inline void setLoop(Voice voice, bool looping) {
    setVoiceFlag(voice, Voice_Loop, looping);
}

inline float getPan(Voice voice) {
    return getVoiceParam(voice, VoiceParam::Pan);
}

inline float getGain(Voice voice) {
    return getVoiceParam(voice, VoiceParam::Gain);
}

inline float getRate(Voice voice) {
    return getVoiceParam(voice, VoiceParam::Rate);
}

inline bool getPause(Voice voice) {
    return !getVoiceFlag(voice, Voice_Running);
}

inline bool getLoop(Voice voice) {
    return getVoiceFlag(voice, Voice_Loop);
}

static const char* getMixerStateString(uint32_t state) {
    static const char* names[3] = {"invalid", "running", "paused"};
    return names[state & 3];
}

}
