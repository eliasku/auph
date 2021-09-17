#pragma once

#include "auph_interface.hpp"
#include <emscripten.h>

namespace auph {

void init() {
    EM_ASM(auph.init());
}

void shutdown() {
    EM_ASM(auph.shutdown());
}

Buffer load(const char* filepath, int flags) {
    int r = EM_ASM_INT(return auph.load(UTF8ToString($0), $1), filepath, flags);
    return {r};
}

Buffer loadMemory(const void* data, int size, int flags) {
    int r = EM_ASM_INT(return auph.loadMemory(HEAPU8.subarray($0, $0 + $1), $2), data, size, flags);
    return {r};
}

void unload(Buffer buffer) {
    EM_ASM(auph.unload($0), buffer.id);
}

Voice voice(Buffer buffer,
            int gain,
            int pan,
            int pitch,
            int flags,
            Bus bus) {
    int r = EM_ASM_INT(return auph.voice($0, $1, $2, $3, $4, $5, $6), buffer.id, gain, pan, pitch, flags, bus.id);
    return {r};
}

void stop(int name) {
    EM_ASM(auph.stop($0), name);
}

void set(int name, int param, int value) {
    EM_ASM(auph.set($0, $1, $2), name, param, value);
}

int get(int name, int param) {
    int r = EM_ASM_INT(return auph.get($0, $1), name, param);
    return r;
}

int vibrate(int durationMillis) {
    int r = EM_ASM_INT(return auph.vibrate($0), durationMillis);
    return r;
}

}

