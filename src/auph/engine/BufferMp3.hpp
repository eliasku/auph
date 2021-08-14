#pragma once

#define DR_MP3_IMPLEMENTATION
#include <dr/dr_mp3.h>

namespace auph {

bool loadFile_MP3(const char* filepath, BufferDataSource* dest) {
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

}


