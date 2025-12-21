package com.fungen.app

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initRemoteConfig()
    }

    override fun getMainComponentName(): String = "FunGenNew"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    private fun initRemoteConfig() {
        val remoteConfig = FirebaseRemoteConfig.getInstance()

        val settings = FirebaseRemoteConfigSettings.Builder()
            .setMinimumFetchIntervalInSeconds(
                if (BuildConfig.DEBUG) 0 else 3600
            )
            .build()

        remoteConfig.setConfigSettingsAsync(settings)

        val defaults = mapOf(
            "paywall_enabled" to false,
            "premium_features_enabled" to true,
            "max_free_uses" to 5,
            "show_upgrade_banner" to false
        )

        remoteConfig.setDefaultsAsync(defaults)

        remoteConfig.fetchAndActivate()
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    applyFeatureFlags(remoteConfig)
                } else {
                    Log.e("RC", "Remote Config fetch failed")
                }
            }
    }

    private fun applyFeatureFlags(rc: FirebaseRemoteConfig) {
        FeatureFlags.PAYWALL_ENABLED = rc.getBoolean("paywall_enabled")
        FeatureFlags.PREMIUM_ENABLED = rc.getBoolean("premium_features_enabled")
        FeatureFlags.MAX_FREE_USES = rc.getLong("max_free_uses").toInt()
        FeatureFlags.SHOW_UPGRADE_BANNER = rc.getBoolean("show_upgrade_banner")

        Log.d(
            "RC",
            "Paywall=${FeatureFlags.PAYWALL_ENABLED}, " +
            "MaxFree=${FeatureFlags.MAX_FREE_USES}"
        )
    }
}
