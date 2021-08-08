{
  "targets": [
    {
      "target_name": "auph",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "auph-node.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!@(node -p \"require('./dep.js').includes[0]\")",
        "<!@(node -p \"require('./dep.js').includes[1]\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      "libraries": [
        "-framework CoreAudio",
        "-framework AudioToolbox"
      ]
    }
  ]
}