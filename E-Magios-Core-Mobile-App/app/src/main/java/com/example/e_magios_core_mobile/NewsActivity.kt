package com.example.e_magios_core_mobile

import android.os.Bundle
import android.view.View
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.e_magios_core_mobile.databinding.ActivityNewsBinding
import kotlinx.coroutines.launch
import org.json.JSONArray

class NewsActivity : BaseActivity() {
    private lateinit var binding: ActivityNewsBinding
    private val repo = DbRepository()

    private val adapter = SimpleItemAdapter { item ->
        try {
            NewsDetailActivity.open(this, item.title, item.body)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNewsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = "Новости"
        setSupportActionBar(binding.toolbarInclude.toolbar)
        // Top-level destination: no back arrow (exit app via system back).

        binding.recycler.layoutManager = LinearLayoutManager(this)
        binding.recycler.adapter = adapter

        load()
    }

    private fun load() {
        setLoading(true)
        lifecycleScope.launch {
            try {
                val remote = repo.loadNews()
                if (remote.isNotEmpty()) {
                    adapter.submit(remote)
                } else {
                    adapter.submit(loadNewsFromAssets())
                }
            } catch (_: Exception) {
                adapter.submit(loadNewsFromAssets())
            } finally {
                setLoading(false)
            }
        }
    }

    private fun loadNewsFromAssets(): List<SimpleItem> {
        return try {
            val text = assets.open("news.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
            val arr = JSONArray(text)
            (0 until arr.length()).map { idx ->
                val obj = arr.getJSONObject(idx)
                val id = obj.optString("id", idx.toString())
                val title = obj.optString("title", "(без названия)")
                val date = obj.optString("date", "")
                val brief = obj.optString("brief", "")
                val featuresArr = obj.optJSONArray("features") ?: JSONArray()
                val features = (0 until featuresArr.length()).mapNotNull { featuresArr.optString(it) }

                val body = buildString {
                    if (date.isNotBlank()) append("<font color='#999999'>$date</font><br><br>")
                    if (brief.isNotBlank()) {
                        append("<p>$brief</p>")
                    }
                    if (features.isNotEmpty()) {
                        append("<h4><font color='#10b981'>Что нового:</font></h4>")
                        append("<ul>")
                        features.forEach { f -> append("<li>$f</li>") }
                        append("</ul>")
                    }
                }

                SimpleItem(
                    id = id,
                    title = title,
                    subtitle = date,
                    body = body
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progress.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}
