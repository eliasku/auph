#pragma once

#ifdef __APPLE__

#include "CoreAudio.hpp"

#elifdef __ANDROID__

#include "Oboe.hpp"

#else

#include "Null.hpp"

#endif
