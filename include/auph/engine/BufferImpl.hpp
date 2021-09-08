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

#if defined(__ANDROID__)
#include <android/asset_manager.h>
#endif

#if defined(__APPLE__)
#include <Foundation/Foundation.h>
#endif

namespace auph {

/**
 * Small JS snippet to get FourCC code from 4-char string
 * ```javascript
 * fourCC = s => "0x" + [...s].reduce((v,c,i) => v | c.charCodeAt() << ((3 - i) << 3), 0).toString(16);
 * fourCC("OggS") === "0x4f676753"
 * ```
 */
enum FourCC {
    FourCC_OggS = 0x4f676753,
    FourCC_RIFF = 0x52494646,
    FourCC_WAVE = 0x57415645,
    FourCC_ID3 = 0x49443300
};

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

#if defined(__APPLE__)

const char* getFilePathFromBundle(const char* filepath) {
    NSString * pathToAsset = [NSString stringWithUTF8String: filepath];
    NSString * pathFromBundle = [[NSBundle mainBundle] pathForResource:pathToAsset ofType:nil];
    const char* filepathFromBundle = [pathFromBundle cStringUsingEncoding:NSASCIIStringEncoding];
    return filepathFromBundle ? filepathFromBundle : filepath;
}

#endif

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
    if (fourCC == FourCC_OggS) {
        return loadMemoryOgg(data, size, dataSource, !!(flags & Flag_Stream));
    }
#endif

#ifdef AUPH_WAV
    if (fourCC == FourCC_RIFF || fourCC == FourCC_WAVE) {
        if (flags & Flag_Stream) {
            return openMemoryStreamWav(data, size, dataSource);
        } else {
            return loadMemoryWav(data, size, dataSource);
        }
    }
#endif

#ifdef AUPH_MP3
    if ((fourCC & 0xFFFFFF00) == FourCC_ID3 || (fourCC & 0xFFE00000) == 0xFFE00000 /* 11-bit sync */) {
        if (flags & Flag_Stream) {
            return openMemoryStreamMp3(data, size, dataSource);
        } else {
            return loadMemoryMp3(data, size, dataSource);
        }
    }
#endif

    return false;
}

bool BufferObj::load(const char* filepath, int flags) {
#ifdef __ANDROID__
    if(_androidAssetManager) {
        AAsset *asset = AAssetManager_open(_androidAssetManager, filepath, AASSET_MODE_BUFFER);
        if (asset) {
            auto dataBuffer = static_cast<const uint8_t *>(AAsset_getBuffer(asset));
            auto size = AAsset_getLength(asset);
            auto result = loadFromMemory(dataBuffer, size, flags | Flag_Copy);
            AAsset_close(asset);
            return result;
        }
    }
#endif

#ifdef __APPLE__
    filepath = getFilePathFromBundle(filepath);
#endif

    const bool result = loadToBuffer(&data, filepath, flags);
    if (result) {
        state = Flag_Active | Flag_Loaded;
        if (flags & Flag_Stream) {
            state |= Flag_Stream;
        }
    }
    return result;
}

bool BufferObj::loadFromMemory(const void* pData, uint32_t size, int flags) {
    // check if we need to preserve loaded data, for example we need to read encoded data continuously while playing
    const int flagsToCopy = Flag_Stream | Flag_Copy;
    if ((flags & flagsToCopy) == flagsToCopy) {
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