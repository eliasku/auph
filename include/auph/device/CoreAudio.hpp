#pragma once

#include "AudioDevice.hpp"
#include <TargetConditionals.h>
#import <AudioToolbox/AudioToolbox.h>

#if TARGET_OS_IOS
#include <AVFoundation/AVFoundation.h>
//#include <UIKit/UIKit.h>
//#define APPLE_ApplicationWillResignActiveNotification UIApplicationWillResignActiveNotification
//#define APPLE_ApplicationDidBecomeActiveNotification UIApplicationDidBecomeActiveNotification
#else
//#include <AppKit/AppKit.h>
//#define APPLE_ApplicationWillResignActiveNotification NSApplicationWillResignActiveNotification
//#define APPLE_ApplicationDidBecomeActiveNotification NSApplicationDidBecomeActiveNotification
#endif

#if __has_feature(objc_arc)
#define _AUPH_OBJC_RELEASE(obj) { obj = nil; }
#else
#define _AUPH_OBJC_RELEASE(obj) { [obj release]; obj = nil; }
#endif

#if TARGET_OS_IOS
@interface AudioAppEventsHandler : NSObject {}
- (void)startInterruptionHandler;
- (void)stopInterruptionHandler;
@end

AudioAppEventsHandler* _audioAppEventsHandler = nullptr;
#endif

namespace auph {

void audioPlaybackCallback(void* inUserData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer);

bool createAudioQueue(AudioQueueRef* outAudioQueue, AudioDevice* device);

bool checkError(OSStatus status) {
    if (status != noErr) {
        // NSLog(@"Error: %d", status);
        return true;
    }
    return false;
}

class AudioDevice {
public:
    static constexpr int BufferFrames = 2048;
    static constexpr int BuffersCountMax = 3;

    static AudioDevice* instance;

    AudioQueueRef audioQueue = nullptr;
    AudioDeviceCallback onPlayback = nullptr;
    void* userData = nullptr;
    AudioStreamInfo playbackStreamInfo{};
    AudioQueueBufferRef buffers[BuffersCountMax]{};

    AudioDevice() {
        AudioDevice::instance = this;
        #if TARGET_OS_IOS
        _audioAppEventsHandler = [AudioAppEventsHandler new];
        #endif
    }

    bool start() {
        if (!createAudioQueue(&audioQueue, this)) {
            return false;
        }
        if (checkError(AudioQueueStart(audioQueue, nullptr))) {
            checkError(AudioQueueDispose(audioQueue, false));
            audioQueue = nullptr;
            return false;
        }

        #if TARGET_OS_IOS
        [_audioAppEventsHandler startInterruptionHandler];
        #endif

        return true;
    }

    bool stop() {
        if (audioQueue != nullptr) {
            auto* queue = audioQueue;
            if (checkError(AudioQueueStop(queue, true))) {
                return false;
            }

            if (checkError(AudioQueueDispose(queue, false))) {
            //    return false;
            }

            audioQueue = nullptr;
            #if TARGET_OS_IOS
            [_audioAppEventsHandler stopInterruptionHandler];
            #endif
        }
        return true;
    }

    ~AudioDevice() {
        stop();
        #if TARGET_OS_IOS
        _AUPH_OBJC_RELEASE(_audioAppEventsHandler);
        #endif
        userData = nullptr;
        onPlayback = nullptr;
        instance = nullptr;
    }

    static int vibrate(int millis) {
        (void) (millis);
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
        return 0;
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

inline void audioPlaybackCallback(void* inUserData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer) {
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

AudioDevice* AudioDevice::instance = nullptr;

}

#if TARGET_OS_IOS

@implementation AudioAppEventsHandler

-(id)init {
    self = [super init];

    //[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationWillResign:) name:APPLE_ApplicationWillResignActiveNotification object:NULL];
    //[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidBecomeActive:) name:APPLE_ApplicationDidBecomeActiveNotification object:NULL];

    #if TARGET_OS_IOS
    AVAudioSession* session = [AVAudioSession sharedInstance];
    assert(session != nil);
    if(![session setCategory: AVAudioSessionCategoryAmbient
                           error:nil]) {
        NSLog(@"failed to activate audio session");
    }
    if(![session setActive:true error:nil]) {
        NSLog(@"failed to activate audio session");
    }
    #endif
    return self;
}

-(void)dealloc {
    //[[NSNotificationCenter defaultCenter] removeObserver:self name:APPLE_ApplicationWillResignActiveNotification object:NULL];
    //[[NSNotificationCenter defaultCenter] removeObserver:self name:APPLE_ApplicationDidBecomeActiveNotification object:NULL];

#if !__has_feature(objc_arc)
    [super dealloc];
#endif
}

-(void)startInterruptionHandler {
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSNotificationCenter* center = [NSNotificationCenter defaultCenter];
    [center addObserver:self selector:@selector(onInterruption:) name:AVAudioSessionInterruptionNotification object:session];
}

-(void)stopInterruptionHandler {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVAudioSessionInterruptionNotification object:nil];
}

-(void)onInterruption:(NSNotification*)notification {
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

//-(void)applicationWillResign:(NSNotification*)notification {
//    auph::AudioDevice::instance->stop();
//}
//
//-(void)applicationDidBecomeActive:(NSNotification*)notification {
//    auph::AudioDevice::instance->start();
//}

@end

#endif