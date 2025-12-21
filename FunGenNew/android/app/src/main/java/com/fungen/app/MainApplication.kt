package com.fungen.app

import com.fungen.app.BuildConfig

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import com.google.firebase.FirebaseApp
import com.google.android.gms.common.GoogleApiAvailability

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {

        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // ✅ SAFE ADDITION — does nothing unless used
                add(FeatureFlagPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // ✅ REQUIRED: Initialize Firebase BEFORE anything uses it
    val apiAvailability = GoogleApiAvailability.getInstance()
    val result = apiAvailability.isGooglePlayServicesAvailable(this)

    if (result == com.google.android.gms.common.ConnectionResult.SUCCESS) {
        FirebaseApp.initializeApp(this)
    } else {
        // ❗ DO NOT CRASH
        // Log only, app must continue
        android.util.Log.w(
            "Firebase",
            "Google Play Services not available: $result"
        )
    }
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
  }
}
