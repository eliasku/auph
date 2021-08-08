#pragma once

#include <cstdint>
#include <auph/engine/AudioData.hpp>
#include <auph/engine/Voice.hpp>

namespace auph {

struct Bus {
    uint32_t id;
};

inline Bus Bus_Master = {0};
inline Bus Bus_Sound = {1};
inline Bus Bus_Music = {2};
inline Bus Bus_Speech = {3};

struct AudioData {
    uint32_t id;
};

struct Voice {
    uint32_t id;
};

enum class DeviceState {
    Invalid = 0,
    Running = 1,
    Paused = 2
};

enum class Var {
    VoicesInUse = 0,
    StreamsInUse = 1,
    BuffersLoaded = 2,
    StreamsLoaded = 3,
    Device_SampleRate = 4,
    Device_State = 5
};

void init();

void resume();

void pause();

void shutdown();

int getInteger(Var param);

AudioData load(const char* filepath, bool streaming);

void unload(AudioData data);

Voice play(AudioData data,
           float gain = 1.0f,
           float pan = 0.0f,
           float pitch = 1.0f,
           bool loop = false,
           bool paused = false,
           Bus bus = Bus_Sound);

void stop(Voice voice);

void stopAudioData(AudioData data);

/** Bus controls **/
void setBusVolume(Bus bus, float gain);

float getBusVolume(Bus bus);

void setBusEnabled(Bus bus, bool enabled);

bool getBusEnabled(Bus bus);

/** Audio Data object's state **/
AudioDataState getAudioDataState(AudioData data);

double getAudioSourceLength(AudioData data);

double getVoiceLength(Voice voice);

double getVoicePosition(Voice voice);

/** Voice parameters control **/

bool isVoiceValid(Voice voice);

uint32_t getVoiceState(Voice voice);

void setPan(Voice voice, float pan);

void setVolume(Voice voice, float gain);

void setPitch(Voice voice, float rate);

void setPause(Voice voice, bool paused);

void setLoop(Voice voice, bool loopMode);

float getPan(Voice voice);

float getVolume(Voice voice);

float getPitch(Voice voice);

bool getPause(Voice voice);

bool getLoop(Voice voice);

// private
void* _getAudioContext();

static const char* getDeviceStateString(DeviceState state) {
    static const char* names[3] = {"invalid", "running", "paused"};
    return names[static_cast<uint32_t>(state) % 3];
}

}
