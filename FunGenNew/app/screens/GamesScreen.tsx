import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TapEmojiGame from '../games/TapEmojiGame';

export default function GamesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 Fun Games</Text>
      <TapEmojiGame />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginVertical: 10,
  },
});
