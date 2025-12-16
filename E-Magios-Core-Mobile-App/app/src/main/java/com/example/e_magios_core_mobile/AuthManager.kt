package com.example.e_magios_core_mobile

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth

object AuthManager {
    fun firebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    fun googleClient(context: Context, webClientId: String): GoogleSignInClient {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()

        return GoogleSignIn.getClient(context, gso)
    }

    fun signInIntent(context: Context, webClientId: String): Intent {
        return googleClient(context, webClientId).signInIntent
    }

    fun signOut(activity: Activity, webClientId: String, onDone: () -> Unit) {
        firebaseAuth().signOut()
        googleClient(activity, webClientId).signOut().addOnCompleteListener { onDone() }
    }
}
