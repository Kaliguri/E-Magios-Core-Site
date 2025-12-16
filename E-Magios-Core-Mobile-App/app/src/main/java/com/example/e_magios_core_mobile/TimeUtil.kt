package com.example.e_magios_core_mobile

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object TimeUtil {
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun nowIsoUtc(): String = isoFormat.format(Date())

    fun formatIsoUtc(date: Date): String = isoFormat.format(date)
}

