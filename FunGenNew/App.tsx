import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { StatsProvider } from './app/context/StatsContext';

export default function App() {
  return (
    <StatsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StatsProvider>
  );
}
