package com.example.e_magios_core_mobile

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object TimeUtil {
    // SimpleDateFormat is not thread-safe, so we use a ThreadLocal or create a new instance.
    // Creating a new instance is safer and cheap enough here.
    private fun getIsoFormat() = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun nowIsoUtc(): String = getIsoFormat().format(Date())

    fun formatIsoUtc(date: Date): String = getIsoFormat().format(date)
}
