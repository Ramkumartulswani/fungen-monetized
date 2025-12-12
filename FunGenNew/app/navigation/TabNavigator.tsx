import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import JokesScreen from '../screens/JokesScreen';
import QuotesScreen from '../screens/QuotesScreen';
import FactsScreen from '../screens/FactsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jokes" component={JokesScreen} />
      <Tab.Screen name="Quotes" component={QuotesScreen} />
      <Tab.Screen name="Facts" component={FactsScreen} />
    </Tab.Navigator>
  );
}
