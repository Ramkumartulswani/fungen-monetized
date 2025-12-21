import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { StatsProvider } from './app/context/StatsContext';
import { getFeatureFlags } from './app/utils/featureFlags';
import mobileAds from 'react-native-google-mobile-ads';


export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Ensure at least one render frame before navigation
    setBooted(true);

    (async () => {
      try {
        const flags = await getFeatureFlags();
        console.log('[FeatureFlags]', flags);
      } catch (e) {}
    })();
  }, []);

  // 🔴 CRITICAL for Firebase Test Lab
  if (!booted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Booting…</Text>
      </View>
    );
  }

  return (
    <StatsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StatsProvider>
  );
}
