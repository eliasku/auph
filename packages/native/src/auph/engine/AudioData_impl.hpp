#pragma once

#include "AudioData.hpp"

#ifdef AUPH_WAV
#define DR_WAV_IMPLEMENTATION
#include <dr/dr_wav.h>
#endif // AUPH_WAV

#ifdef AUPH_MP3
#define DR_MP3_IMPLEMENTATION
#include <dr/dr_mp3.h>
#endif // AUPH_MP3

#ifdef AUPH_OGG
#include <stb/stb_vorbis.c>
#endif // AUPH_OGG

namespace auph {

AudioDataObj::~AudioDataObj() {
    unload();
}

void AudioDataObj::unload() {
    free(source.data.buffer);
    free(source.streamData);
    source = {};
}

#ifdef AUPH_MP3

bool loadFile_MP3(const char* filepath, AudioDataSource* dest) {
    drmp3_config config{};
    drmp3_uint64 totalFrames{};
    int16_t* data = drmp3_open_file_and_read_pcm_frames_s16(filepath, &config, &totalFrames, nullptr);
    if (data != nullptr) {
        dest->data.i16 = data;
        dest->format = SampleFormat_I16;
        dest->sampleRate = config.sampleRate;
        dest->channels = config.channels;
        dest->length = totalFrames;
        dest->reader = selectSourceReader(dest->format, dest->channels, true);
        return true;
    }
    return false;
}

#endif // AUPH_MP3

#ifdef AUPH_WAV

bool loadFile_WAV(const char* filepath, AudioDataSource* dest) {
    drwav_uint64 totalFrameCount{};
    unsigned int channels;
    unsigned int sampleRate;
    int16_t* data = drwav_open_file_and_read_pcm_frames_s16(filepath, &channels, &sampleRate, &totalFrameCount,
                                                            nullptr);
    if (data != nullptr) {
        dest->data.i16 = data;
        dest->format = SampleFormat_I16;
        dest->sampleRate = sampleRate;
        dest->channels = channels;
        dest->length = totalFrameCount;
        dest->reader = selectSourceReader(dest->format, dest->channels, true);
        return true;
    }
    return false;
}

#endif // AUPH_WAV

#ifdef AUPH_OGG


struct OggStream {
    stb_vorbis* f = nullptr;
    SourceReader parentReader = nullptr;
    float last[2]{};
};

static void oggStreamReader(MixSample* mix,
                            const double begin,
                            const double end,
                            const double advance,
                            const AudioDataSource* dataSource,
                            MixSample gain) {
    auto* stream = (OggStream*) dataSource->streamData;
    const auto channels = dataSource->channels;
    static constexpr int BufferFloatsMax = 4096;
    float buffer[BufferFloatsMax];
    dataSource->data.buffer = buffer;
    auto p = begin;
    while (p < end) {
        auto nextFloatsCount = (int) ((int) (end) - (int) (p) + 1) * (int) channels;
        //stb_vorbis_seek_frame(stream->f, (uint32_t) p);
        if (nextFloatsCount > BufferFloatsMax) {
            nextFloatsCount = BufferFloatsMax;
        }
        const auto framesReady = stb_vorbis_get_samples_float_interleaved(stream->f,
                                                                          (int) channels,
                                                                          buffer,
                                                                          nextFloatsCount);
        if (framesReady == 0) {
            break;
        }
        stream->parentReader(mix, 0, framesReady, advance, dataSource, gain);
        p += framesReady;
    }
    dataSource->data.buffer = nullptr;
}

bool streamFile_OGG(const char* filepath, AudioDataSource* dest) {
    int error = 0;
    auto* ogg = stb_vorbis_open_filename(filepath, &error, nullptr);
    if (error != 0 || ogg == nullptr) {
        stb_vorbis_close(ogg);
        return false;
    }
    auto frames = stb_vorbis_stream_length_in_samples(ogg);
    auto info = stb_vorbis_get_info(ogg);

    dest->format = SampleFormat_F32;
    dest->channels = info.channels;
    dest->sampleRate = info.sample_rate;
    dest->length = frames;

    auto* streamData = (OggStream*) malloc(sizeof(OggStream));
    dest->streamData = streamData;
    streamData->f = ogg;
    streamData->parentReader = selectSourceReader(dest->format, dest->channels, true);
    dest->reader = oggStreamReader;
    return true;
}

bool loadFile_OGG(const char* filepath, AudioDataSource* dest) {
    int error = 0;
    auto* ogg = stb_vorbis_open_filename(filepath, &error, nullptr);
    if (error != 0 || ogg == nullptr) {
        stb_vorbis_close(ogg);
        return false;
    }
    auto frames = stb_vorbis_stream_length_in_samples(ogg);
    auto info = stb_vorbis_get_info(ogg);
    int samples = (int) (info.channels * frames);
    auto* data = (float*) malloc(4 * info.channels * frames);

    const auto numFrames = stb_vorbis_get_samples_float_interleaved(ogg, info.channels, data, samples);
    if (numFrames != frames) {
        printf("cannot read OGG\n");
    }
    stb_vorbis_close(ogg);

    dest->data.f32 = data;
    dest->format = SampleFormat_F32;
    dest->channels = info.channels;
    dest->sampleRate = info.sample_rate;
    dest->length = numFrames;
    dest->reader = selectSourceReader(dest->format, dest->channels, false);
    return true;
}

#endif // AUPH_OGG

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

bool loadToDataSource(AudioDataSource* dataSource, const char* filepath, bool streaming) {
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

bool AudioDataObj::load(const char* filepath, bool streaming) {
    bool result = false;
    if (state & AudioData_Empty) {
        if (streaming) {
            state |= AudioData_Stream;
        }
        result = loadToDataSource(&source, filepath, streaming);
        if (result) {
            state |= AudioData_Loaded;
        }
    }
    return result;
}

}