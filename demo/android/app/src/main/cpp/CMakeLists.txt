cmake_minimum_required(VERSION 3.19)
project(native-lib)

add_library(${PROJECT_NAME} SHARED
        native-lib.cpp
        )

target_include_directories(${PROJECT_NAME}
        PUBLIC ../../../../../../include
        PUBLIC ../../../../../../android/oboe/include
        PRIVATE ../../../../../../android/oboe/src
        )

find_library(log-lib log)

target_link_libraries(${PROJECT_NAME}
        PUBLIC ${log-lib}
        PUBLIC OpenSLES
        PUBLIC android
        )