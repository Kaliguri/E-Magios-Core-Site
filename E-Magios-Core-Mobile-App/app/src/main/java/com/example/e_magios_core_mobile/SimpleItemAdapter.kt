package com.example.e_magios_core_mobile

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.e_magios_core_mobile.databinding.ItemSimpleBinding

class SimpleItemAdapter(
    private val onClick: (SimpleItem) -> Unit
) : RecyclerView.Adapter<SimpleItemAdapter.VH>() {

    private val items = mutableListOf<SimpleItem>()

    fun submit(newItems: List<SimpleItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemSimpleBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding, onClick)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    class VH(
        private val binding: ItemSimpleBinding,
        private val onClick: (SimpleItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        private var item: SimpleItem? = null

        init {
            binding.root.setOnClickListener {
                item?.let(onClick)
            }
        }

        fun bind(value: SimpleItem) {
            item = value
            binding.title.text = value.title
            binding.subtitle.text = value.subtitle
        }
    }
}
