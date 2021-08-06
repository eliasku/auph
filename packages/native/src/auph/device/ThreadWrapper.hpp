#pragma once

#include "AudioDevice.hpp"
#include "AudioDevice_impl.hpp"
#include "../mixer/Fifo.hpp"
#include <pthread.h>

namespace auph {

/* the streaming callback runs in a separate thread */
void* ioThread(void* param);

class ThreadWrapper {
public:
    //  64 -- number of packets in ring buffer, default: 64
    static inline constexpr unsigned PacketsCount = 64;
    static inline constexpr unsigned PacketFrames = 128;

    Fifo fifo{PacketsCount, PacketFrames * sizeof(float)};
    AudioDevice* device{};
    pthread_t thread{};
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;
    bool running = true;

    explicit ThreadWrapper(AudioDevice* device_) {
        device = device_;
        device->userData = this;
        device->onPlayback = s_onPlayback;
        /* create the buffer-streaming start thread */
        if (0 != pthread_create(&thread, nullptr, ioThread, this)) {
            printf("pthread_create() failed\n");
            running = false;
        }
    }

    ~ThreadWrapper() {
        running = false;
        pthread_join(thread, nullptr);
    }

    static void s_onPlayback(AudioDeviceCallbackData* data) {
        auto* dest = static_cast<uint8_t*>(data->data);
        auto* wrapper = static_cast<ThreadWrapper*>(data->userData);
        const uint32_t bpf = data->stream.bytesPerFrame;
        const uint32_t byteSizeRequested = data->frames * bpf;
        data->frames = wrapper->fifo.read(dest, byteSizeRequested) / bpf;
    }
};

/* the streaming callback runs in a separate thread */
void* ioThread(void* param) {
    (void) param;

    auto* wrapper = static_cast<auph::ThreadWrapper*>(param);
    auto* fifo = &wrapper->fifo;
    const auto packetsPerCycleMax = ThreadWrapper::PacketFrames;
    auto* temp = new uint8_t[ThreadWrapper::PacketFrames * 4];
    while (wrapper->running) {
        const unsigned expectedFrames = fifo->availableBytesToWrite() / 4;
        AudioDeviceCallbackData data;
        data.data = temp;
        data.stream = wrapper->device->playbackStreamInfo;
        data.userData = wrapper->userData;
        if (expectedFrames > 0) {
            const unsigned requiredFrames = expectedFrames < packetsPerCycleMax ? expectedFrames : packetsPerCycleMax;
            data.frames = requiredFrames;
            wrapper->onPlayback(&data);
            fifo->write(temp, data.frames * 4);
        }

        {
            struct timespec nanospec{};
            nanospec.tv_sec = 0;
            nanospec.tv_nsec = 2 * 1000000; // 2 ms wait
            nanosleep(&nanospec, nullptr);
        }
    }
    delete[] temp;
    return nullptr;
}

}