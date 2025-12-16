package com.example.e_magios_core_mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {
    private const val CHANNEL_ID = "em_core_events"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "E'Magios события",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Уведомления о входе и сохранении персонажей"
        }

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    fun notify(context: Context, title: String, text: String, notificationId: Int) {
        ensureChannel(context)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.star_on)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(context).notify(notificationId, notification)
    }
}
