/**
 *
 * @param {Project} project
 */
function setup(project) {
    project.addModule({
        name: "auph",
        path: __dirname,
        cpp_include: "include",
        android: {
            cpp_include: [
                "android/oboe/src",
                "android/oboe/include"
            ],
            cpp_lib: ["android", "log", "OpenSLES"],
            android_java: "android/java",
            android_permission: "android.permission.VIBRATE"
        },
        apple: {
            cpp_flags: {
                // TODO: this file is local compiled to static lib,
                // need to migrate flags to implementor module
                files: ["auph-static.cpp"],
                flags: "-x objective-c++"
            },
            xcode_framework: ["Foundation", "AudioToolbox"]
        },
        macos: {
            xcode_framework: "CoreAudio"
        },
        ios: {
            xcode_framework: "AVFoundation"
        },
        web: {
            js_pre: "web/dist/emscripten"
        },
        windows: {},
        linux: {}
    });

    project.importModule("@ekx/stb", __dirname);
    project.importModule("@ekx/dr-libs", __dirname);
}

module.exports = setup;