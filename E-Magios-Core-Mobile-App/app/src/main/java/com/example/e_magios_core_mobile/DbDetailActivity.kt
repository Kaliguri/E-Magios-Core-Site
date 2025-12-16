package com.example.e_magios_core_mobile

import android.os.Bundle
import com.example.e_magios_core_mobile.databinding.ActivityDbDetailBinding

class DbDetailActivity : BaseActivity() {
    private lateinit var binding: ActivityDbDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDbDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = getString(R.string.title_db)
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.titleText.text = intent.getStringExtra(EXTRA_TITLE) ?: ""
        binding.bodyText.text = intent.getStringExtra(EXTRA_BODY) ?: ""
    }

    companion object {
        const val EXTRA_TITLE = "title"
        const val EXTRA_BODY = "body"
    }
}
