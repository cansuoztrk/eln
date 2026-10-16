package com.tekirstudios.lale;

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
