#pragma once

#include "SoundEngine.hpp"

namespace auph {

class SoundResource {
public:
    AudioSource source{};

    ~SoundResource();

    bool loadFile_MP3(const char* filepath);

    bool loadFile_WAV(const char* filepath);

    bool loadFile_OGG(const char* filepath);

    bool streamFile_OGG(const char* filepath);

    void unload();
};

}