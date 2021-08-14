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
            cpp: [
                path.join(__dirname, "platforms/apple"),
                path.join(__dirname, "platforms/mac")
            ],
            cpp_flags: {
                files: [
                    path.join(__dirname, "src/auph-all.cpp")
                ],
                flags: "-x objective-c++"
            },
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
            js: [require.resolve("auph/dist/browser/auph-emscripten.js")]
        },
        windows: {},
        linux: {}
    });

};