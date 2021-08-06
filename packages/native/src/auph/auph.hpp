#pragma once

#include <cstdint>

namespace auph {

struct Bus {
    uint32_t id;
};

struct AudioSourceHandle {
    uint32_t id;
};

struct VoiceHandle {
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

// private
void* _getAudioContext();

static const char* getDeviceStateString(DeviceState state) {
    static const char* names[3] = {"invalid", "running", "paused"};
    return names[static_cast<uint32_t>(state) % 3];
}

AudioSourceHandle loadAudioSource(const char* filepath, bool streaming);


///

VoiceHandle play(AudioSourceHandle source, float gain = 1.0f, float pan = 0.0f, float pitch = 1.0f, bool loop = false, bool paused = false, Bus bus = {0});

}
