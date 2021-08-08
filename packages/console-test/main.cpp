#include <auph/auph.hpp>

#include <cstdio>

int main() {
    printf("AUPH!\nAUPH!\n\n\n");

    auph::init();
    const auto source = auph::load("../../tester/assets/ogg/sample2.ogg", false);

    printf("Press any key to resume...\n\n");
    getc(stdin);
    auph::resume();

    printf("Press any key to PLAY...\n\n");
    getc(stdin);

    auph::play(source, 1.0f, 0.0f, 1.0f, true);

    printf("Press any key to pause...\n\n");
    getc(stdin);

    auph::pause();

    printf("Press any key to close...\n\n");
    getc(stdin);

    auph::shutdown();

    return 0;
}
