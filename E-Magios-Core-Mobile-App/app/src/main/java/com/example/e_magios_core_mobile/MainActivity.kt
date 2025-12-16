package com.example.e_magios_core_mobile

import android.os.Bundle
import android.os.Build
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.activity.enableEdgeToEdge
import com.example.e_magios_core_mobile.databinding.ActivityMainBinding

class MainActivity : BaseActivity() {
    private lateinit var binding: ActivityMainBinding

    private val requestNotifications = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* no-op */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = "E'Magios Core"
        setSupportActionBar(binding.toolbarInclude.toolbar)

        ViewCompat.setOnApplyWindowInsetsListener(binding.main) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Ask for notification permission on Android 13+.
        if (Build.VERSION.SDK_INT >= 33) {
            requestNotifications.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        binding.btnDb.setOnClickListener { startActivity(Intent(this, DbActivity::class.java)) }
        binding.btnNews.setOnClickListener { startActivity(Intent(this, NewsActivity::class.java)) }
        binding.btnProfile.setOnClickListener { startActivity(Intent(this, ProfileActivity::class.java)) }
        binding.btnCharacters.setOnClickListener {
            if (AuthManager.firebaseAuth().currentUser == null) {
                startActivity(Intent(this, LoginActivity::class.java))
            } else {
                startActivity(Intent(this, CharacterListActivity::class.java))
            }
        }
    }
}