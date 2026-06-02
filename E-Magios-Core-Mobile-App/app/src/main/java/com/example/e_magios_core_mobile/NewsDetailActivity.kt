package com.example.e_magios_core_mobile

import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.example.e_magios_core_mobile.databinding.ActivityNewsDetailBinding

class NewsDetailActivity : BaseActivity() {
    private lateinit var binding: ActivityNewsDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNewsDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = "Новости"
        setSupportActionBar(binding.toolbarInclude.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        val body = intent.getStringExtra(EXTRA_BODY).orEmpty()

        binding.titleText.text = title
        binding.bodyText.text = android.text.Html.fromHtml(body, android.text.Html.FROM_HTML_MODE_COMPACT)
    }

    companion object {
        private const val EXTRA_TITLE = "title"
        private const val EXTRA_BODY = "body"

        fun open(context: Context, title: String, body: String) {
            val intent = Intent(context, NewsDetailActivity::class.java)
                .putExtra(EXTRA_TITLE, title)
                .putExtra(EXTRA_BODY, body)
            context.startActivity(intent)
        }
    }
}
