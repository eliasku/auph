#pragma once

namespace auph {

constexpr int tMask = 0x30000000;
constexpr int vMask = 0x00FFFF00;
constexpr int vIncr = 0x00000100;
constexpr int iMask = 0x000000FF;

constexpr int Unit = 1024;

struct Buffer {
    int id;
};

struct Voice {
    int id;
};

struct Bus {
    int id;
};

/** Object Type **/
enum Type : int {
    Type_Mixer = 0,
    Type_Bus = 1 << 28,
    Type_Buffer = 2 << 28,
    Type_Voice = 3 << 28
};

constexpr Bus Bus_Master = {Type_Bus | 0};
constexpr Bus Bus_Sound = {Type_Bus | 1};
constexpr Bus Bus_Music = {Type_Bus | 2};
constexpr Bus Bus_Speech = {Type_Bus | 3};

constexpr Bus DefaultBus = Bus_Sound;
constexpr int hMixer = Type_Mixer | 1;

enum Param : int {
    Param_State = 0,
    Param_Gain = 1,
    Param_Pan = 2,
    Param_Rate = 3,
    Param_CurrentTime = 4,
    Param_SampleRate = 5,
    Param_Duration = 6,

    Param_StateMask = (1 << 7) - 1,
    Param_Flags = 1 << 7,
    // counts object by state mask
    Param_Count = 1 << 8
};

enum Flag : int {
    Flag_Active = 1,
    // Voice: playback is running (un-paused)
    // Buffer: buffer is loaded and ready for reading from
    // Bus: connected state
    // Mixer: is not paused
    Flag_Running = 2,
    Flag_Loop = 4,

    // Buffer Flags
    Flag_Loaded = 2,
    Flag_Stream = 4,

    // Copy Flag for buffer
    Flag_Copy = 8
};

/** common utilities **/

inline int nextHandle(int id) {
    return ((id + vIncr) & vMask) | (id & (tMask | iMask));
}

}