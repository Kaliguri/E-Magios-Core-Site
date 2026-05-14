package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.e_magios_core_mobile.databinding.ActivityCharacterListBinding
import com.google.android.material.snackbar.Snackbar
import com.google.firebase.auth.FirebaseAuth

class CharacterListActivity : BaseActivity() {
    private lateinit var binding: ActivityCharacterListBinding
    private val repo = CharacterRepository()

    private val adapter = SimpleItemAdapter { item ->
        val intent = Intent(this, CharacterDetailActivity::class.java)
        intent.putExtra(CharacterDetailActivity.EXTRA_CHARACTER_ID, item.id)
        startActivity(intent)
    }

    private var unsubscribe: (() -> Unit)? = null
    private var authListener: FirebaseAuth.AuthStateListener? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCharacterListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = getString(R.string.title_characters)
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.recycler.layoutManager = LinearLayoutManager(this)
        binding.recycler.adapter = adapter

        binding.fab.setOnClickListener {
            if (AuthManager.firebaseAuth().currentUser == null) {
                startActivity(Intent(this, LoginActivity::class.java))
            } else {
                startActivity(Intent(this, CharacterCreateActivity::class.java))
            }
        }

        // Show cached list instantly (works offline and even before auth state is restored).
        renderCharacters(CharacterRepository.CharacterCache.loadList(this), fromCache = true)

        authListener = FirebaseAuth.AuthStateListener { auth ->
            val user = auth.currentUser
            if (user == null) {
                setState(
                    "Войдите в Google, чтобы синхронизировать персонажей.\n" +
                        "Сейчас показан локальный кэш (если он есть)."
                )
                unsubscribe?.invoke()
                unsubscribe = null
            } else {
                setState("Загрузка…")
                val reg = repo.listenCharacters(
                    uid = user.uid,
                    onUpdate = { list ->
                        // Cache for offline/fast start next time.
                        CharacterRepository.CharacterCache.saveList(this, list)
                        renderCharacters(list, fromCache = false)
                    },
                    onError = { e ->
                        val cached = CharacterRepository.CharacterCache.loadList(this)
                        renderCharacters(cached, fromCache = true)
                        val msg = "Ошибка Firestore: ${e.message ?: "нет деталей"}"
                        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
                        if (cached.isEmpty()) setState(msg)
                    }
                )
                unsubscribe?.invoke()
                unsubscribe = { reg.remove() }
            }
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

    override fun onDestroy() {
        super.onDestroy()
        unsubscribe?.invoke()
        unsubscribe = null
    }

    private fun renderCharacters(list: List<Character>, fromCache: Boolean) {
        val items = list.map {
            val levelPart = it.level?.let { lvl -> "Уровень $lvl" }
            val datePart = it.lastModified?.takeIf { d -> d.isNotBlank() }?.let { d -> d.take(10) }
            val meta = listOfNotNull(levelPart, datePart).joinToString(" • ")
            val preview = it.description.trim().take(80)
            SimpleItem(
                id = it.id,
                title = it.name,
                subtitle = when {
                    meta.isNotBlank() -> meta
                    preview.isNotBlank() -> preview
                    else -> if (fromCache) "(описание не загружено)" else ""
                }
            )
        }

        adapter.submit(items)

        if (items.isEmpty()) {
            val user = AuthManager.firebaseAuth().currentUser
            if (user == null) {
                setState("Нет локальных персонажей. Войдите в Google, чтобы загрузить их из облака.")
            } else {
                val email = user.email ?: "текущего аккаунта"
                setState(
                    "Персонажей в облаке для $email пока нет.\n" +
                        "Если на сайте они есть — проверь, что на телефоне вошёл в тот же Google-аккаунт."
                )
            }
        } else {
            setState(null)
        }
    }

    private fun setState(text: String?) {
        if (text.isNullOrBlank()) {
            binding.stateText.visibility = View.GONE
            binding.stateText.text = ""
        } else {
            binding.stateText.visibility = View.VISIBLE
            binding.stateText.text = text
        }
    }
}
