#pragma once

#include "Buffer.hpp"

#include <cmath>

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
    free(sourceBufferData);

    id = nextHandle(id);
    state = 0;
    data = {};
    sourceBufferData = nullptr;
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

bool loadToBuffer(BufferDataSource* dataSource, const char* filepath, int flags) {

    const char* e = getExtension(filepath);
#ifdef AUPH_MP3
    if (e[1] == 'm' && e[2] == 'p' && e[3] == '3') {
        if (flags & Flag_Stream) {
            return openFileStreamMp3(filepath, dataSource);
        } else {
            return loadFileMp3(filepath, dataSource);
        }
    }
#endif // AUPH_MP3

#ifdef AUPH_OGG
    if (e[1] == 'o' && e[2] == 'g' && e[3] == 'g') {
        return loadFileOgg(filepath, dataSource, flags & Flag_Stream);
    }
#endif // AUPH_OGG

#ifdef AUPH_WAV
    if (e[1] == 'w' && e[2] == 'a' && e[3] == 'v') {
        if (flags & Flag_Stream) {
            return openFileStreamWav(filepath, dataSource);
        } else {
            return loadFileWav(filepath, dataSource);
        }
    }
#endif // AUPH_WAV
    return false;
}

bool loadMemoryToBuffer(BufferDataSource* dataSource, const void* data, uint32_t size, int flags) {
    if (size < 4) {
        return false;
    }
    const auto* u8 = (const uint8_t*) data;
    const uint32_t fourCC = (u8[0] << 24) | (u8[1] << 16) | (u8[2] << 8) | u8[3];
#ifdef AUPH_OGG

    const uint32_t OggS = 'OggS';
    if (fourCC == OggS) {
        return loadMemoryOgg(data, size, dataSource, !!(flags & Flag_Stream));
    }
#endif

#ifdef AUPH_WAV
    if (fourCC == 'RIFF' || fourCC == 'WAVE') {
        if (flags & Flag_Stream) {
            return openMemoryStreamWav(data, size, dataSource);
        } else {
            return loadMemoryWav(data, size, dataSource);
        }
    }
#endif // AUPH_WAV

#ifdef AUPH_MP3
    if ((fourCC & 0xFFFFFF00) == 'ID3\0' || (fourCC & 0xFFE00000) == 0xFFE00000 /* 11-bit sync */) {
        if (flags & Flag_Stream) {
            return openMemoryStreamMp3(data, size, dataSource);
        } else {
            return loadMemoryMp3(data, size, dataSource);
        }
    }
#endif // AUPH_MP3
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

bool BufferObj::loadFromMemory(const void* pData, uint32_t size, int flags) {
    if ((flags & Flag_Copy) && (flags & Flag_Stream)) {
        sourceBufferData = malloc(size);
        memcpy(sourceBufferData, pData, size);
        pData = sourceBufferData;
    }
    const bool result = loadMemoryToBuffer(&data, pData, size, flags);
    if (result) {
        state = Flag_Active | Flag_Loaded;
        if (flags & Flag_Stream) {
            state |= Flag_Stream;
        }
    } else {
        free(sourceBufferData);
        sourceBufferData = nullptr;
    }
    return result;
}

}