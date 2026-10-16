package com.tekirstudios.lale;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaleWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
