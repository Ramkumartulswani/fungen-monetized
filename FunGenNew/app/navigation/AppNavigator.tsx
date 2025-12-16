import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import MarketPaywall from '../screens/MarketPaywall';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom Tabs (UNCHANGED) */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Market Paywall (NEW, SAFE) */}
      <Stack.Screen
        name="MarketPaywall"
        component={MarketPaywall}
      />
    </Stack.Navigator>
  );
}
