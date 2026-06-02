package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import android.view.Menu
import android.view.MenuItem
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

abstract class BaseActivity : AppCompatActivity() {

    protected open fun requireAuthForCharacters(): Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Targeting modern SDKs means edge-to-edge by default; we handle insets ourselves.
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }

    override fun onPostCreate(savedInstanceState: Bundle?) {
        super.onPostCreate(savedInstanceState)
        applySystemBarsInsetsToRoot()
    }

    private fun applySystemBarsInsetsToRoot() {
        val content = findViewById<View>(android.R.id.content) ?: return
        ViewCompat.setOnApplyWindowInsetsListener(content) { v, insets ->
            val sys = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(sys.left, sys.top, sys.right, sys.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(content)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            android.R.id.home -> {
                finish()
                return true
            }
            R.id.menu_news -> {
                startActivity(Intent(this, NewsActivity::class.java))
                return true
            }
            R.id.menu_profile -> {
                startActivity(Intent(this, ProfileActivity::class.java))
                return true
            }
            R.id.menu_characters -> {
                if (requireAuthForCharacters() && AuthManager.firebaseAuth().currentUser == null) {
                    startActivity(Intent(this, LoginActivity::class.java))
                } else {
                    startActivity(Intent(this, CharacterListActivity::class.java))
                }
                return true
            }
            R.id.menu_db -> {
                startActivity(Intent(this, DbActivity::class.java))
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }
}
