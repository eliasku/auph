cmake_minimum_required(VERSION 3.19)

include(npm.cmake)

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

target_include_directories(${PROJECT_NAME} PUBLIC include)

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

target_link_libraries(${PROJECT_NAME}
        PUBLIC dr-libs
        PUBLIC stb
        )

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    target_compile_options(${PROJECT_NAME}
            PUBLIC -x objective-c++
            )
    target_link_libraries(${PROJECT_NAME}
            PUBLIC "-framework CoreAudio"
            PUBLIC "-framework AudioToolbox"
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "iOS")
    target_compile_options(${PROJECT_NAME}
            PUBLIC -x objective-c++
            )
    target_link_libraries(${PROJECT_NAME}
            PUBLIC "-framework AVFoundation"
            PUBLIC "-framework AudioToolbox"
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Android")
    target_include_directories(${PROJECT_NAME}
            INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/include
            INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/src
            )
    target_link_libraries(${PROJECT_NAME}
            INTERFACE log
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    target_link_options(${PROJECT_NAME}
            PUBLIC SHELL:--pre-js ${CMAKE_CURRENT_SOURCE_DIR}/web/dist/emscripten/auph.js
            )
elseif (ANDROID)
    target_include_directories(${PROJECT_NAME}
            PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/include
            PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/src
            )
    target_link_libraries(${PROJECT_NAME}
            PUBLIC log
            )
endif ()

project(auph)
add_library(${PROJECT_NAME} INTERFACE)

target_include_directories(${PROJECT_NAME} INTERFACE include)

target_link_libraries(${PROJECT_NAME}
        INTERFACE dr-libs
        INTERFACE stb
        )

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    target_compile_options(${PROJECT_NAME}
            INTERFACE -x objective-c++
            )
    target_link_libraries(${PROJECT_NAME}
            INTERFACE "-framework CoreAudio"
            INTERFACE "-framework AudioToolbox"
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "iOS")
    target_compile_options(${PROJECT_NAME}
            INTERFACE -x objective-c++
            )
    target_link_libraries(${PROJECT_NAME}
            INTERFACE "-framework AVFoundation"
            INTERFACE "-framework AudioToolbox"
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Android")
    target_include_directories(${PROJECT_NAME}
            INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/include
            INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/android/oboe/src
            )
    target_link_libraries(${PROJECT_NAME}
            INTERFACE log
            )
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    target_link_options(${PROJECT_NAME}
            INTERFACE SHELL:--pre-js ${CMAKE_CURRENT_SOURCE_DIR}/web/dist/emscripten/auph.js
            )
endif ()