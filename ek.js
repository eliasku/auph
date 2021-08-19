const path = require('path');

module.exports = (project) => {
    project.addModule({
        name: "auph",
        path: __dirname,
        cpp_include_path: [
            path.join(__dirname, "src"),
            path.join(__dirname, "external")
        ],
        android: {
            cpp_include_path: [
                path.join(__dirname, "android/oboe/src"),
                path.join(__dirname, "android/oboe/include")
            ],
            java: [path.join(__dirname, "android/java")]
        },
        macos: {
            cpp_flags: {
                files: [
                    path.join(__dirname, "src/auph-all.cpp")
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
                files: [
                    path.join(__dirname, "src/auph-all.cpp")
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