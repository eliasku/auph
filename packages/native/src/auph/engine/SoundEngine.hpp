#pragma once

#include "../device/AudioDevice.hpp"

namespace auph {

enum VoiceStateFlags : uint8_t {
    Voice_Running = 1,
    Voice_Paused = 2,
    Voice_Loop = 4
};

constexpr uint32_t vMask = 0xFFFF00;
constexpr uint32_t vIncr = 0x000100;
constexpr uint32_t iMask = 0x0000FF;

union SamplesData {
    void* buffer;
    float* f32;
    int16_t* i16;
};

struct AudioSource;

struct MixSample {
    float L;
    float R;
};

/**
 * stream reader function
 * reads num of frames and return number of read frames
 */
typedef void (* SourceReader)(MixSample*, const double, const double, const double, const AudioSource*, MixSample gain);

struct AudioSource {
    void* streamData = nullptr;
    SamplesData data = {nullptr};
    // length in frames (samples / channels)
    uint32_t length = 0;

    SampleFormat format = SampleFormat_I16;
    uint32_t sampleRate = 0;
    uint32_t channels = 0;
    SourceReader reader = nullptr;
};

struct Voice;


struct Voice {
    uint8_t controlFlags = 0;

    float gain = 1.0f;
    float pan = 0.0f;
    // playback speed
    float pitch = 1.0f;
    // playback position in frames :(
    double position = 0.0;

    const AudioSource* source = nullptr;
};

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
static inline void mixSamples(MixSample* mix,
                              const double begin,
                              const double end,
                              const double advance,
                              const AudioSource* audioSource,
                              MixSample gain) {
    const float gainL = gain.L / Divisor;
    const float gainR = gain.R / Divisor;
    const S* source = reinterpret_cast<const S*>(audioSource->data.buffer);
    double p = begin;
    while (p < end) {
        const auto frame = (uint32_t) p;
        if constexpr(Interpolate) {
            const uint32_t frames = audioSource->length;
            const auto t = p - (double) frame;
            const auto ti = 1.0 - t;
            const auto frame2 = (frame + 1) % frames;
            if constexpr(Channels == 2) {
                auto iA = frame << 1;
                auto iB = frame2 << 1;
                mix->L += gainL * (source[iA++] * ti + source[iB++] * t);
                mix->R += gainR * (source[iA] * ti + source[iB] * t);
            }
            if constexpr(Channels == 1) {
                const float M = source[frame] * ti + source[frame2] * t;
                mix->L += gainL * M;
                mix->R += gainR * M;
            }
        } else {
            if constexpr(Channels == 2) {
                auto i = frame << 1;
                mix->L += gainL * source[i++];
                mix->R += gainR * source[i];
            }
            if constexpr(Channels == 1) {
                const float M = source[frame];
                mix->L += gainL * M;
                mix->R += gainR * M;
            }
        }
        ++mix;
        p += advance;
    }
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

void renderVoices(Voice* voices, uint32_t voicesCount, MixSample* dest, uint32_t frames, uint32_t sampleRate) {
    for (uint32_t voiceIndex = 0; voiceIndex < voicesCount; ++voiceIndex) {
        auto& voice = voices[voiceIndex];

        if (voice.controlFlags & Voice_Running) {
            auto p = voice.position;
            const double pitch = voice.pitch * (double) voice.source->sampleRate / sampleRate;
            voice.position += frames * pitch;
            double playNext = 0.0;
            if (voice.position >= voice.source->length) {
                if (voice.controlFlags & Voice_Loop) {
                    voice.position = 0;
                    playNext = voice.position - (double) voice.source->length;
                } else {
                    voice.controlFlags ^= Voice_Running;
                }
                voice.position = voice.source->length;
            }
            const MixSample gain{
                    voice.gain * (1.0f - voice.pan),
                    voice.gain * (1.0f + voice.pan)
            };
            voice.source->reader(dest, p, voice.position, pitch, voice.source, gain);
            if (playNext > 0.0) {
                voice.position = playNext;
                voice.source->reader(dest, 0.0, playNext, pitch, voice.source, gain);
            }
        }
    }
}

class SoundEngine {
public:
    static inline constexpr uint32_t VoicesMaxCount = 64;
    static inline constexpr uint32_t ScratchBufferSize = 2048;
    Voice voices[VoicesMaxCount]{};
    MixSample scratch[ScratchBufferSize]{};

    void mix(MixSample* dest, uint32_t frames, uint32_t sampleRate) {
        const uint32_t samples = frames << 1;
        clear((float*) dest, samples);
        renderVoices(voices, VoicesMaxCount, dest, frames, sampleRate);
        clip((float*) dest, samples);
    }

    static void playback(AudioDeviceCallbackData* data) {
        auto* engine = (SoundEngine*) data->userData;
        const auto sampleRate = (uint32_t) data->stream.sampleRate;
        // TODO: support F32 output
        auto* src = engine->scratch;
        engine->mix(src, data->frames, sampleRate);

        uint32_t p = 0;
        auto* dest = (int16_t*) data->data;
        for (uint32_t i = 0; i < data->frames; ++i) {
            dest[p++] = (int16_t) (src->L * 0x8000);
            dest[p++] = (int16_t) (src->R * 0x8000);
            ++src;
        }
    }
};

}