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
    static class PluginBroadcastReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            restart();
        }
    }

    static PluginBroadcastReceiver pluginReceiver;

    /*
     * Creating engine in onResume() and destroying in onPause() so the stream retains exclusive
     * mode only while in focus. This allows other apps to reclaim exclusive stream mode.
     */
    static void start(final Activity activity) {
        if (pluginReceiver == null) {
            pluginReceiver = new PluginBroadcastReceiver();
            IntentFilter filter = new IntentFilter(Intent.ACTION_HEADSET_PLUG);
            activity.registerReceiver(pluginReceiver, filter);
        }
    }

    static void stop(final Activity activity) {
        if (pluginReceiver != null) {
            activity.unregisterReceiver(pluginReceiver);
            pluginReceiver = null;
        }
    }

    native static int restart();
}
