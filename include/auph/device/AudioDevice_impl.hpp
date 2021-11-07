#pragma once

#if defined(__APPLE__)

#include "CoreAudio.hpp"

#elif defined(__ANDROID__)

//#define OBOE_NULL
#include "Oboe.hpp"

#else

#include "Null.hpp"

#endif
