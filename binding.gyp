{
  "targets": [
    {
      "target_name": "auph",
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "sources": [
        "nodejs/auph-node.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "external",
        "src"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        [
          "OS=='linux'",
          {
          }
        ],
        [
          "OS=='mac'",
          {
            "libraries": [
              "-framework CoreAudio",
              "-framework AudioToolbox"
            ]
          }
        ],
        [
          "OS=='win'",
          {
          }
        ]
      ]
    }
  ]
}