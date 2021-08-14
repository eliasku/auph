#pragma once

#include "Buffer.hpp"

#ifdef AUPH_WAV
#include "BufferWav.hpp"
#endif

#ifdef AUPH_MP3
#include "BufferMp3.hpp"
#endif

#ifdef AUPH_OGG
#include "BufferOgg.hpp"
#endif

namespace auph {

BufferObj::~BufferObj() {
    unload();
}

void BufferObj::unload() {
    free(data.data.buffer);
    free(data.streamData);

    id = nextHandle(id);
    state = 0;
    data = {};
}

const char* getExtension(const char* filepath) {
    const char* lastDot = filepath;
    while (*filepath != '\0') {
        if (*filepath == '.') {
            lastDot = filepath;
        }
        filepath++;
    }
    return lastDot;
}

bool loadToBuffer(BufferDataSource* dataSource, const char* filepath, bool streaming) {
    const char* e = getExtension(filepath);
#ifdef AUPH_MP3
    if (e[1] == 'm' && e[2] == 'p' && e[3] == '3') {
        return loadFile_MP3(filepath, dataSource);
    }
#endif // AUPH_MP3

#ifdef AUPH_OGG
    if (e[1] == 'o' && e[2] == 'g' && e[3] == 'g') {
        if (streaming) {
            return streamFile_OGG(filepath, dataSource);
        } else {
            return loadFile_OGG(filepath, dataSource);
        }
    }
#endif // AUPH_OGG

#ifdef AUPH_WAV
    if (e[1] == 'w' && e[2] == 'a' && e[3] == 'v') {
        return loadFile_WAV(filepath, dataSource);
    }
#endif // AUPH_WAV
    return false;
}

bool BufferObj::load(const char* filepath, int flags) {
    const bool result = loadToBuffer(&data, filepath, flags & Flag_Stream);
    if (result) {
        state = Flag_Active | Flag_Loaded;
        if (flags & Flag_Stream) {
            state |= Flag_Stream;
        }
    }
    return result;
}

}