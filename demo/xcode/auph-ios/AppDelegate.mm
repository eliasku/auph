//
//  AppDelegate.m
//  auph-ios
//
//  Created by ilyak on 7/26/21.
//

#import "AppDelegate.h"
#include <auph/auph.hpp>

#define AUPH_WAV
#define AUPH_MP3
#define AUPH_OGG

#include <auph/auph_impl.hpp>

@interface AppDelegate ()

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application launch.
    auph::init();
    const char* path = "assets/mp3/FUNKY_HOUSE.mp3";
    auto music = auph::load(path, auph::Flag_Stream);
    NSLog(@"%d", music.id);
    if(music.id) {
        auto voice = auph::play(music, 1.0f, 0.0f, 1.0f, true, false, auph::Bus_Music);
        NSLog(@"%d", voice.id);
    }
    return YES;
}


- (void)applicationWillResignActive:(UIApplication*)application {
// Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
// Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    auph::pause();
}


- (void)applicationDidEnterBackground:(UIApplication*)application {
// Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
// If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}


- (void)applicationWillEnterForeground:(UIApplication*)application {
// Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
}


- (void)applicationDidBecomeActive:(UIApplication*)application {
// Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    auph::resume();
}

@end
