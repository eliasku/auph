#pragma once

#include "../device/AudioDevice.hpp"
#include "Buffer.hpp"
#include "Voice.hpp"
#include "Bus.hpp"

namespace auph {

void clear(float* dest, uint32_t size) {
    for (uint32_t i = 0; i < size; ++i) {
        dest[i] = 0.0f;
    }
}

void clip(float* dest, uint32_t size) {
    for (uint32_t i = 0; i < size; ++i) {
        const float v = dest[i];
        if (v > 1.0f) {
            dest[i] = 1.0f;
        } else if (v < -1.0f) {
            dest[i] = -1.0f;
        }
    }
}

template<bool Interpolate, unsigned Channels, typename S, unsigned Divisor>
inline MixSample* mixSamples(MixSample* mix,
                              const double begin,
                              const double end,
                              const double advance,
                              const BufferDataSource* audioSource,
                              MixSample volume) {
    const float gainL = volume.L / Divisor;
    const float gainR = volume.R / Divisor;
    const S* source = reinterpret_cast<const S*>(audioSource->data.buffer);
    double p = begin;
    while (p < end) {
        const auto frame = (uint32_t) p;
        if (Interpolate) {
            const uint32_t frames = audioSource->length;
            const auto t = p - (double) frame;
            const auto ti = 1.0 - t;
            const auto frame2 = (frame + 1) % frames;
            if (Channels == 2) {
                auto iA = frame << 1;
                auto iB = frame2 << 1;
                mix->L += gainL * (source[iA++] * ti + source[iB++] * t);
                mix->R += gainR * (source[iA] * ti + source[iB] * t);
            } else if (Channels == 1) {
                const float M = source[frame] * ti + source[frame2] * t;
                mix->L += gainL * M;
                mix->R += gainR * M;
            }
        } else {
            if (Channels == 2) {
                auto i = frame << 1;
                mix->L += gainL * source[i++];
                mix->R += gainR * source[i];
            } else if (Channels == 1) {
                const float M = source[frame];
                mix->L += gainL * M;
                mix->R += gainR * M;
            }
        }
        ++mix;
        p += advance;
    }
    return mix;
}

SourceReader selectSourceReader(SampleFormat format, uint32_t channels, bool interpolate) {
    if (format == SampleFormat_F32) {
        if (interpolate) {
            if (channels == 2) {
                return mixSamples<true, 2, float, 1>;
            } else if (channels == 1) {
                return mixSamples<true, 1, float, 1>;
            }
        } else {
            if (channels == 2) {
                return mixSamples<false, 2, float, 1>;
            } else if (channels == 1) {
                return mixSamples<false, 1, float, 1>;
            }
        }
    } else if (format == SampleFormat_I16) {
        if (interpolate) {
            if (channels == 2) {
                return mixSamples<true, 2, int16_t, 0x8000>;
            } else if (channels == 1) {
                return mixSamples<true, 1, int16_t, 0x8000>;
            }
        } else {
            if (channels == 2) {
                return mixSamples<false, 2, int16_t, 0x8000>;
            } else if (channels == 1) {
                return mixSamples<false, 1, int16_t, 0x8000>;
            }
        }
    }
    return nullptr;
}

void renderVoices(VoiceObj* voices, BusObj* busline, uint32_t voicesCount, MixSample* dest, uint32_t frames,
                  uint32_t sampleRate) {
    const float masterGain = busline[0].get();
    for (uint32_t voiceIndex = 0; voiceIndex < voicesCount; ++voiceIndex) {
        auto& voice = voices[voiceIndex];
        if ((voice.state & Flag_Running) && voice.data != nullptr && voice.data->reader != nullptr) {
            auto* currentDest = dest;
            const float busGain = busline[voice.bus.id & iMask].get() * masterGain;

            auto p = voice.position;
            const double pitch = voice.rateF64() * (double) voice.data->sampleRate / sampleRate;
            double playNext = 0.0;
            double playTo = voice.position + frames * pitch;
            const double len = (double) voice.data->length;
            if (playTo >= len) {
                if (voice.state & Flag_Loop) {
                    playNext = playTo - len;
                } else {
                    voice.state ^= Flag_Running;
                }
                playTo = len;
            }
            voice.position = playTo;
            const float gain = busGain * voice.gainF32();
            const float pan = voice.panF32();
            const MixSample volume{gain * (1.0f - pan),
                                   gain * (1.0f + pan)};
            currentDest = voice.data->reader(currentDest, p, playTo, pitch, voice.data, volume);
            if (playNext > 0.0) {
                voice.position = playNext;
                voice.data->reader(currentDest, 0.0, playNext, pitch, voice.data, volume);
//                voice.position = 0;
            }

            if (!(voice.state & Flag_Running)) {
                voice.stop();
            }
        }
    }
}

class Mixer {
public:
    static constexpr int VoicesMaxCount = 64;
    static constexpr int ScratchBufferSize = 2048;
    VoiceObj* voices = nullptr;
    BusObj* busLine = nullptr;
    MixSample scratch[ScratchBufferSize]{};

    void mix(MixSample* dest, uint32_t frames, uint32_t sampleRate) const {
        const uint32_t samples = frames << 1;
        clear((float*) dest, samples);
        renderVoices(voices, busLine, VoicesMaxCount, dest, frames, sampleRate);
        clip((float*) dest, samples);
    }

    static void playback(AudioDeviceCallbackData* data) {
        auto* engine = (Mixer*) data->userData;
        const auto sampleRate = (uint32_t) data->stream.sampleRate;
        // TODO: support F32 output
        auto* src = engine->scratch;
        engine->mix(src, data->frames, sampleRate);

        uint32_t p = 0;
        auto* dest = (int16_t*) data->data;
        for (uint32_t i = 0; i < data->frames; ++i) {
            dest[p++] = (int16_t) (src->L * 0x7FFF);
            dest[p++] = (int16_t) (src->R * 0x7FFF);
            ++src;
        }
    }
};

}