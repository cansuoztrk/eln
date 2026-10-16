// Applies Lale's native settings after `npx cap add android|ios`:
// permissions, portrait lock, notification icon, version, the Android
// home-screen countdown widget and its Capacitor bridge (LaleWidget).
// Idempotent: safe to run again. node scripts/native-config.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), s);
};
const exists = (p) => fs.existsSync(path.join(root, p));
const VERSION = require('../package.json').version;
const BUILD = 1;
const PKG = 'com/tekirstudios/lale';

// ───────────── Android ─────────────
if (exists('android')) {
  const mf = 'android/app/src/main/AndroidManifest.xml';
  let m = read(mf);
  if (!m.includes('xmlns:tools')) m = m.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools">');
  if (!m.includes('android:screenOrientation')) m = m.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:screenOrientation="portrait"');
  if (!m.includes('POST_NOTIFICATIONS'))
    m = m.replace(
      '    <uses-permission android:name="android.permission.INTERNET" />',
      `    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <!-- Session-end and reminder notifications use inexact, idle-allowed alarms; the app
         recomputes every timer from timestamps, so exact alarms (a Play policy review) are not needed. -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />
    <!-- No ads and no advertising ID: many users are minors (Families-friendly). -->
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove" />`,
    );
  if (!m.includes('.CountdownWidget'))
    m = m.replace(
      '        <provider',
      `        <receiver
            android:name=".CountdownWidget"
            android:label="@string/widget_name"
            android:exported="false">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="android.intent.action.DATE_CHANGED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/lale_widget_info" />
        </receiver>

        <provider`,
    );
  write(mf, m);

  const gradle = 'android/app/build.gradle';
  write(gradle, read(gradle).replace(/versionCode \d+/, `versionCode ${BUILD}`).replace(/versionName "[^"]*"/, `versionName "${VERSION}"`));

  // Strings: app name and widget labels (English default, Turkish, German, Spanish).
  const strings = {
    values: ['Lale', 'Exam countdown', 'days left', 'Add your exam date in Lale'],
    'values-tr': ['Lale', 'Sınav geri sayımı', 'gün kaldı', 'Sınav tarihini Lale’de ekle'],
    'values-de': ['Lale', 'Prüfungs-Countdown', 'Tage übrig', 'Prüfungsdatum in Lale eintragen'],
    'values-es': ['Lale', 'Cuenta atrás del examen', 'días restantes', 'Añade la fecha del examen en Lale'],
  };
  const esc = (s) => s.replace(/'/g, "\\'");
  for (const [dir, [app, widget, days, empty]] of Object.entries(strings)) {
    const file = `android/app/src/main/res/${dir}/strings.xml`;
    if (dir === 'values') {
      let s = read(file);
      if (!s.includes('widget_name'))
        s = s.replace('</resources>', `    <string name="widget_name">${esc(widget)}</string>\n    <string name="widget_days">${esc(days)}</string>\n    <string name="widget_empty">${esc(empty)}</string>\n</resources>`);
      write(file, s);
    } else {
      write(
        file,
        `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${esc(app)}</string>
    <string name="title_activity_main">${esc(app)}</string>
    <string name="widget_name">${esc(widget)}</string>
    <string name="widget_days">${esc(days)}</string>
    <string name="widget_empty">${esc(empty)}</string>
</resources>
`,
      );
    }
  }

  // Monochrome notification icon (a tulip) — Android tints it with iconColor.
  write(
    'android/app/src/main/res/drawable/ic_stat_lale.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M6,3.5l3,2.6L12,2l3,4.1l3,-2.6v5.2c0,3.3 -2.7,6 -6,6s-6,-2.7 -6,-6z"/>
    <path android:fillColor="#FFFFFFFF" android:pathData="M11.2,15.5h1.6V22h-1.6z"/>
    <path android:fillColor="#FFFFFFFF" android:pathData="M12,21.6C10.6,19 8.4,17.6 5.4,17.4c0.6,2.7 3.1,4.4 6.6,4.2zM12,21.6c1.4,-2.6 3.6,-4 6.6,-4.2c-0.6,2.7 -3.1,4.4 -6.6,4.2z"/>
</vector>
`,
  );

  // ── Home-screen countdown widget ──
  write(
    'android/app/src/main/res/xml/lale_widget_info.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:minResizeWidth="110dp"
    android:minResizeHeight="60dp"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="10800000"
    android:initialLayout="@layout/lale_widget"
    android:previewLayout="@layout/lale_widget"
    android:previewImage="@mipmap/ic_launcher"
    android:description="@string/widget_name"
    android:widgetCategory="home_screen" />
`,
  );
  write(
    'android/app/src/main/res/drawable/lale_widget_bg.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:angle="270" android:startColor="#FFFFF8F0" android:endColor="#FFFFE1E1" />
    <corners android:radius="24dp" />
</shape>
`,
  );
  write(
    'android/app/src/main/res/layout/lale_widget.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/lale_widget_bg"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="12dp">

    <ImageView
        android:layout_width="28dp"
        android:layout_height="28dp"
        android:contentDescription="@string/app_name"
        android:src="@mipmap/ic_launcher_foreground" />

    <TextView
        android:id="@+id/widget_days"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:fontFamily="sans-serif-black"
        android:includeFontPadding="false"
        android:text="—"
        android:textColor="#FFD7263D"
        android:textSize="40sp" />

    <TextView
        android:id="@+id/widget_unit"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/widget_days"
        android:textColor="#FF2A2320"
        android:textSize="13sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_label"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="2dp"
        android:ellipsize="end"
        android:gravity="center"
        android:maxLines="2"
        android:text="@string/widget_empty"
        android:textColor="#FF84776D"
        android:textSize="11sp" />
</LinearLayout>
`,
  );
  write(
    `android/app/src/main/java/${PKG}/CountdownWidget.java`,
    `package com.tekirstudios.lale;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;
import org.json.JSONObject;

/**
 * "N days left" until the exam. The app writes {exam, label, days, at} (at =
 * local midnight of the exam day, epoch ms) through the LaleWidget plugin; the
 * widget recomputes the day count itself, so it stays right without the app.
 */
public class CountdownWidget extends AppWidgetProvider {
    static final String PREFS = "lale_widget";
    static final String KEY = "json";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String a = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)) refreshAll(context);
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CountdownWidget.class));
        for (int id : ids) render(context, manager, id);
    }

    static void render(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.lale_widget);
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY, null);
        long at = 0;
        String label = null;
        String unit = null;
        try {
            if (raw != null) {
                JSONObject o = new JSONObject(raw);
                at = o.optLong("at", 0);
                label = o.optString("label", null);
                unit = o.optString("days", null);
            }
        } catch (Exception ignored) {
        }
        if (at > 0) {
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            long days = Math.max(0, Math.round((at - today.getTimeInMillis()) / 86400000.0));
            views.setTextViewText(R.id.widget_days, String.valueOf(days));
            views.setViewVisibility(R.id.widget_unit, View.VISIBLE);
            if (unit != null && !unit.isEmpty()) views.setTextViewText(R.id.widget_unit, unit);
            if (label != null && !label.isEmpty()) views.setTextViewText(R.id.widget_label, label);
        } else {
            views.setTextViewText(R.id.widget_days, "🌷");
            views.setViewVisibility(R.id.widget_unit, View.GONE);
            views.setTextViewText(R.id.widget_label, context.getString(R.string.widget_empty));
        }
        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
        manager.updateAppWidget(id, views);
    }
}
`,
  );
  write(
    `android/app/src/main/java/${PKG}/LaleWidgetPlugin.java`,
    `package com.tekirstudios.lale;

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
`,
  );
  write(
    `android/app/src/main/java/${PKG}/MainActivity.java`,
    `package com.tekirstudios.lale;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaleWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`,
  );
}

// ───────────── iOS ─────────────
if (exists('ios')) {
  const pl = 'ios/App/App/Info.plist';
  let p = read(pl);
  p = p.replace(/<key>UIRequiredDeviceCapabilities<\/key>\s*<array>\s*<string>armv7<\/string>\s*<\/array>/, '<key>UIRequiredDeviceCapabilities</key>\n\t<array>\n\t\t<string>arm64</string>\n\t</array>');
  p = p.replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/, '<key>UISupportedInterfaceOrientations</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>');
  if (!p.includes('ITSAppUsesNonExemptEncryption'))
    p = p.replace(
      '\t<key>UIViewControllerBasedStatusBarAppearance</key>',
      `\t<key>ITSAppUsesNonExemptEncryption</key>
\t<false/>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>tr</string>
\t<key>CFBundleLocalizations</key>
\t<array>
\t\t<string>tr</string>
\t\t<string>en</string>
\t\t<string>de</string>
\t\t<string>es</string>
\t</array>
\t<key>UIViewControllerBasedStatusBarAppearance</key>`,
    );
  // The first CFBundleDevelopmentRegion (en) stays the default; drop a duplicate key if Capacitor added one.
  const dup = p.match(/<key>CFBundleDevelopmentRegion<\/key>/g);
  if (dup && dup.length > 1) p = p.replace(/\t<key>CFBundleDevelopmentRegion<\/key>\n\t<string>tr<\/string>\n/, '');
  write(pl, p);
}
console.log('native config applied');
