package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.example.e_magios_core_mobile.databinding.ActivityHomeBinding

class HomeActivity : AppCompatActivity() {
    private lateinit var binding: ActivityHomeBinding

    private val requestNotifications = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* no-op */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Ask for notification permission on Android 13+.
        if (Build.VERSION.SDK_INT >= 33) {
            requestNotifications.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        val user = AuthManager.firebaseAuth().currentUser
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding.userText.text = user.email ?: (user.displayName ?: "")

        binding.btnCharacters.setOnClickListener {
            startActivity(Intent(this, CharacterListActivity::class.java))
        }

        binding.btnDb.setOnClickListener {
            startActivity(Intent(this, DbActivity::class.java))
        }

        binding.btnSignOut.setOnClickListener {
            AuthManager.signOut(this, getString(R.string.default_web_client_id)) {
                NotificationHelper.notify(
                    this,
                    "Выход",
                    "Вы вышли из аккаунта",
                    1002
                )
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
        }
    }
}
