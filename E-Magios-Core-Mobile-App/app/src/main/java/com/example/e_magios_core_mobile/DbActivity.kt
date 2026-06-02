package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.e_magios_core_mobile.databinding.ActivityDbBinding
import kotlinx.coroutines.launch

class DbActivity : BaseActivity() {
    private lateinit var binding: ActivityDbBinding
    private val repo = DbRepository()

    private var kind: DbKind = DbKind.SPELLS

    private val adapter = SimpleItemAdapter { item ->
        try {
            val intent = Intent(this, DbDetailActivity::class.java)
            intent.putExtra(DbDetailActivity.EXTRA_TITLE, item.title)
            // Truncate body if excessively large to prevent crash, though normally shouldn't happen
            if (item.body.length > 200_000) {
                intent.putExtra(DbDetailActivity.EXTRA_BODY, item.body.take(200_000) + "... (обрезано)")
            } else {
                intent.putExtra(DbDetailActivity.EXTRA_BODY, item.body)
            }
            startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
            com.google.android.material.snackbar.Snackbar.make(binding.root, "Не удалось открыть: ${e.message}", com.google.android.material.snackbar.Snackbar.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDbBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = getString(R.string.title_db)
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.recycler.layoutManager = LinearLayoutManager(this)
        binding.recycler.adapter = adapter

        binding.btnSpells.setOnClickListener { select(DbKind.SPELLS) }
        binding.btnSchools.setOnClickListener { select(DbKind.SCHOOLS) }

        select(DbKind.SPELLS)
    }

    private fun select(next: DbKind) {
        kind = next
        // naive toggle styles for MVP
        binding.btnSpells.isEnabled = next != DbKind.SPELLS
        binding.btnSchools.isEnabled = next != DbKind.SCHOOLS
        load()
    }

    private fun load() {
        setLoading(true)
        lifecycleScope.launch {
            try {
                val list = repo.load(kind)
                adapter.submit(list)
            } catch (_: Exception) {
                adapter.submit(emptyList())
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progress.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}
