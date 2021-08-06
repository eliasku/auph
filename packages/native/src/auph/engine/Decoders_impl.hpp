#pragma once

#include "Decoders.hpp"

#define DR_WAV_IMPLEMENTATION

#include <dr/dr_wav.h>

#define DR_MP3_IMPLEMENTATION

#include <dr/dr_mp3.h>

#include <stb/stb_vorbis.c>

namespace auph {

SoundResource::~SoundResource() {
    unload();
}

void SoundResource::unload() {
    free(source.data.buffer);
    free(source.streamData);
    source = {};
}

bool SoundResource::loadFile_MP3(const char* filepath) {
    drmp3_config config{};
    drmp3_uint64 totalFrames{};
    int16_t* data = drmp3_open_file_and_read_pcm_frames_s16(filepath, &config, &totalFrames, nullptr);
    if (data != nullptr) {
        source.data.i16 = data;
        source.format = SampleFormat_I16;
        source.sampleRate = config.sampleRate;
        source.channels = config.channels;
        source.length = totalFrames;
        source.reader = selectSourceReader(source.format, source.channels, true);
        return true;
    }
    return false;
}

bool SoundResource::loadFile_WAV(const char* filepath) {
    drwav_uint64 totalFrameCount{};
    unsigned int channels;
    unsigned int sampleRate;
    int16_t* data = drwav_open_file_and_read_pcm_frames_s16(filepath, &channels, &sampleRate, &totalFrameCount,
                                                            nullptr);
    if (data != nullptr) {
        source.data.i16 = data;
        source.format = SampleFormat_I16;
        source.sampleRate = sampleRate;
        source.channels = channels;
        source.length = totalFrameCount;
        source.reader = selectSourceReader(source.format, source.channels, true);
        return true;
    }
    return false;
}

bool SoundResource::loadFile_OGG(const char* filepath) {
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

    source.data.f32 = data;
    source.format = SampleFormat_F32;
    source.channels = info.channels;
    source.sampleRate = info.sample_rate;
    source.length = samples;
    source.reader = selectSourceReader(source.format, source.channels, true);
    return true;
}

struct OggStream {
    stb_vorbis* f = nullptr;
    SourceReader parentReader = nullptr;
    float last[2]{};
};

static void oggStreamReader(MixSample* mix,
                            const double begin,
                            const double end,
                            const double advance,
                            const AudioSource* audioSource,
                            MixSample gain) {
    auto* stream = (OggStream*) audioSource->streamData;
    const auto channels = audioSource->channels;
    static constexpr int BufferFloatsMax = 4096;
    float buffer[BufferFloatsMax];
    // TODO: hackish
    ((AudioSource*) audioSource)->data.buffer = buffer;
    auto p = begin;
    while (p < end) {
        auto nextFloatsCount = (int) ((int)(end) - (int)(p) + 1) * (int) channels;
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
        stream->parentReader(mix, 0, framesReady, advance, audioSource, gain);
        p += framesReady;
    }
    ((AudioSource*) audioSource)->data.buffer = nullptr;
}

bool SoundResource::streamFile_OGG(const char* filepath) {
    int error = 0;
    auto* ogg = stb_vorbis_open_filename(filepath, &error, nullptr);
    if (error != 0 || ogg == nullptr) {
        stb_vorbis_close(ogg);
        return false;
    }
    auto frames = stb_vorbis_stream_length_in_samples(ogg);
    auto info = stb_vorbis_get_info(ogg);

    source.format = SampleFormat_F32;
    source.channels = info.channels;
    source.sampleRate = info.sample_rate;
    source.length = frames;

    auto* streamData = (OggStream*) malloc(sizeof(OggStream));
    source.streamData = streamData;
    streamData->f = ogg;
    streamData->parentReader = selectSourceReader(source.format, source.channels, true);
    source.reader = oggStreamReader;
    return true;
}

}