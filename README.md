# 🔊 auph 🎧

Trivial audio mixer API for native and web targets.

### Packages

- [JavaScript Browser](./packages/webaudio) JavaScript implementation for Web Browsers (also used in C++ library for Emscripten/WebAssembly build)
- [C++](./packages/native) library supports macOS, iOS, Android and WebAssembly targets

## Core Concepts

### Objects

- **Device**: single global engine or mixer object, could be initialized and terminated, paused and resumed.
- **AudioData**: data that can be loaded and unloaded. We are playing audio from Data objects.
- **Voice**: instance of Audio Player used to control sound playback.
- **Bus**: simple hierarchy object for mixing, Master Bus is connected to Audio Device. All another bus objects are connected to the Master Bus. Bus splits game track audio voices by groups Music, Sound, Speech. Enable controlling of Gain and Muting for each audio group.

### Parameters

- **Volume**: volume of Bus or Voice (gain).
  - alt: **Gain**
- **Pan**: control stereo-panning of Voice, by default is `0` (center balance), full left channel is `-1`, full Right channel is `1`.
- **Pitch**: control playback rate of Voice, by default is `1` (100% speed of playback)
  - alt: **Rate**, **Speed**

### Voice Flags

- **Loop Mode**: voice could be in the loop mode or not.
- **Paused Flag**: played voice is active until it's stopped, either we are able to *pause* or *resume* playback by setting **Paused** flag on and off.

### Voice lifecycle

- **Play**: open voice object, associate it with *Audio Data* and start playback. If **Paused** flag is set on **Play**, voice is alive, but will being on pause.
- **Stop**: stop and close voice object.

## API

### Device

- **init**
- **resume**
- **pause**
- **shutdown**

### Audio Data

- **load**
  - `(filepath: string, streaming: boolean) => AudioData`
- **unload**
  - `(data: AudioData) => void`

### Control Voices
```
Voice play(AudioSource source,
  volume = 1.0,
  pan = 0.0,
  pitch = 1.0,
  paused = false,
  loop = false
  Bus bus = 0)
```

`void stopAudioSource(AudioSource source)`

`void stop(Voice voice)`

`void setPan(Void voice, float value)`

`void setVolume(Void voice, float value)`

`void setPitch(Void voice, float value)`

`void setPause(Void voice, bool paused)`

### Extra

- **getInteger**: get global parameter value (sample rate, voices count, etc)
  - `(param:Var) => integer`
- **_getAudioContext()**: internal device's context
  - `() => any`

## Roadmap

- native: Play sounds with NodeJS! Require native bindings and JS wrapper interface
- native: Support for Windows (WASAPI) and Linux (ALSA)