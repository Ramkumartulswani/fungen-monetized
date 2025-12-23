import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { StatsProvider } from './app/context/StatsContext';
import { getFeatureFlags } from './app/utils/featureFlags';

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const flags = await getFeatureFlags();
        console.log('[FeatureFlags]', flags);
      } catch (e) {
        console.log('Bootstrap error', e);
      } finally {
        if (mounted) setBooted(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
