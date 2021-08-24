# auph

## 0.0.10

### Patch Changes

- d7b6d25: fix node objc++ compilation, rename package name for java android device reconnect handler, external headers path to main src path

## 0.0.9

### Patch Changes

- ea1ae60: web: decodeAudioData with callbacks (mobile safari)
- ea1ae60: web: init audio context fallback to default sample rate
- 56e00b0: web: remove audio-element streaming cuz of auto-play policy

## 0.0.8

### Patch Changes

- 9dba54b: add isBufferLoaded function
- 9dba54b: simplify js loader, add missing source file

## 0.0.7

### Patch Changes

- 4d063d4: web: fix unlock audio context with user gesture

## 0.0.6

### Patch Changes

- 8ea7595: web: fix AudioContext unlock
- 9034da3: cmake: auph and auph-static targets
- 8ea7595: android: load files from Android's AssetManager
- df89253: revert dr_mp3
- 8ea7595: core: initialization auto-starts device if platform allows
- 576fca9: update dr_mp3
- df89253: wasm: fix loading from memory
- 9034da3: native: fix MP3 ID3 check
- df89253: native: cmake fix compile defines for static target
- 8ea7595: demo: update projects
- 8ea7595: android: audio interruption support
- df89253: native: static library source simplified and moved out of source tree
- df89253: wasm: use --pre-js import for core library
- df89253: native: fix default Bus identifiers
- 8ea7595: ios: load files as bundle resources

## 0.0.5

### Patch Changes

- 023109a: webaudio: stop audio element at the end
- 023109a: load from memory
- 023109a: Fix NodeJS demo running

## 0.0.4

### Patch Changes

- b382e7a: Fix incorrect clipping for I16 output format
- b382e7a: Fix for ogg stream playback
- d212fb1: native: mp3 streaming
- 915b446: native: fix looping output
- 915b446: new assets for demo
