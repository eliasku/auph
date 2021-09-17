#pragma once

#include <stb/stb_vorbis.c>

namespace auph {

struct StreamOgg {
    stb_vorbis* f = nullptr;
    uint64_t cursor = 0;
    SourceReader parentReader = nullptr;
    float prev[10]{};
};

inline MixSample* readStreamOgg(MixSample* mix,
                                const double begin,
                                const double end,
                                const double advance,
                                const BufferDataSource* dataSource,
                                MixSample volume) {
    auto* stream = (StreamOgg*) dataSource->streamData;
    const auto channels = (int)dataSource->channels;
    static const int BufferFloatsMax = 2048 * 10;
    float buffer[BufferFloatsMax];
    dataSource->data.buffer = buffer;

    if (stream->cursor != (uint64_t) ceil(begin)) {
        stream->cursor = (uint64_t) ceil(begin);
        stb_vorbis_seek_frame(stream->f, stream->cursor);
    }

    auto p = begin;
    auto newFrames = (int) end - (int) p;
    const auto startOffset = (int) p;
    buffer[0] = stream->prev[0];
    buffer[1] = stream->prev[1];
    for (int ch = 0; ch < channels; ++ch) {
        buffer[ch] = stream->prev[ch];
    }
    const auto framesReady = newFrames > 0 ?
                             stb_vorbis_get_samples_float_interleaved(stream->f,
                                                                      (int) channels,
                                                                      buffer + channels,
                                                                      newFrames * channels) : 0;
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

bool loadOgg(stb_vorbis* ogg, BufferDataSource* dest, bool streaming) {
    auto frames = stb_vorbis_stream_length_in_samples(ogg);
    auto info = stb_vorbis_get_info(ogg);

    dest->format = SampleFormat_F32;
    dest->channels = info.channels;
    dest->sampleRate = info.sample_rate;
    dest->length = frames;

    if (streaming) {
        auto* streamData = (StreamOgg*) malloc(sizeof(StreamOgg));
        memset(streamData, 0, sizeof(StreamOgg));
        dest->streamData = streamData;
        streamData->f = ogg;
        streamData->parentReader = selectSourceReader(dest->format, dest->channels, false);
        dest->reader = readStreamOgg;
    } else {
        int samples = (int) (info.channels * frames);
        auto* data = (float*) malloc(4 * info.channels * frames);

        const auto numFrames = stb_vorbis_get_samples_float_interleaved(ogg, info.channels, data, samples);
        stb_vorbis_close(ogg);

        dest->data.f32 = data;
        dest->length = numFrames;
        dest->reader = selectSourceReader(dest->format, dest->channels, false);
    }
    return true;
}

bool loadFileOgg(const char* filepath, BufferDataSource* dest, bool streaming) {
    int error = 0;
    auto* ogg = stb_vorbis_open_filename(filepath, &error, nullptr);
    if (error != 0 || ogg == nullptr) {
        stb_vorbis_close(ogg);
        return false;
    }
    return loadOgg(ogg, dest, streaming);
}

bool loadMemoryOgg(const void* data, uint32_t size, BufferDataSource* dest, bool streaming) {
    int error = 0;
    auto* ogg = stb_vorbis_open_memory((const uint8_t*) data, (int) size, &error, nullptr);
    if (error != 0 || ogg == nullptr) {
        stb_vorbis_close(ogg);
        return false;
    }
    return loadOgg(ogg, dest, streaming);
}

}


