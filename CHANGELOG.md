# auph

## 0.1.1

### Patch Changes

- 4d0d4ba: native: skip voice mix with no data

## 0.1.0

### Minor Changes

- 9d3a2e1: add simple vibrate function

## 0.0.18

### Patch Changes

- d71ab6e: Fix Xcode and Android demo projects
- cf4d657: fix shutdown
- 7857053: web: minify driver, remove text messages
- d71ab6e: Readme instructions for project building
- 58f6a30: Bump typescript from 4.4.2 to 4.4.3
- d71ab6e: apple: add missing Foundation framework

## 0.0.17

### Patch Changes

- d0cf12a: use cmake-build for native build script
- d0cf12a: native: fix fourCC compile warning
- d0cf12a: cmake: fix emscripten and android targets

## 0.0.16

### Patch Changes

- 36e1927: web: fix set bus gain
- 0293675: fix ek config include path

## 0.0.15

### Patch Changes

- 3feb6ea: fix nodejs missing package file

## 0.0.14

### Patch Changes

- d9a9f20: Update configuration

## 0.0.13

### Patch Changes

- b6ce2cb: native: rename src to include (headers-only)
- b6ce2cb: add npm dependencies to dr-libs and stb

## 0.0.12

### Patch Changes

- d0eec4d: android: fixes and jni env getter callback
- 682b5ac: update module config (ek build)
- d0eec4d: update dr_mp3 to v0.6.31
- d0eec4d: cmake: remove interface options for headers-only target

## 0.0.11

### Patch Changes

- 0444230: Fix Oboe OpenSLES nullptr audio data

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
