package ek;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import androidx.annotation.Keep;

@Keep
public class Auph {

    // Receive a broadcast Intent when a headset is plugged in or unplugged
    static class HeadsetBroadcastReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            restart();
        }
    }

    static HeadsetBroadcastReceiver headsetReceiver;

    /*
     * Creating engine in onResume() and destroying in onPause() so the stream retains exclusive
     * mode only while in focus. This allows other apps to reclaim exclusive stream mode.
     */
    @Keep
    static void start(final Activity activity) {
        if (headsetReceiver == null) {
            headsetReceiver = new HeadsetBroadcastReceiver();
            final IntentFilter filter = new IntentFilter(Intent.ACTION_HEADSET_PLUG);
            final Intent intent = activity.registerReceiver(headsetReceiver, filter);
            if (intent == null) {
                headsetReceiver = null;
            }
        }
    }

    @Keep
    static void stop(final Activity activity) {
        if (headsetReceiver != null) {
            try {
                activity.unregisterReceiver(headsetReceiver);
            } catch (Exception exception) {
                // just skip and clear receiver
            }
            headsetReceiver = null;
        }
    }

    @Keep
    native static int restart();
}
