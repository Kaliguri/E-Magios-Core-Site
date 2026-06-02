package com.example.e_magios_core_mobile

import android.os.Bundle
import android.view.View
import com.example.e_magios_core_mobile.databinding.ActivityCharacterDetailBinding
import com.google.android.material.snackbar.Snackbar
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentSnapshot

class CharacterDetailActivity : BaseActivity() {
    private lateinit var binding: ActivityCharacterDetailBinding
    private val repo = CharacterRepository()
    private var authListener: FirebaseAuth.AuthStateListener? = null
    private var characterId: String? = null

    // To preserve original structure if we don't edit some parts
    private var originalDescriptionMap: Map<String, Any>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCharacterDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = getString(R.string.title_character_detail)
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        characterId = intent.getStringExtra(EXTRA_CHARACTER_ID)
        val id = characterId
        if (id.isNullOrBlank()) {
            finish()
            return
        }

        binding.btnSave.setOnClickListener {
            saveChanges(id)
        }

        // Try cache first for name
        CharacterRepository.CharacterCache.getById(this, id)?.let { cached ->
            binding.nameInput.setText(cached.name)
            // Show placeholder while loading from cloud to avoid empty screen
            if (binding.inputBackground.text.isNullOrBlank()) {
                 binding.inputBackground.setText(cached.description)
            }
        }

        authListener = FirebaseAuth.AuthStateListener { auth ->
            val user = auth.currentUser ?: return@AuthStateListener
            setLoading(true)
            repo.getCharacterDoc(
                uid = user.uid,
                id = id,
                onOk = { doc ->
                    setLoading(false)
                    if (doc == null) {
                        Snackbar.make(binding.root, "Персонаж не найден", Snackbar.LENGTH_LONG).show()
                        return@getCharacterDoc
                    }
                    populateUI(doc)
                },
                onError = { e ->
                    setLoading(false)
                    Snackbar.make(
                        binding.root,
                        "Ошибка загрузки: ${e.message ?: "нет деталей"}",
                        Snackbar.LENGTH_LONG
                    ).show()
                }
            )
        }
    }

    private fun populateUI(doc: DocumentSnapshot) {
        val name = doc.getString("name") ?: ""
        binding.nameInput.setText(name)

        val descRaw = doc.get("description")
        
        // Clear all first
        binding.inputBackground.setText("")
        binding.inputBeliefs.setText("")
        binding.inputMisc.setText("")
        binding.inputGender.setText("")
        binding.inputRace.setText("")
        binding.inputAppearanceNotes.setText("")

        if (descRaw is Map<*, *>) {
            @Suppress("UNCHECKED_CAST")
            val map = descRaw as Map<String, Any>
            originalDescriptionMap = map

            binding.inputBackground.setText(map["background"] as? String ?: "")
            binding.inputBeliefs.setText(map["beliefs"] as? String ?: "")
            binding.inputMisc.setText(map["misc"] as? String ?: "")

            val app = map["appearance"] as? Map<*, *>
            if (app != null) {
                binding.inputGender.setText(app["gender"] as? String ?: "")
                binding.inputRace.setText(app["race"] as? String ?: "")
                binding.inputAppearanceNotes.setText(app["notes"] as? String ?: "")
            }
        } else if (descRaw is String) {
            // Legacy string - put it in background
            binding.inputBackground.setText(descRaw)
        }
    }

    private fun saveChanges(id: String) {
        val user = AuthManager.firebaseAuth().currentUser ?: return
        
        setLoading(true)
        
        val newMap = mutableMapOf<String, Any>()
        
        // Preserve relations if they existed
        originalDescriptionMap?.get("relations")?.let {
            newMap["relations"] = it
        }

        newMap["background"] = binding.inputBackground.text.toString()
        newMap["beliefs"] = binding.inputBeliefs.text.toString()
        newMap["misc"] = binding.inputMisc.text.toString()

        val appearance = mutableMapOf<String, Any>()
        appearance["gender"] = binding.inputGender.text.toString()
        appearance["race"] = binding.inputRace.text.toString()
        appearance["notes"] = binding.inputAppearanceNotes.text.toString()
        
        // Preserve other appearance fields we don't edit yet (height, eyes, hair, skin)
        if (originalDescriptionMap != null) {
            val oldApp = originalDescriptionMap!!["appearance"] as? Map<*, *>
            if (oldApp != null) {
                listOf("height", "eyes", "hair", "skin").forEach { key ->
                    oldApp[key]?.let { appearance[key] = it }
                }
            }
        }
        newMap["appearance"] = appearance

        val newName = binding.nameInput.text.toString().trim().ifBlank { "(без имени)" }

        repo.updateDescription(
            uid = user.uid,
            id = id,
            name = newName,
            description = newMap,
            onOk = {
                // Update local cache for list view
                val summary = repo.formatStructuredDescription(newMap)
                
                val cached = Character(
                    id = id,
                    name = newName, 
                    description = summary,
                    lastModified = TimeUtil.nowIsoUtc()
                )
                
                val list = CharacterRepository.CharacterCache.loadList(this).toMutableList()
                list.removeAll { it.id == id }
                list.add(0, cached)
                CharacterRepository.CharacterCache.saveList(this, list)

                setLoading(false)
                NotificationHelper.notify(this, "Сохранено", "Данные персонажа обновлены", 2002)
                finish()
            },
            onError = { e ->
                setLoading(false)
                Snackbar.make(binding.root, "Ошибка сохранения: ${e.message}", Snackbar.LENGTH_LONG).show()
            }
        )
    }

    override fun onStart() {
        super.onStart()
        authListener?.let { AuthManager.firebaseAuth().addAuthStateListener(it) }
    }

    override fun onStop() {
        super.onStop()
        authListener?.let { AuthManager.firebaseAuth().removeAuthStateListener(it) }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progress.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.btnSave.isEnabled = !isLoading
    }

    companion object {
        const val EXTRA_CHARACTER_ID = "character_id"
    }
}
