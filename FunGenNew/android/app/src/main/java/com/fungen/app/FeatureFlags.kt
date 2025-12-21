package com.fungen.app

import android.util.Log
import com.google.firebase.remoteconfig.FirebaseRemoteConfig

object FeatureFlags {

    // ---- Local defaults (safe fallbacks) ----
    private const val DEFAULT_PAYWALL_ENABLED = false
    private const val DEFAULT_PREMIUM_ENABLED = true
    private const val DEFAULT_MAX_FREE_USES = 5
    private const val DEFAULT_SHOW_UPGRADE_BANNER = false

    /**
     * Market Pro / Paywall flag
     * Safe even if Firebase or Play Services is unavailable
     */
    fun isPaywallEnabled(): Boolean {
        return try {
            FirebaseRemoteConfig
                .getInstance()
                .getBoolean("market_pro_enabled")
        } catch (e: Exception) {
            Log.w("FeatureFlags", "Remote Config unavailable, defaulting paywall=false", e)
            DEFAULT_PAYWALL_ENABLED
        }
    }

    /**
     * Premium feature toggle
     */
    fun isPremiumEnabled(): Boolean {
        return try {
            FirebaseRemoteConfig
                .getInstance()
                .getBoolean("premium_enabled")
        } catch (e: Exception) {
            DEFAULT_PREMIUM_ENABLED
        }
    }

    /**
     * Max free uses before paywall
     */
    fun maxFreeUses(): Int {
        return try {
            FirebaseRemoteConfig
                .getInstance()
                .getLong("max_free_uses")
                .toInt()
        } catch (e: Exception) {
            DEFAULT_MAX_FREE_USES
        }
    }

    /**
     * Upgrade banner visibility
     */
    fun shouldShowUpgradeBanner(): Boolean {
        return try {
            FirebaseRemoteConfig
                .getInstance()
                .getBoolean("show_upgrade_banner")
        } catch (e: Exception) {
            DEFAULT_SHOW_UPGRADE_BANNER
        }
    }
}
