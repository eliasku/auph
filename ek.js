const path = require('path');

module.exports = (ctx) => {
    ctx.addModule({
        name: "auph",
        path: __dirname,
        cpp: [
            path.join(__dirname, "src"),
            path.join(__dirname, "external")
        ],
        android: {
            cpp: [
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