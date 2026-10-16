package com.tekirstudios.lale;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** JS bridge: LaleWidget.update({ json }) stores the countdown and redraws the widget. */
@CapacitorPlugin(name = "LaleWidget")
public class LaleWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json missing");
            return;
        }
        Context ctx = getContext();
        ctx.getSharedPreferences(CountdownWidget.PREFS, Context.MODE_PRIVATE).edit().putString(CountdownWidget.KEY, json).apply();
        CountdownWidget.refreshAll(ctx);
        call.resolve();
    }
}
