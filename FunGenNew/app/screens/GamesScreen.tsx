import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GamesScreen() {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'ready' | 'result'>(
    'idle'
  );
  const [message, setMessage] = useState('Tap to Start');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    const value = await AsyncStorage.getItem('BEST_REACTION_TIME');
    if (value) setBestTime(Number(value));
  };

  const saveBestScore = async (time: number) => {
    await AsyncStorage.setItem('BEST_REACTION_TIME', time.toString());
    setBestTime(time);
  };

  const startGame = () => {
    setStatus('waiting');
    setMessage('Wait for GREEN...');
    setReactionTime(null);

    const delay = Math.random() * 3000 + 2000; // 2–5 seconds

    timeoutRef.current = setTimeout(() => {
      setStatus('ready');
      setMessage('TAP NOW!');
      setStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    if (status === 'waiting') {
      clearTimeout(timeoutRef.current);
      Alert.alert('Too Soon!', 'Wait for GREEN 😄');
      resetGame();
      return;
    }

    if (status === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setStatus('result');
      setMessage(`⏱ ${time} ms`);

      if (!bestTime || time < bestTime) {
        saveBestScore(time);
      }
    }
  };

  const resetGame = () => {
    setStatus('idle');
    setMessage('Tap to Start');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        status === 'ready' && styles.ready,
        status === 'waiting' && styles.waiting,
      ]}
      activeOpacity={1}
      onPress={status === 'idle' ? startGame : handleTap}
    >
      <Text style={styles.text}>{message}</Text>

      {bestTime && (
        <Text style={styles.best}>🏆 Best: {bestTime} ms</Text>
      )}

      {status === 'result' && (
        <Text style={styles.tapAgain}>Tap to Play Again</Text>
      )}
    </TouchableOpacity>
  );
}
