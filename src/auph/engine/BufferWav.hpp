#pragma once

#define DR_WAV_IMPLEMENTATION
#include <dr/dr_wav.h>

namespace auph {

bool loadFile_WAV(const char* filepath, BufferDataSource* dest) {
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

}


