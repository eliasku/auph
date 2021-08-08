#include <auph/auph.hpp>

#include <cstdio>

static auph::AudioData dataSource{};
static auph::Voice voice{};

#if defined(__EMSCRIPTEN__)

#include <emscripten/html5.h>

EM_BOOL onFrame(double time, void* userData) {
    if (auph::getAudioDataState(dataSource) & auph::AudioData_Loaded) {
        if (voice.id == 0) {
            voice = auph::play(dataSource, 1.0f, 0.0f, 1.0f, true);
        }
    }
    return EM_TRUE;
}

#endif

int main() {
    printf("AUPH!\nAUPH!\n\n\n");

    auph::init();
    auph::resume();
    dataSource = auph::load("../../tester/assets/ogg/sample2.ogg", false);

#if defined(__EMSCRIPTEN__)
    emscripten_request_animation_frame_loop(onFrame, nullptr);
    return 0;
#else

    printf("Press any key to PLAY...\n\n");
    getc(stdin);

    voice = auph::play(dataSource, 1.0f, 0.0f, 1.0f, true);

    printf("Press any key to pause...\n\n");
    getc(stdin);

    auph::pause();

    printf("Press any key to close...\n\n");
    getc(stdin);

    auph::shutdown();
#endif
    return 0;
}
