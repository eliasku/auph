#pragma once

#include "auph_interface.hpp"

namespace auph {

inline int f2u(float x) {
    return static_cast<int>(x * Unit);
}

inline Voice play(Buffer buffer,
                  float gain = 1.0f,
                  float pan = 0.0f,
                  float rate = 1.0f,
                  bool loop = false,
                  bool paused = false,
                  Bus bus = Bus_Sound) {
    int flags = 0;
    if (loop) flags |= Flag_Loop;
    if (!paused) flags |= Flag_Running;
    return voice(buffer, f2u(gain), f2u(pan + 1.0f), f2u(rate), flags, bus);
}

inline const char* getMixerStateString(int state) {
    static const char* names[] = {"closed", "paused", "", "running"};
    return names[state & 0x3];
}

inline const char* getBufferStateString(int state) {
    static const char* names[] = {"free", "loading", "", "loaded"};
    return names[state & 0x3];
    //+ ["", " streaming"][(state >>> 2) & 0x1];
}

inline void setGain(int busOrVoice, float value) {
    set(busOrVoice, Param_Gain, f2u(value));
}

inline float getGain(int busOrVoice) {
    return (float) get(busOrVoice, Param_Gain) / Unit;
}

inline void setPan(Voice voice, float pan) {
    set(voice.id, Param_Pan, f2u(pan + 1.0f));
}

inline void setRate(Voice voice, float rate) {
    set(voice.id, Param_Rate, f2u(rate));
}

inline void setPause(int name, bool value) {
    set(name, (int)Param_Flags | Flag_Running, value ? 0 : 1);
}

inline void setLoop(Voice voice, bool value) {
    set(voice.id, (int)Param_Flags | Flag_Loop, value);
}

inline float getPan(Voice voice) {
    return (float) get(voice.id, Param_Pan) / (float) Unit - 1.0f;
}

inline float getRate(Voice voice) {
    return (float) get(voice.id, Param_Rate) / Unit;
}

inline bool getPause(Voice voice) {
    return !(get(voice.id, Param_State) & Flag_Running);
}

inline bool getLoop(Voice voice) {
    return !!(get(voice.id, Param_State) & Flag_Loop);
}

inline float getCurrentTime(Voice voice /* or mixer */) {
    return (float) get(voice.id, Param_CurrentTime) / Unit;
}

inline bool isActive(int name) {
    return !!(get(name, Param_State) & Flag_Active);
}

inline bool isBufferLoaded(Buffer buffer) {
    const int mask = Flag_Active | Flag_Loaded;
    return (get(buffer.id, Param_State) & mask) == mask;
}

/** Methods for Buffer **/
inline float getDuration(int bufferOrVoice) {
    return (float) get(bufferOrVoice, Param_Duration) / Unit;
}

inline void pause(int name = hMixer) {
    setPause(name, true);
}

inline void resume(int name = hMixer) {
    setPause(name, false);
}

}