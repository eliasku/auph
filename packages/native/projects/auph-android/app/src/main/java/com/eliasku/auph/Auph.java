package com.eliasku.auph;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

public class Auph {

    // Receive a broadcast Intent when a headset is plugged in or unplugged
    static class PluginBroadcastReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
//            mPlugCount++;
//            context.runOnUiThread(new Runnable() {
//                @Override
//                public void run() {
//                    String message = "Intent.HEADSET_PLUG #" + mPlugCount;
//                    mPlugTextView.setText(message);
//                }
//            });

            stopPlayback();
            startPlayback();
        }
    }

    private static PluginBroadcastReceiver pluginReceiver;

    /*
     * Creating engine in onResume() and destroying in onPause() so the stream retains exclusive
     * mode only while in focus. This allows other apps to reclaim exclusive stream mode.
     */
    public static void onResume(final Activity activity) {
        int result = startPlayback();
        if (result != 0) {
            // showToast("Error opening stream = " + result);
        }

        pluginReceiver = new PluginBroadcastReceiver();
        IntentFilter filter = new IntentFilter(Intent.ACTION_HEADSET_PLUG);
        activity.registerReceiver(pluginReceiver, filter);
    }

    public static void onPause(final Activity activity) {
        activity.unregisterReceiver(pluginReceiver);
        pluginReceiver = null;

        int result = stopPlayback();
        if (result != 0) {
            // showToast("Error stopping stream = " + result);
        }
    }

    public native static int startPlayback();

    public native static int stopPlayback();
}
