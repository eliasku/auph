# 🔊 auph 🎧

[![Build](https://github.com/eliasku/auph/actions/workflows/build.yml/badge.svg)](https://github.com/eliasku/auph/actions/workflows/build.yml)
[![Version](https://img.shields.io/npm/v/auph)](https://www.npmjs.com/package/auph)
[![Downloads](https://img.shields.io/npm/dw/auph)](https://www.npmjs.com/package/auph)

Trivial audio mixer API for native and web targets. [Online Demo](https://eliasku.github.io/auph/)

> ⚠️ Work in progress!
> API is constantly changing.
> The native playback at the moment sounds bad, has not been tested, and has not been fully tested on mobile projects.

- [Auph JavaScript](./web/README.md)
- [Auph For NodeJS](./nodejs/README.md)
- [Auph C/C++](./NATIVE.md)

## Core Concepts

### Objects

- **Mixer**: global mixer, could be initialized and terminated, paused and resumed.
- **Buffer**: data buffers that can be loaded and unloaded. We are playing audio from Buffer objects.
- **Voice**: instance of Audio Player used to control sound playback.
- **Bus**: simple hierarchy object for mixing, Master Bus is connected to Mixer's output. All another bus objects are connected to the Master Bus. Bus splits game track audio voices by groups Music, Sound, Speech. Enable controlling of Gain and Muting for each audio group.

### Parameters

- **Gain**: volume of Bus or Voice.
- **Pan**: control stereo-panning of Voice, by default is `0` (center balance), full left channel is `-1`, full Right channel is `1`.
- **Rate**: control playback rate of Voice, by default is `1` (100% speed of playback)
  - alt: **Pitch**, **Speed**

### Voice Flags

- **Loop Mode**: voice could be in the loop mode or not.
- **Running Flag**: played voice is active until it's stopped, either we are able to *pause* or *resume* playback by setting **Running** flag on and off.

### Voice lifecycle

- **Play**: open voice object, associate it with *Audio Data* and start playback. If **Paused** flag is set on **Play**, voice is alive, but will being on pause.
- **Stop**: stop and close voice object.

## Notes

### Decoding MP3 audio files

It's recommended to re-encode all foreign MP3 audio files to fix `Safari` issues. For example, you could use `ffmpeg` tooling:

```shell
ffmpeg -i broken.mp3 -c:a copy -c:v copy fixed.mp3
```

## Building

#### Install build requirements first

- [NodeJS](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)

#### Install and Build

```shell
# install dependencies
yarn

# build js libraries for browser, nodejs and emscripten
yarn build
```

## Demo projects

#### Browser demo

```shell
yarn build-demo
yarn start-demo
```

#### NodeJS demo

```shell
cd demo
node node.js
```

#### C++ console demo with cmake
```shell
cd demo/cpp

# configure and build cmake project
cmake -B build .
cmake --build build

# run: current working directory is important to load shared assets correctly
cd build
./auph-console-test

```

#### iOS Xcode / Android projects

```shell
# install dependencies is required
yarn

# open Xcode project
open demo/xcode/auph-ios.xcodeproj

# open Android Studio project ("studio" is command-line shell for Android Studio)
studio demo/android
```

> Search path to dependencies is hardcoded in project settings, so you need `node_modules` folder in the repository root, if you working in monorepo workspaces you need to `no-hoist` them
