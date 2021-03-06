cmake_minimum_required(VERSION 3.19)
project(auph-console-test)

add_subdirectory(../.. auph)

set(CMAKE_CXX_STANDARD 17)

add_executable(${PROJECT_NAME} main.cpp)

target_link_libraries(${PROJECT_NAME}
        PUBLIC auph
        )

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
    #PUBLIC -fobjc-arc
    target_compile_options(${PROJECT_NAME}
            PUBLIC -x objective-c++
            )

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")

elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")

endif ()

if (EMSCRIPTEN)
    set(EM_COMMON_FLAGS
            -s FETCH=1
            -s WASM=1
            -s WASM_ASYNC_COMPILATION=1
            -s DISABLE_EXCEPTION_CATCHING=1
            -s ALLOW_MEMORY_GROWTH=1
            -s FILESYSTEM=0
            )

    # defaults:
    # -s DISABLE_EXCEPTION_CATCHING=1
    # -s WASM_OBJECT_FILES=0
    # -s ASSERTIONS=1
    # TODO: strange runtime DOM exception error with Release, "-s STRICT=1"

    if (CMAKE_BUILD_TYPE MATCHES Debug)
        set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS
                "-s ENVIRONMENT=web -s FETCH=1 -s FILESYSTEM=0 -s ALLOW_MEMORY_GROWTH=1"
                )
    else ()
        set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS
                "-s ENVIRONMENT=web -s FETCH=1 -s FILESYSTEM=0 -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=0"
                )
        # --closure 1
    endif ()

    set_target_properties(${PROJECT_NAME} PROPERTIES SUFFIX ".html")

endif ()