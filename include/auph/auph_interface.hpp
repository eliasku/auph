#pragma once

#include <cstdint>
#include <auph/engine/Buffer.hpp>
#include <auph/engine/Voice.hpp>

namespace auph {

void init();

void shutdown();

Buffer load(const char* filepath, int flags);

Buffer loadMemory(const void* data, int size, int flags);

void unload(Buffer buffer);

Voice voice(Buffer buffer, int gain, int pan, int rate, int flags, Bus bus);

void stop(int name);

void set(int name, int param, int value);

int get(int name, int param);

int vibrate(int durationMillis);

}

#include "auph.hpp"