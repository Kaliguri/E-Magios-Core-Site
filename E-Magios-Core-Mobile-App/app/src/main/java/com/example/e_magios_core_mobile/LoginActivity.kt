package com.example.e_magios_core_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import com.example.e_magios_core_mobile.databinding.ActivityLoginBinding
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.GoogleAuthProvider

class LoginActivity : BaseActivity() {
    private lateinit var binding: ActivityLoginBinding

    private val signInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode != RESULT_OK) {
            setError("Вход отменён")
            setLoading(false)
            return@registerForActivityResult
        }

        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account.idToken
            if (idToken.isNullOrBlank()) {
                setError("Не удалось получить токен Google")
                setLoading(false)
                return@registerForActivityResult
            }

            val credential = GoogleAuthProvider.getCredential(idToken, null)
            AuthManager.firebaseAuth().signInWithCredential(credential)
                .addOnCompleteListener { authTask ->
                    if (authTask.isSuccessful) {
                        NotificationHelper.notify(
                            this,
                            "Вход выполнен",
                            account.email ?: "Успешная авторизация",
                            1001
                        )
                        startActivity(Intent(this, ProfileActivity::class.java))
                        finish()
                    } else {
                        setError(authTask.exception?.message ?: "Ошибка авторизации")
                        setLoading(false)
                    }
                }
        } catch (e: ApiException) {
            setError("Ошибка входа Google: ${e.statusCode}")
            setLoading(false)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarInclude.toolbar.title = "Вход"
        setSupportActionBar(binding.toolbarInclude.toolbar)

        // If already signed in, go Profile.
        if (AuthManager.firebaseAuth().currentUser != null) {
            startActivity(Intent(this, ProfileActivity::class.java))
            finish()
            return
        }

        binding.btnGoogle.setOnClickListener {
            setError(null)
            setLoading(true)
            val intent = AuthManager.signInIntent(this, getString(R.string.default_web_client_id))
            signInLauncher.launch(intent)
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progress.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.btnGoogle.isEnabled = !isLoading
    }

    private fun setError(message: String?) {
        if (message.isNullOrBlank()) {
            binding.errorText.visibility = View.GONE
            binding.errorText.text = ""
        } else {
            binding.errorText.visibility = View.VISIBLE
            binding.errorText.text = message
        }
    }
}
