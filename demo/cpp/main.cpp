#include <auph/auph.hpp>

#include <cstdio>
#include <cmath>
#include <ctime>

static auph::Buffer music{};
static auph::Buffer clap{};
static auph::Voice musicVoice{};

double usin(double x) {
    return 0.5 + 0.5 * sin(x * 3.14 * 2);
}

void onFrame(double time) {
    if (auph::get(music.id, auph::Param_State) & auph::Flag_Loaded) {
        if (!auph::isActive(musicVoice.id)) {
            musicVoice = auph::play(music, 1.0f, 0.0f, 1.0f, true);
        }

        const double t = time / 3.0;
        //auph::setRate(musicVoice, (float) (0.25 + usin(t)));

        static double nextClapTime = 0.0;
        if (time >= nextClapTime) {
            nextClapTime = time + 0.720 / 4.0;
            auph::play(clap, (float) (1.0 - usin(t)));
        }
    }
}

#if defined(__EMSCRIPTEN__)

#include <emscripten/html5.h>

EM_BOOL raf(double time, void* userData) {
    onFrame(time);
    return EM_TRUE;
}

#endif

int main() {
    printf("AUPH!\nAUPH!\n\n\n");

    auph::init();
    auph::resume();
    music = auph::load("../../assets/mp3/Kalimba.mp3", auph::Flag_Stream);
    clap = auph::load("../../assets/mp3/CLAP.mp3", 0);

#if defined(__EMSCRIPTEN__)
    emscripten_request_animation_frame_loop(raf, nullptr);
    return 0;
#else
    double time = 0.0;
    volatile bool running = true;
    while (running) {
        time += 0.03;
        onFrame(time);
        timespec ts{};
        ts.tv_nsec = 30 * 1000000;
        nanosleep(&ts, nullptr);
    }

    auph::pause();
    auph::shutdown();
#endif
    return 0;
}
