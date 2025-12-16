package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import com.example.e_magios_core_mobile.databinding.ActivityCharacterDetailBinding
import com.google.android.material.snackbar.Snackbar
import com.google.firebase.auth.FirebaseAuth

class CharacterDetailActivity : BaseActivity() {
    private lateinit var binding: ActivityCharacterDetailBinding
    private val repo = CharacterRepository()
    private var authListener: FirebaseAuth.AuthStateListener? = null
    private var characterId: String? = null

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

        // Show cached data immediately (works offline / without auth).
        CharacterRepository.CharacterCache.getById(this, id)?.let { cached ->
            binding.nameText.text = cached.name
            binding.descText.text = cached.description.ifBlank { "(описание пустое)" }
        }

        // Then try to refresh from cloud when auth is ready.
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
                    val name = doc.getString("name") ?: "(без имени)"
                    binding.nameText.text = name

                    // Only the description section is needed for mobile.
                    val desc = repo.extractDescriptionText(doc).ifBlank { "(описание пустое)" }
                    binding.descText.text = desc

                    // Update cache with the fresh version.
                    val updated = Character(
                        id = doc.id,
                        name = name,
                        description = desc,
                        level = when (val raw = doc.get("level")) {
                            is Number -> raw.toInt()
                            is String -> raw.toIntOrNull()
                            else -> null
                        },
                        lastModified = when (val raw = doc.get("lastModified")) {
                            is String -> raw
                            is com.google.firebase.Timestamp -> TimeUtil.formatIsoUtc(raw.toDate())
                            else -> null
                        }
                    )
                    val list = CharacterRepository.CharacterCache.loadList(this).toMutableList().apply {
                        removeAll { it.id == updated.id }
                        add(0, updated)
                    }
                    CharacterRepository.CharacterCache.saveList(this, list)
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
    }

    companion object {
        const val EXTRA_CHARACTER_ID = "character_id"
    }
}
