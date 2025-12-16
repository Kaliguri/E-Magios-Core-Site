package com.example.e_magios_core_mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

enum class DbKind(val path: String) {
    SPELLS("spells.json"),
    SCHOOLS("schools.json"),
    EFFECTS("effects.json")
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
                    if (date.isNotBlank()) appendLine(date)
                    if (brief.isNotBlank()) {
                        if (isNotEmpty()) appendLine()
                        appendLine(brief)
                    }
                    if (features.isNotEmpty()) {
                        if (isNotEmpty()) appendLine()
                        appendLine("Что нового:")
                        features.forEach { f -> appendLine("• $f") }
                    }
                }.trim()

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

            DbKind.EFFECTS -> obj.optString("actionType", "")
        }

        val description = obj.optString("description", "")
        val body = if (description.isNotBlank()) description else obj.toString(2)

        return SimpleItem(
            id = id,
            title = name,
            subtitle = subtitle,
            body = body
        )
    }
}
