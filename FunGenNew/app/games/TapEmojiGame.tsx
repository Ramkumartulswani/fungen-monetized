import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const EMOJIS = ['😂', '🔥', '🎉', '😜', '🚀', '🍕', '🐶', '⚽'];

export default function TapEmojiGame() {
  const [emoji, setEmoji] = useState('😂');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      setGameOver(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const onTap = () => {
    if (gameOver) return;
    setScore(s => s + 1);
    const random = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    setEmoji(random);
  };

  const restart = () => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setEmoji('😂');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>⏱ {timeLeft}s</Text>
      <Text style={styles.score}>Score: {score}</Text>

      {!gameOver ? (
        <TouchableOpacity onPress={onTap} style={styles.emojiBox}>
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.gameOver}>Game Over 🎮</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <TouchableOpacity onPress={restart} style={styles.restart}>
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 18, marginBottom: 10 },
  score: { fontSize: 20, marginBottom: 20 },
  emojiBox: {
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  emoji: { fontSize: 80 },
  gameOver: { fontSize: 26, marginTop: 20 },
  finalScore: { fontSize: 22, marginVertical: 10 },
  restart: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  restartText: { color: '#fff', fontSize: 18 },
});

