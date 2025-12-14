import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

/* ======================
   TYPES
   ====================== */
type Quote = {
  id: string;
  text: string;
  author: string;
};

/* ======================
   CONFIG
   ====================== */
const QUOTES_API = 'https://zenquotes.io/api/quotes';
const CACHE_KEY = 'QUOTES_CACHE';
const CACHE_TIME_KEY = 'QUOTES_CACHE_TIME';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  /* ======================
     FETCH + CACHE
     ====================== */
  const loadQuotes = async () => {
    try {
      const now = Date.now();
      const lastFetch = await AsyncStorage.getItem(CACHE_TIME_KEY);
      const cachedQuotes = await AsyncStorage.getItem(CACHE_KEY);

      if (
        cachedQuotes &&
        lastFetch &&
        now - Number(lastFetch) < CACHE_TTL
      ) {
        setQuotes(JSON.parse(cachedQuotes));
        setLoading(false);
        return;
      }

      const res = await fetch(QUOTES_API);
      const data = await res.json();

      const formatted: Quote[] = data.map((q: any, i: number) => ({
        id: `${i}`,
        text: q.q,
        author: q.a || 'Unknown',
      }));

      setQuotes(formatted);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
      await AsyncStorage.setItem(CACHE_TIME_KEY, now.toString());
    } catch (err) {
      console.warn('Quotes fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  /* ======================
     LOADING
     ====================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading inspiration…</Text>
      </View>
    );
  }

  /* ======================
     EMPTY FALLBACK
     ====================== */
  if (!quotes.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🧘</Text>
        <Text style={styles.emptyText}>No quotes available</Text>
      </View>
    );
  }

  /* ======================
     RENDER
     ====================== */
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * height,
            index * height,
            (index + 1) * height,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <View style={styles.page}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <Text style={styles.quoteText}>“{item.text}”</Text>
                <Text style={styles.authorText}>— {item.author}</Text>
              </Animated.View>
            </View>
          );
        }}
      />
    </>
  );
}

/* ======================
   STYLES
   ====================== */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  page: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: '90%',
  },
  quoteText: {
    fontSize: 28,
    lineHeight: 38,
    color: '#F9FAFB',
    textAlign: 'center',
    fontWeight: '600',
  },
  authorText: {
    marginTop: 24,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
