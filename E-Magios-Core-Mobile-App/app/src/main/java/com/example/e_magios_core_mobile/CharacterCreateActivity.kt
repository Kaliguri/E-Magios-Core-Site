package com.example.e_magios_core_mobile

import android.os.Bundle
import android.view.View
import android.content.Intent
import com.example.e_magios_core_mobile.databinding.ActivityCharacterCreateBinding
import com.google.android.material.snackbar.Snackbar

class CharacterCreateActivity : BaseActivity() {
    private lateinit var binding: ActivityCharacterCreateBinding
    private val repo = CharacterRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCharacterCreateBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = getString(R.string.title_character_create)
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val user = AuthManager.firebaseAuth().currentUser
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding.btnSave.setOnClickListener {
            val name = binding.nameInput.text?.toString()?.trim().orEmpty()
            val desc = binding.descInput.text?.toString()?.trim().orEmpty()

            if (name.isBlank()) {
                binding.nameLayout.error = "Введите имя"
                return@setOnClickListener
            }
            binding.nameLayout.error = null

            setLoading(true)
            repo.createCharacter(
                uid = user.uid,
                name = name,
                description = desc,
                onOk = {
                    NotificationHelper.notify(this, "Персонаж сохранён", name, 2001)
                    finish()
                },
                onError = { e ->
                    setLoading(false)
                    Snackbar.make(
                        binding.root,
                        "Не удалось сохранить: ${e.message ?: "нет деталей"}",
                        Snackbar.LENGTH_LONG
                    ).show()
                }
            )
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progress.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.btnSave.isEnabled = !isLoading
    }
}
