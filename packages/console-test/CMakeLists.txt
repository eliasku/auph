cmake_minimum_required(VERSION 3.19)
project(auph-console-test)

add_subdirectory(../native auph)

set(CMAKE_CXX_STANDARD 17)

add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} PUBLIC auph)

#target_include_directories(${PROJECT_NAME} PUBLIC auph)

#if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
#
#    # for Apple targets you should link AudioToolbox framework
#    target_link_libraries(${PROJECT_NAME}
##            PUBLIC "-framework CoreAudio"
#            PUBLIC "-framework AudioToolbox")
#
#    # for iOS also add `AVFoundation.framework` and `AudioToolbox.framework`
#
#elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")
#
#elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")
#
#endif ()
#
#if (EMSCRIPTEN)
#
#endif ()