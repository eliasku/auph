#pragma once

#if defined(__APPLE__)

#include "CoreAudio.hpp"

#elif defined(__ANDROID__)

#include "Oboe.hpp"

#else

#include "Null.hpp"

#endif
