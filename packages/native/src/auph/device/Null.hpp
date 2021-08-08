#pragma once

#include "AudioDevice.hpp"

namespace auph {

class AudioDevice {
public:
    static inline AudioDevice* instance = nullptr;
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;

    AudioDevice() {
        instance = this;
    }

    bool start() {
        return true;
    }

    bool stop() {
        return true;
    }

    ~AudioDevice() {
        userData = nullptr;
        onPlayback = nullptr;
        stop();
        instance = nullptr;
    }
};

}
