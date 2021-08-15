#pragma once

#define DR_WAV_IMPLEMENTATION

#include <dr/dr_wav.h>

namespace auph {

bool loadFileWav(const char* filepath, BufferDataSource* dest) {
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
        dest->reader = selectSourceReader(dest->format, dest->channels, false);
        return true;
    }
    return false;
}

struct StreamWav {
    drwav f{};
    uint64_t cursor = 0;
    SourceReader parentReader = nullptr;
    float prev[2]{};
};

static MixSample* readStreamWav(MixSample* mix,
                                const double begin,
                                const double end,
                                const double advance,
                                const BufferDataSource* dataSource,
                                MixSample volume) {
    auto* stream = (StreamWav*) dataSource->streamData;
    const auto channels = dataSource->channels;
    static const int BufferFloatsMax = 2048 * 10;
    float buffer[BufferFloatsMax];
    dataSource->data.buffer = buffer;

    if (stream->cursor != (uint64_t) ceil(begin)) {
        stream->cursor = (uint64_t) ceil(begin);
        drwav_seek_to_pcm_frame(&stream->f, stream->cursor);
    }

    auto p = begin;
    auto newFrames = (int) ceil(end) - (int) ceil(p);
    const auto startOffset = (int) p;
    for (int ch = 0; ch < channels; ++ch) {
        buffer[ch] = stream->prev[ch];
    }

    if (newFrames > BufferFloatsMax / channels - 1) {
        newFrames = BufferFloatsMax / channels - 1;
    }
    const auto framesReady = newFrames > 0 ? drwav_read_pcm_frames_f32(&stream->f, newFrames, buffer + channels) : 0;

    if (framesReady > 0) {
        for (int ch = 0; ch < channels; ++ch) {
            stream->prev[ch] = buffer[framesReady * channels + ch];
        }
    }
    auto x1 = p - startOffset;
    auto x2 = end - startOffset;
    if (x1 < 0.0000001) {
        x1 += 1;
        x2 += 1;
    }
    if (x2 > 1 + framesReady) {
        printf("not enought %lf   %lu\n", x2, framesReady);
    }
    mix = stream->parentReader(mix, x1, x2, advance, dataSource, volume);

    stream->cursor = (uint64_t) ceil(end);
    dataSource->data.buffer = nullptr;

    return mix;
}

bool openStreamWav(const char* filepath, BufferDataSource* dest) {
    drwav file{};
    bool ok = drwav_init_file(&file, filepath, nullptr);
    if (!ok) {
        return false;
    }
    dest->format = SampleFormat_F32;
    dest->channels = file.channels;
    dest->sampleRate = file.sampleRate;
    dest->length = file.totalPCMFrameCount;

    auto* streamData = (StreamWav*) malloc(sizeof(StreamWav));
    dest->streamData = streamData;
    streamData->f = file;
    streamData->parentReader = selectSourceReader(dest->format, dest->channels, false);
    dest->reader = readStreamWav;
    return true;
}


}


