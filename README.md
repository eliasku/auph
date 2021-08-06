## 🔊 auph 🎧

Trivial audio mixer API for native and web targets.

### Packages

- [JavaScript Browser](./packages/webaudio) JavaScript implementation for Web Browsers (also used in C++ library for Emscripten/WebAssembly build)
- [C++](./packages/native) library supports macOS, iOS, Android and WebAssembly targets

### API

#### Context Management

`void init()`

`void resume()`

`void pause()`

`void shutdown()`

##### private / debug

`int getInteger(Var param)`

`dynamic _getAudioContext()`

#### Loading / unloading

`AudioSource loadAudioSource(string filepath, bool streaming)`

`void destroyAudioSource(AudioSource source)`

#### Control Voices
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

## Roadmap

- native: Play sounds with NodeJS! Require native bindings and JS wrapper interface
- native: Support for Windows (WASAPI) and Linux (ALSA)