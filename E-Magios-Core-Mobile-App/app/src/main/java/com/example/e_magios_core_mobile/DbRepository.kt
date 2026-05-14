package com.example.e_magios_core_mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

enum class DbKind(val path: String) {
    SPELLS("spells.json"),
    SCHOOLS("schools.json")
}

class DbRepository {
    private val baseUrl = "https://kaliguri.github.io/E-Magios-Core-Site/data/"
    private val baseUrlForNews = "https://kaliguri.github.io/E-Magios-Core-Site/data/news.json"

    suspend fun load(kind: DbKind): List<SimpleItem> = withContext(Dispatchers.IO) {
        val url = URL(baseUrl + kind.path)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 10000
            readTimeout = 15000
            requestMethod = "GET"
        }

        try {
            val text = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            val arr = JSONArray(text)
            (0 until arr.length()).map { idx ->
                val obj = arr.getJSONObject(idx)
                mapObj(kind, obj)
            }
        } finally {
            conn.disconnect()
        }
    }

    suspend fun loadNews(): List<SimpleItem> = withContext(Dispatchers.IO) {
        val url = URL(baseUrlForNews)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 10000
            readTimeout = 15000
            requestMethod = "GET"
        }

        try {
            val text = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            val arr = JSONArray(text)
            (0 until arr.length()).map { idx ->
                val obj = arr.getJSONObject(idx)
                val id = obj.optString("id", idx.toString())
                val title = obj.optString("title", "(без названия)")
                val date = obj.optString("date", "")
                val brief = obj.optString("brief", "")
                val featuresArr = obj.optJSONArray("features") ?: JSONArray()
                val features = (0 until featuresArr.length()).mapNotNull { featuresArr.optString(it) }

                val body = buildString {
                    if (date.isNotBlank()) append("<font color='#999999'>$date</font><br><br>")
                    if (brief.isNotBlank()) {
                        append("<p>$brief</p>")
                    }
                    if (features.isNotEmpty()) {
                        append("<h4><font color='#10b981'>Что нового:</font></h4>")
                        append("<ul>")
                        features.forEach { f -> append("<li>$f</li>") }
                        append("</ul>")
                    }
                }

                SimpleItem(
                    id = id,
                    title = title,
                    subtitle = date,
                    body = body
                )
            }
        } finally {
            conn.disconnect()
        }
    }

    private fun mapObj(kind: DbKind, obj: JSONObject): SimpleItem {
        val id = obj.optString("id", obj.optString("name", ""))
        val name = obj.optString("name", "(без названия)")

        val subtitle = when (kind) {
            DbKind.SPELLS -> listOfNotNull(
                obj.optString("type").takeIf { it.isNotBlank() },
                obj.optString("school").takeIf { it.isNotBlank() }
            ).joinToString(" • ")

            DbKind.SCHOOLS -> listOfNotNull(
                obj.optString("rarity").takeIf { it.isNotBlank() },
                obj.optJSONArray("properties")?.let { props ->
                    (0 until props.length()).mapNotNull { props.optString(it) }.joinToString(", ")
                }?.takeIf { it.isNotBlank() }
            ).joinToString(" • ")
        }

        val description = obj.optString("description", "")
        
        val body = buildString {
            when (kind) {
                DbKind.SPELLS -> {
                    // Spell properties block
                    val actions = obj.optString("actions", "")
                    val actionType = obj.optString("actionType", "")
                    val range = obj.optString("range", "")
                    val target = obj.optString("target", "")
                    val duration = obj.optString("duration", "")
                    val damageType = obj.optString("damageType", "")
                    val concentration = obj.optString("concentration", "")
                    val school = obj.optString("school", "")
                    val source = obj.optString("source", "")
                    
                    if (actions.isNotBlank() || actionType.isNotBlank()) {
                         append("<b>Время накладывания:</b> $actions $actionType<br>")
                    }
                    if (range.isNotBlank()) append("<b>Дистанция:</b> $range<br>")
                    if (target.isNotBlank()) append("<b>Цель:</b> $target<br>")
                    if (duration.isNotBlank()) {
                        append("<b>Длительность:</b> $duration")
                        if (concentration.equals("Да", ignoreCase = true)) {
                             append(" (Концентрация)")
                        }
                        append("<br>")
                    }
                    if (damageType.isNotBlank()) append("<b>Тип урона:</b> $damageType<br>")
                    if (school.isNotBlank()) append("<b>Школа:</b> $school<br>")
                    if (source.isNotBlank()) append("<b>Источник:</b> $source<br>")
                    
                    append("<br>") // Separator
                    append(description.replace("\n", "<br>"))
                }
                
                DbKind.SCHOOLS -> {
                    append(description.replace("\n", "<br>"))
                    
                    val principles = obj.optJSONArray("principles")
                    if (principles != null && principles.length() > 0) {
                        append("<br><br><h4><font color='#10b981'>Принципы:</font></h4><ul>")
                        for (i in 0 until principles.length()) {
                            append("<li>${principles.getString(i)}</li>")
                        }
                        append("</ul>")
                    }
                    
                    val features = obj.optJSONArray("features")
                    if (features != null && features.length() > 0) {
                        append("<br><h4><font color='#10b981'>Особенности:</font></h4><ul>")
                        for (i in 0 until features.length()) {
                            append("<li>${features.getString(i)}</li>")
                        }
                        append("</ul>")
                    }
                    
                    val educational = obj.optJSONArray("educationalSpells")
                    if (educational != null && educational.length() > 0) {
                        append("<br><h4><font color='#10b981'>Учебные заклинания:</font></h4><p>")
                        val list = mutableListOf<String>()
                        for (i in 0 until educational.length()) list.add(educational.getString(i))
                        append(list.joinToString(", "))
                        append("</p>")
                    }
                }
            }
        }

        return SimpleItem(
            id = id,
            title = name,
            subtitle = subtitle,
            body = body
        )
    }
}
