package com.eliasku.AuphTest;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;

import com.eliasku.AuphTest.databinding.ActivityMainBinding;
import com.eliasku.auph.Auph;

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

        start();
    }

    @Override
    protected void onResume() {
        super.onResume();
        Auph.onResume(this);
    }

    @Override
    protected void onPause() {
        super.onPause();
        Auph.onPause(this);
    }

    /**
     * A native method that is implemented by the 'native-lib' native library,
     * which is packaged with this application.
     */
    public static native void start();

}