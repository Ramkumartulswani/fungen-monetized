package com.fungen.app
import com.fungen.app.BuildConfig

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class FeatureFlagModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FeatureFlags"

    @ReactMethod
    fun getFlags(promise: com.facebook.react.bridge.Promise) {
        val map = WritableNativeMap()
        map.putBoolean("showMarketProBanner",FeatureFlags.SHOW_UPGRADE_BANNER)
        map.putBoolean("paywallEnabled", FeatureFlags.PAYWALL_ENABLED)
        map.putBoolean("premiumEnabled", FeatureFlags.PREMIUM_ENABLED)
        map.putInt("maxFreeUses", FeatureFlags.MAX_FREE_USES)
        map.putBoolean("showUpgradeBanner", FeatureFlags.SHOW_UPGRADE_BANNER)
        promise.resolve(map)
    }
}
