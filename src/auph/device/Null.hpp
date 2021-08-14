#pragma once

#include "AudioDevice.hpp"

namespace auph {

class AudioDevice {
public:
    static AudioDevice* instance;
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;

    AudioDevice() {
        AudioDevice::instance = this;
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

AudioDevice* AudioDevice::instance = nullptr;

}
