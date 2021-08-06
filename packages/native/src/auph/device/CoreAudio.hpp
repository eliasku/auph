#pragma once

#include "AudioDevice.hpp"
#include <AudioToolbox/AudioToolbox.h>
#include <TargetConditionals.h>

#if TARGET_OS_IOS
#include <AVFoundation/AVFoundation.h>

#if __has_feature(objc_arc)
#define _AUPH_OBJC_RELEASE(obj) { obj = nil; }
#else
#define _AUPH_OBJC_RELEASE(obj) { [obj release]; obj = nil; }
#endif

void startInterruptionHandler();
void stopInterruptionHandler();

#endif

namespace auph {

static void audioPlaybackCallback(void* inUserData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer);

bool createAudioQueue(AudioQueueRef* outAudioQueue, AudioDevice* device);

bool checkError(OSStatus status) {
    if (status != noErr) {
        // NSLog(@"Error: %d", status);
        return true;
    }
    return false;
}

//Float64 getDeviceSampleRate(AudioDeviceID deviceID) {
//    AudioObjectPropertyAddress propertyAddress = {
//            .mSelector  = kAudioDevicePropertyNominalSampleRate,
//            .mScope     = kAudioObjectPropertyScopeGlobal,
//            .mElement   = 0
//    };
//
//    UInt32 dataSize = sizeof(Float64);
//    Float64 sampleRate = 0;
//    OSStatus status = AudioObjectGetPropertyData(deviceID, &propertyAddress, 0, nullptr, &dataSize, &sampleRate);
//    if (status != kAudioHardwareNoError) {
//        return 0;
//    }
//    return sampleRate;
//}

class AudioDevice {
public:
    static inline constexpr unsigned BufferFrames = 2048;
    static inline constexpr unsigned BuffersCountMax = 3;

    static inline AudioDevice* instance = nullptr;

    AudioQueueRef audioQueue = nullptr;
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;
    AudioStreamInfo playbackStreamInfo{};
    AudioQueueBufferRef buffers[BuffersCountMax]{};

    AudioDevice() {
        instance = this;
    }

//    void refreshDevices() {
//        AudioObjectPropertyAddress propertyAddress = {
//                .mSelector  = kAudioHardwarePropertyDefaultOutputDevice,
//                .mScope     = kAudioObjectPropertyScopeGlobal,
//                .mElement   = kAudioObjectPropertyElementWildcard
//        };
//
//        UInt32 dataSize = 0;
//        OSStatus result = AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, &propertyAddress, 0, NULL,
//                                                         &dataSize);
//        if (result != kAudioHardwareNoError) {
//            return;
//        }
//
//        AudioObjectID* deviceIDs = (AudioObjectID*) malloc(dataSize);
//        if (!deviceIDs) {
//            return;
//        }
//
//        result = AudioObjectGetPropertyData(kAudioObjectSystemObject, &propertyAddress, 0, NULL, &dataSize, deviceIDs);
//        if (kAudioHardwareNoError != result) {
//            free(deviceIDs);
//            return;
//        }
//
//        const auto devicesCount = dataSize / sizeof(AudioObjectID);
//        for (int i = 0; i < devicesCount; ++i) {
//            const auto deviceID = deviceIDs[i];
//            if (deviceID != kAudioObjectUnknown) {
//                printf("Output Device: %d\n", deviceID);
//                printf(" - Sample Rate: %0.2f", getDeviceSampleRate(deviceID));
//            }
//        }
//
//        free(deviceIDs);
//    }

    bool start() {
        //refreshDevices();
#if TARGET_OS_IOS
        startInterruptionHandler();
#endif // TARGET_OS_IOS

        if (!createAudioQueue(&audioQueue, this)) {
            return false;
        }
        if (checkError(AudioQueueStart(audioQueue, nullptr))) {
            return false;
        }
        return true;
    }

    bool stop() {
        if (audioQueue != nullptr) {
            if (checkError(AudioQueueStop(audioQueue, true))) {
                return false;
            }
//            for (unsigned i = 0; i < BuffersCountMax; ++i) {
//                checkError(AudioQueueFreeBuffer(audioQueue, buffers[i]));
//            }
            if (checkError(AudioQueueDispose(audioQueue, false))) {
                return false;
            }
            audioQueue = nullptr;
        }

#if TARGET_OS_IOS
        stopInterruptionHandler();
#endif

        return true;
    }

