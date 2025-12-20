import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { StatsProvider } from './app/context/StatsContext';
import { getFeatureFlags } from './app/utils/featureFlags';

export default function App() {

  // ✅ SAFE: read-only, no UI impact
  useEffect(() => {
    (async () => {
      try {
        const flags = await getFeatureFlags();
        console.log('[FeatureFlags]', flags);
      } catch (e) {
        // silently ignore – no behavior change
      }
    })();
  }, []);

  return (
    <StatsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StatsProvider>
  );
}
