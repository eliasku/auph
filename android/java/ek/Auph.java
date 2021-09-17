package ek;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

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

    /**
     * simple vibration
     **/
    private static Vibrator _vibrator;

    @SuppressLint("MissingPermission")
    @Keep
    public static int vibrate(final Activity activity, int durationMillis) {
        if (_vibrator == null && activity != null) {
            final Context context = activity.getApplicationContext();
            final int permission = context.checkCallingOrSelfPermission(Manifest.permission.VIBRATE);
            if (permission == 0 /* PackageManager.PERMISSION_GRANTED */) {
                _vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            }
        }

        if (_vibrator != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                _vibrator.vibrate(VibrationEffect.createOneShot(durationMillis, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                _vibrator.vibrate(durationMillis);
            }
            return 0;
        }

        return 1;
    }
}
