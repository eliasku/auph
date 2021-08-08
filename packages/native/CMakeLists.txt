cmake_minimum_required(VERSION 3.19)
project(auph)

set(CMAKE_CXX_STANDARD 17)

add_library(${PROJECT_NAME} STATIC src/auph-all.cpp)
target_include_directories(${PROJECT_NAME}
        PUBLIC src
        PUBLIC external)

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")

    # for macOS: target you should link AudioToolbox and CoreAudio frameworks
    target_link_libraries(${PROJECT_NAME}
            PUBLIC "-framework CoreAudio"
            PUBLIC "-framework AudioToolbox")

    # for iOS: `AVFoundation.framework` and `AudioToolbox.framework`

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    target_link_options(${PROJECT_NAME} PUBLIC
            --js-library ${CMAKE_CURRENT_SOURCE_DIR}/../webaudio/dist/browser/_auph.js
            )
endif ()