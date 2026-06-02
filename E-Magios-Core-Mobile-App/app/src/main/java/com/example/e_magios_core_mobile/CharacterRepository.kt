package com.example.e_magios_core_mobile

import android.content.Context
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.Timestamp
import org.json.JSONArray
import org.json.JSONObject

class CharacterRepository(
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    private fun col(uid: String) = db.collection("users").document(uid).collection("characters")

    fun listenCharacters(uid: String, onUpdate: (List<Character>) -> Unit, onError: (Exception) -> Unit) =
        col(uid)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    onError(err)
                    return@addSnapshotListener
                }

                val list = snap?.documents
                    ?.mapNotNull { doc -> 
                        try {
                            mapDocToCharacter(doc)
                        } catch (e: Exception) {
                            Character(
                                id = doc.id,
                                name = "(Ошибка данных)",
                                description = "Не удалось прочитать данные: ${e.message}"
                            )
                        }
                    }
                    ?.sortedWith(compareByDescending<Character> { it.lastModified.orEmpty() })
                    ?: emptyList()

                onUpdate(list)
            }

    fun getCharacter(uid: String, id: String, onOk: (Character?) -> Unit, onError: (Exception) -> Unit) {
        col(uid).document(id).get()
            .addOnSuccessListener { doc ->
                if (!doc.exists()) {
                    onOk(null)
                    return@addOnSuccessListener
                }
                onOk(mapDocToCharacter(doc))
            }
            .addOnFailureListener(onError)
    }

    fun getCharacterDoc(uid: String, id: String, onOk: (DocumentSnapshot?) -> Unit, onError: (Exception) -> Unit) {
        col(uid).document(id).get()
            .addOnSuccessListener { doc ->
                if (!doc.exists()) onOk(null) else onOk(doc)
            }
            .addOnFailureListener { e ->
                if (id.isBlank()) {
                     onOk(null)
                } else {
                     onError(e)
                }
            }
    }

    fun createCharacter(uid: String, name: String, description: String, onOk: (String) -> Unit, onError: (Exception) -> Unit) {
        val doc = col(uid).document()
        val data = hashMapOf(
            "name" to name,
            "description" to description,
            "lastModified" to TimeUtil.nowIsoUtc(),
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        doc.set(data)
            .addOnSuccessListener { onOk(doc.id) }
            .addOnFailureListener(onError)
    }

    fun updateDescription(uid: String, id: String, name: String, description: Any, onOk: () -> Unit, onError: (Exception) -> Unit) {
        col(uid).document(id)
            .update(
                mapOf(
                    "name" to name,
                    "description" to description,
                    "lastModified" to TimeUtil.nowIsoUtc(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .addOnSuccessListener { onOk() }
            .addOnFailureListener(onError)
    }

    private fun mapDocToCharacter(doc: DocumentSnapshot): Character {
        val name = doc.getString("name") ?: "(без имени)"

        val level = when (val raw = doc.get("level")) {
            is Number -> raw.toInt()
            is String -> raw.toIntOrNull()
            else -> null
        }

        val lastModified = when (val raw = doc.get("lastModified")) {
            is String -> raw
            is Timestamp -> TimeUtil.formatIsoUtc(raw.toDate())
            else -> null
        }

        val description = extractDescriptionText(doc)

        return Character(
            id = doc.id,
            name = name,
            description = description,
            level = level,
            lastModified = lastModified
        )
    }

    fun extractDescriptionText(doc: DocumentSnapshot): String {
        try {
            // Safe checking of type instead of direct getString() which crashes if field is not a String
            val rawDesc = doc.get("description") ?: return ""
            
            return when (rawDesc) {
                is String -> rawDesc
                is Map<*, *> -> formatStructuredDescription(rawDesc)
                is List<*> -> rawDesc.filterIsInstance<String>().joinToString("\n").trim().ifBlank { "" }
                else -> rawDesc.toString() // Fallback to string representation for numbers etc
            }
        } catch (e: Exception) {
            return "(Ошибка чтения описания)"
        }
    }

    fun formatStructuredDescription(desc: Map<*, *>): String {
        return try {
            val background = (desc["background"] as? String).orEmpty().trim()
            val beliefs = (desc["beliefs"] as? String).orEmpty().trim()
            val misc = (desc["misc"] as? String).orEmpty().trim()

            val appearance = desc["appearance"] as? Map<*, *>
            val race = (appearance?.get("race") as? String).orEmpty().trim()
            val gender = (appearance?.get("gender") as? String).orEmpty().trim()
            val notes = (appearance?.get("notes") as? String).orEmpty().trim()

            buildString {
                if (race.isNotBlank() || gender.isNotBlank() || notes.isNotBlank()) {
                    appendLine("Внешность:")
                    if (race.isNotBlank()) appendLine("- Раса: $race")
                    if (gender.isNotBlank()) appendLine("- Пол: $gender")
                    if (notes.isNotBlank()) appendLine("- Заметки: $notes")
                    appendLine()
                }
                if (background.isNotBlank()) {
                    appendLine("Прошлое:")
                    appendLine(background)
                    appendLine()
                }
                if (beliefs.isNotBlank()) {
                    appendLine("Убеждения:")
                    appendLine(beliefs)
                    appendLine()
                }
                if (misc.isNotBlank()) {
                    appendLine("Прочее:")
                    appendLine(misc)
                    appendLine()
                }
            }.trim()
        } catch (e: Exception) {
            "(Ошибка форматирования)"
        }
    }

    object CharacterCache {
        private const val PREFS = "em_characters_cache"
        private const val KEY_LIST = "characters_list_v1"

        fun saveList(context: Context, list: List<Character>) {
            try {
                val arr = JSONArray()
                list.forEach { c ->
                    val obj = JSONObject()
                    obj.put("id", c.id)
                    obj.put("name", c.name)
                    obj.put("description", c.description)
                    if (c.level != null) obj.put("level", c.level)
                    if (!c.lastModified.isNullOrBlank()) obj.put("lastModified", c.lastModified)
                    arr.put(obj)
                }
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putString(KEY_LIST, arr.toString())
                    .apply()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun loadList(context: Context): List<Character> {
            val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LIST, null)
                ?: return emptyList()
            return try {
                val arr = JSONArray(raw)
                (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    val id = o.optString("id", "").trim()
                    if (id.isBlank()) return@mapNotNull null
                    Character(
                        id = id,
                        name = o.optString("name", "(без имени)"),
                        description = o.optString("description", ""),
                        level = if (o.has("level")) o.optInt("level") else null,
                        lastModified = o.optString("lastModified", "").trim().ifBlank { null }
                    )
                }.sortedWith(compareByDescending<Character> { it.lastModified.orEmpty() })
            } catch (_: Exception) {
                emptyList()
            }
        }

        fun getById(context: Context, id: String): Character? {
            if (id.isBlank()) return null
            return loadList(context).firstOrNull { it.id == id }
        }
    }
}
