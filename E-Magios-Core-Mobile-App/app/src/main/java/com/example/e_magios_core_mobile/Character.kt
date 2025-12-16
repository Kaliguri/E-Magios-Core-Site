package com.example.e_magios_core_mobile

data class Character(
    val id: String,
    val name: String,
    val description: String,
    val level: Int? = null,
    val lastModified: String? = null
)