    ~AudioDevice() {
        userData = nullptr;
        onPlayback = nullptr;
        stop();
        instance = nullptr;
    }
};

bool createAudioQueue(AudioQueueRef* outAudioQueue, AudioDevice* device) {
    AudioStreamBasicDescription format;
    format.mSampleRate = 44100.0;
    format.mFormatID = kAudioFormatLinearPCM;
    format.mFormatFlags = kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked;
    format.mFramesPerPacket = 1;
    format.mChannelsPerFrame = 2;
    format.mBitsPerChannel = 8 * sizeof(int16_t);
    format.mBytesPerFrame = sizeof(int16_t) * format.mChannelsPerFrame;
    format.mBytesPerPacket = format.mBytesPerFrame * format.mFramesPerPacket;
    format.mReserved = 0;

    if (checkError(AudioQueueNewOutput(&format,
                                       audioPlaybackCallback,
                                       device,
                                       nullptr,
                                       nullptr /* kCFRunLoopCommonModes */,
                                       0,
                                       outAudioQueue))) {
        return false;
    }

    /* create 3 audio buffers */
    for (int i = 0; i < AudioDevice::BuffersCountMax; ++i) {
        AudioQueueBufferRef buffer = nullptr;
        const uint32_t bufferSize = AudioDevice::BufferFrames * format.mBytesPerFrame;
        if (checkError(AudioQueueAllocateBuffer(*outAudioQueue, bufferSize, &buffer))) {
            return false;
        }
        buffer->mAudioDataByteSize = bufferSize;
        memset(buffer->mAudioData, 0, bufferSize);
        device->buffers[i] = buffer;
        AudioQueueEnqueueBuffer(*outAudioQueue, buffer, 0, nullptr);
    }

    device->playbackStreamInfo.bytesPerSample = format.mBytesPerPacket;
    device->playbackStreamInfo.channels = format.mChannelsPerFrame;
    device->playbackStreamInfo.bytesPerFrame = format.mBytesPerFrame;
    device->playbackStreamInfo.sampleRate = (float) format.mSampleRate;
    device->playbackStreamInfo.format = SampleFormat_I16;

    return true;
}

static void audioPlaybackCallback(void* inUserData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer) {
    const auto* device = static_cast<AudioDevice*>(inUserData);
    auto cb = device->onPlayback;
    if (cb != nullptr) {
        AudioDeviceCallbackData data;
        data.data = inBuffer->mAudioData;
        data.stream = device->playbackStreamInfo;
        data.userData = device->userData;
        data.frames = inBuffer->mAudioDataByteSize / data.stream.bytesPerFrame;
        cb(&data);
    } else {
        memset(inBuffer->mAudioData, 0, inBuffer->mAudioDataByteSize);
    }
    AudioQueueEnqueueBuffer(inAQ, inBuffer, 0, nullptr);
}


}

#if TARGET_OS_IOS
@interface _ios_interruption_handler : NSObject { }
@end

@implementation _ios_interruption_handler

-(id)init {
    self = [super init];
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSNotificationCenter* center = [NSNotificationCenter defaultCenter];
    [center addObserver:self selector:@selector(handle_interruption:) name:AVAudioSessionInterruptionNotification object:session];
    return self;
}

-(void)dealloc {
    [self remove_handler];
#if !__has_feature(objc_arc)
    [super dealloc];
#endif
}

-(void)remove_handler {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVAudioSessionInterruptionNotification object:nil];
}

-(void)handle_interruption:(NSNotification*)notification {
    auto* device = auph::AudioDevice::instance;
    NSLog(@"handle_interruption");
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSAssert(session, @"invalid audio session");
    NSDictionary* dict = notification.userInfo;
    NSAssert(dict, @"audio session user info missing");
    NSInteger type = [[dict valueForKey:AVAudioSessionInterruptionTypeKey] integerValue];
    NSInteger interruptionOption = [[dict valueForKey:AVAudioSessionInterruptionOptionKey] integerValue];
    switch (type) {
        case AVAudioSessionInterruptionTypeBegan:
            if(device != nullptr) {
                device->stop();
            }
            [session setActive:false error:nil];
            break;
        case AVAudioSessionInterruptionTypeEnded:
            if (interruptionOption == AVAudioSessionInterruptionOptionShouldResume) {
                [session setActive:true error:nil];
                if(device != nullptr) {
                    device->start();
                }
            }
            break;
        default:
            break;
    }
}
@end

_ios_interruption_handler* currentInterruptionHandler = nullptr;

void startInterruptionHandler() {
    if(currentInterruptionHandler == nil) {
        /* activate audio session */
        AVAudioSession* session = [AVAudioSession sharedInstance];
        assert(session != nil);
        if(![session setCategory: AVAudioSessionCategoryAmbient
                           error:nil]) {
            NSLog(@"failed to activate audio session");
        }
        if(![session setActive:true error:nil]) {
            NSLog(@"failed to activate audio session");
        }

        /* create interruption handler */
        currentInterruptionHandler = [_ios_interruption_handler new];
    }
}

void stopInterruptionHandler() {
    if(currentInterruptionHandler != nil) {
        if (currentInterruptionHandler != nil) {
            [currentInterruptionHandler remove_handler];
            _AUPH_OBJC_RELEASE(currentInterruptionHandler);
        }
        /* deactivate audio session */
        AVAudioSession* session = [AVAudioSession sharedInstance];
        assert(session != nil);
        [session setActive:false error:nil];;
    }
}

#endif
