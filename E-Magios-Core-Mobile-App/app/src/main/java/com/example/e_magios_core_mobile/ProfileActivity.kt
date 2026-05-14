package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import com.example.e_magios_core_mobile.databinding.ActivityProfileBinding

class ProfileActivity : BaseActivity() {
    private lateinit var binding: ActivityProfileBinding

    private val requestNotifications = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* no-op */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = "Профиль"
        setSupportActionBar(binding.toolbarInclude.toolbar)
        // Launcher/top-level: no back arrow.

        // Ask for notification permission on Android 13+.
        if (Build.VERSION.SDK_INT >= 33) {
            requestNotifications.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        render()

        binding.btnSignIn.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }

        binding.btnSignOut.setOnClickListener {
            AuthManager.signOut(this, getString(R.string.default_web_client_id)) {
                NotificationHelper.notify(this, "Выход", "Вы вышли из аккаунта", 1002)
                render()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        render()
    }

    private fun render() {
        val user = AuthManager.firebaseAuth().currentUser
        if (user == null) {
            binding.userText.text = getString(R.string.msg_not_signed_in)
            binding.btnSignIn.isEnabled = true
            binding.btnSignOut.isEnabled = false
        } else {
            binding.userText.text = user.email ?: (user.displayName ?: user.uid)
            binding.btnSignIn.isEnabled = false
            binding.btnSignOut.isEnabled = true
        }
    }
}
