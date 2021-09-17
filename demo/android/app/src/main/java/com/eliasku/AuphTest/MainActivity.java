package com.eliasku.AuphTest;

import androidx.appcompat.app.AppCompatActivity;
import android.content.res.AssetManager;
import android.app.Activity;
import android.os.Bundle;

import com.eliasku.AuphTest.databinding.ActivityMainBinding;
import ek.Auph;

public class MainActivity extends AppCompatActivity {

    // Used to load the 'native-lib' library on application startup.
    static {
        System.loadLibrary("native-lib");
    }

    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        start(this, getAssets());
    }

    @Override
    protected void onResume() {
        super.onResume();
        auphResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        auphPause();
    }

    public static native void start(final Activity activity, final AssetManager assetManager);

    public static native void auphResume();

    public static native void auphPause();
}