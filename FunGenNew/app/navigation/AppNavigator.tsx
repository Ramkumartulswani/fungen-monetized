import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import MarketPaywall from '../screens/MarketPaywall';

const Stack = createNativeStackNavigator();

function BootScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading…</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Boot"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Boot" component={BootScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MarketPaywall" component={MarketPaywall} />
    </Stack.Navigator>
  );
}
