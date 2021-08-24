const path = require('path');

module.exports = (project) => {
    project.addModule({
        name: "auph",
        path: __dirname,
        cpp_include_path: [
            path.join(__dirname, "src")
        ],
        android: {
            cpp_include_path: [
                path.join(__dirname, "android/oboe/src"),
                path.join(__dirname, "android/oboe/include")
            ],
            java: [path.join(__dirname, "android/java")],
            cppLibs: ["android", "log", "OpenSLES"]
        },
        macos: {
            cpp_flags: {
                // TODO: this file is local compiled to static lib,
                // need to migrate flags to implementor module
                files: [
                    path.join(__dirname, "auph-static.cpp")
                ],
                flags: "-x objective-c++"
            },
            xcode: {
                frameworks: [
                    "AudioToolbox", "CoreAudio"
                ]
            }
        },
        ios: {
            cpp_flags: {
                // TODO: this file is local compiled to static lib,
                // need to migrate flags to implementor module
                files: [
                    path.join(__dirname, "auph-static.cpp")
                ],
                flags: "-x objective-c++"
            },
            xcode: {
                frameworks: [
                    "AudioToolbox", "AVFoundation"
                ]
            }
        },
        web: {
            pre_js: [path.resolve(__dirname, "web/dist/emscripten")]
        },
        windows: {},
        linux: {}
    });
};