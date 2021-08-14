#pragma once

#include <stb/stb_vorbis.c>

namespace auph {

struct OggStream {
    stb_vorbis* f = nullptr;
    SourceReader parentReader = nullptr;
    float prev[2]{};
};

static void oggStreamReader(MixSample* mix,
                            const double begin,
                            const double end,
                            const double advance,
                            const BufferDataSource* dataSource,
                            MixSample volume) {
    auto* stream = (OggStream*) dataSource->streamData;
    const auto channels = dataSource->channels;
    static const int BufferFloatsMax = 2048 * 10;
    float buffer[BufferFloatsMax];
    dataSource->data.buffer = buffer;

    auto p = begin;
    auto newFrames = (int) end - (int) p;
    const auto startOffset = (int) p;
    buffer[0] = stream->prev[0];
    buffer[1] = stream->prev[1];
    if (newFrames > BufferFloatsMax / channels - 1) {
        newFrames = BufferFloatsMax / channels - 1;
    }
    const auto framesReady = newFrames > 0 ?
                             stb_vorbis_get_samples_float_interleaved(stream->f,
                                                                      (int) channels,
                                                                      buffer + channels,
                                                                      newFrames * channels) : 0;
    if (framesReady > 0) {
        stream->prev[0] = buffer[framesReady * channels - 2];
        stream->prev[1] = buffer[framesReady * channels - 1];
        stream->parentReader(mix, p - startOffset, end - startOffset, advance, dataSource, volume);
    }
    dataSource->data.buffer = nullptr;
}

bool streamFile_OGG(const char* filepath, BufferDataSource* dest) {
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

bool loadFile_OGG(const char* filepath, BufferDataSource* dest) {
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

}


