## Auph for C/C++

- [x] Android: [Google's Oboe](https://github.com/google/oboe) (OpenSLES / **AAudio**)
- [x] macOS: CoreAudio
- [x] iOS: CoreAudio + AVSession
- [x] WebAssembly: WebAudio
- [ ] Windows: WASAPI
- [ ] Linux: ALSA
- [x] NodeJS bindings

### Format support

- [x] ogg: [stb_vorbis](https://github.com/nothings/stb)
- [x] mp3: [dr_mp3](https://github.com/mackron/dr_libs)
- [x] wav: [dr_wav](https://github.com/mackron/dr_libs)

### Example
```cpp
#include <auph/auph.hpp>

...
// initialize and resume
auph::init();
auph::resume();

// load music stream
auto music = auph::load("../../assets/mp3/Kalimba.mp3", auph::Flag_Stream);
if(music) {
    // play music looped on dedicated Music Bus 
    auto voice = auph::play(music, 1.0f, 0.0f, 1.0f, true, false, auph::Bus_Music);
    if(voice) {
        
        ...
        
        // stop all active voices started with music source
        auph::stop(music);
    }
}
...
```
### Roadmap

- native: Support for Windows (WASAPI) and Linux (ALSA)