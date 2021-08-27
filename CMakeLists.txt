cmake_minimum_required(VERSION 3.19)
project(auph-static)

set(CMAKE_CXX_STANDARD 17)

option(AUPH_WAV "Auph WAV format support" ON)
option(AUPH_MP3 "Auph MP3 format support" ON)
option(AUPH_OGG "Auph OGG format support" ON)

add_library(${PROJECT_NAME} STATIC auph-static.cpp)

if (AUPH_WAV)
    target_compile_definitions(${PROJECT_NAME} PUBLIC AUPH_WAV)
endif ()

if (AUPH_MP3)
    target_compile_definitions(${PROJECT_NAME} PUBLIC AUPH_MP3)
endif ()

if (AUPH_OGG)
    target_compile_definitions(${PROJECT_NAME} PUBLIC AUPH_OGG)
endif ()

target_include_directories(${PROJECT_NAME} PUBLIC src)

target_compile_options(${PROJECT_NAME}
        PUBLIC -Os
        PUBLIC -ffast-math
        PUBLIC -fno-exceptions
        PUBLIC -fno-rtti
        PUBLIC -Wall
        PUBLIC -Wextra
        )

target_link_options(${PROJECT_NAME}
        PUBLIC -Os
        )

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    target_compile_options(${PROJECT_NAME}
            PUBLIC -x objective-c++
            )
    # for macOS: target you should link AudioToolbox and CoreAudio frameworks
    target_link_libraries(${PROJECT_NAME}
            PUBLIC "-framework Foundation"
            PUBLIC "-framework CoreAudio"
            PUBLIC "-framework AudioToolbox")

    # for iOS: `AVFoundation.framework` and `AudioToolbox.framework`

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    target_link_options(${PROJECT_NAME} PUBLIC
            --pre-js ${CMAKE_CURRENT_SOURCE_DIR}/web/dist/emscripten/auph.js
            )
endif ()

project(auph)
add_library(${PROJECT_NAME} INTERFACE)

target_include_directories(${PROJECT_NAME} INTERFACE src)

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    target_compile_options(${PROJECT_NAME}
            INTERFACE -x objective-c++
            )

    # for macOS: target you should link AudioToolbox and CoreAudio frameworks
    target_link_libraries(${PROJECT_NAME}
            INTERFACE "-framework Foundation"
            INTERFACE "-framework CoreAudio"
            INTERFACE "-framework AudioToolbox")

    # for iOS: `AVFoundation.framework` and `AudioToolbox.framework`

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    target_link_options(${PROJECT_NAME} INTERFACE
            --pre-js ${CMAKE_CURRENT_SOURCE_DIR}/web/dist/emscripten/auph.js
            )
endif ()
