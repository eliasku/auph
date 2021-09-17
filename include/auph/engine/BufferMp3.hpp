#pragma once

#define DR_MP3_IMPLEMENTATION

#include <dr/dr_mp3.h>

namespace auph {

bool loadFileMp3(const char* filepath, BufferDataSource* dest) {
    drmp3_config config{};
    drmp3_uint64 totalFrames{};
    int16_t* data = drmp3_open_file_and_read_pcm_frames_s16(filepath, &config, &totalFrames, nullptr);
    if (data != nullptr) {
        dest->data.i16 = data;
        dest->format = SampleFormat_I16;
        dest->sampleRate = config.sampleRate;
        dest->channels = config.channels;
        dest->length = totalFrames;
        dest->reader = selectSourceReader(dest->format, dest->channels, false);
        return true;
    }
    return false;
}

bool loadMemoryMp3(const void* data, uint32_t size, BufferDataSource* dest) {
    drmp3_config config{};
    drmp3_uint64 totalFrames{};
    int16_t* samples = drmp3_open_memory_and_read_pcm_frames_s16(data, (size_t) size, &config, &totalFrames, nullptr);
    if (data != nullptr) {
        dest->data.i16 = samples;
        dest->format = SampleFormat_I16;
        dest->sampleRate = config.sampleRate;
        dest->channels = config.channels;
        dest->length = totalFrames;
        dest->reader = selectSourceReader(dest->format, dest->channels, false);
        return true;
    }
    return false;
}

struct StreamMp3 {
    drmp3 f{};
    uint64_t cursor = 0;
    SourceReader parentReader = nullptr;
    float prev[10]{};
};

inline MixSample* readStreamMp3(MixSample* mix,
                                const double begin,
                                const double end,
                                const double advance,
                                const BufferDataSource* dataSource,
                                MixSample volume) {
    auto* stream = (StreamMp3*) dataSource->streamData;
    const auto channels = (int)dataSource->channels;
    static const int BufferFloatsMax = 2048 * 10;
    float buffer[BufferFloatsMax];
    dataSource->data.buffer = buffer;

    if (stream->cursor != (uint64_t) ceil(begin)) {
        stream->cursor = (uint64_t) ceil(begin);
        drmp3_seek_to_pcm_frame(&stream->f, stream->cursor);
    }

    auto p = begin;
    auto newFrames = (int) end - (int) p;
    const auto startOffset = (int) p;
    for (int ch = 0; ch < channels; ++ch) {
        buffer[ch] = stream->prev[ch];
    }
    if (newFrames > BufferFloatsMax / channels - 1) {
        newFrames = BufferFloatsMax / channels - 1;
    }
    const auto framesReady = newFrames > 0 ? drmp3_read_pcm_frames_f32(&stream->f, newFrames, buffer + channels) : 0;

    if (framesReady > 0) {
        for (int ch = 0; ch < channels; ++ch) {
            stream->prev[ch] = buffer[framesReady * channels + ch];
        }
        mix = stream->parentReader(mix, p - startOffset, end - startOffset, advance, dataSource, volume);
    }
    dataSource->data.buffer = nullptr;
    stream->cursor = (uint64_t) ceil(end);
    return mix;
}

bool openStreamMp3(StreamMp3* stream, BufferDataSource* dest) {
    dest->format = SampleFormat_F32;
    dest->channels = stream->f.channels;
    dest->sampleRate = stream->f.sampleRate;
    dest->length = drmp3_get_pcm_frame_count(&stream->f);

    dest->streamData = stream;
    stream->parentReader = selectSourceReader(dest->format, dest->channels, false);
    dest->reader = readStreamMp3;
    return true;
}

bool openFileStreamMp3(const char* filepath, BufferDataSource* dest) {
    auto* stream = new StreamMp3();
    bool ok = drmp3_init_file(&stream->f, filepath, nullptr);
    if (!ok) {
        delete stream;
        return false;
    }
    return openStreamMp3(stream, dest);
}

bool openMemoryStreamMp3(const void* data, uint32_t size, BufferDataSource* dest) {
    auto* stream = new StreamMp3();
    bool ok = drmp3_init_memory(&stream->f, data, (size_t) size, nullptr);
    if (!ok) {
        delete stream;
        return false;
    }
    return openStreamMp3(stream, dest);
}

}


