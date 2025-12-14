import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

/* ======================
   TYPES
====================== */
type Joke = {
  id: string;
  setup: string;
  punchline: string;
  category: string;
  gradient: string[];
};

type Category = 'ALL' | 'PROGRAMMING' | 'DAD' | 'CLEAN';

/* ======================
   CONSTANTS
====================== */
const CACHE_KEY = 'CACHED_JOKES_V1';

const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

/* ======================
   HELPERS
====================== */
const randomGradient = () =>
  GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

const shuffle = <T,>(array: T[]): T[] =>
  [...array].sort(() => Math.random() - 0.5);

/* ======================
   NORMALIZERS
====================== */
const normalizeOfficial = (j: any): Joke => ({
  id: `off-${j.id}`,
  setup: j.setup,
  punchline: j.punchline,
  category: j.type?.toUpperCase() || 'GENERAL',
  gradient: randomGradient(),
});

const normalizeJokeAPI = (j: any): Joke => ({
  id: `api-${Math.random()}`,
  setup: j.setup,
  punchline: j.delivery,
  category: j.category?.toUpperCase() || 'GENERAL',
  gradient: randomGradient(),
});

/* ======================
   FETCH LOGIC (SAFE)
====================== */
const fetchMixedJokes = async (): Promise<Joke[]> => {
  try {
    const [officialRes, apiRes] = await Promise.all([
      fetch('https://official-joke-api.appspot.com/jokes/ten'),
      fetch(
        'https://v2.jokeapi.dev/joke/Programming,Dad,Clean?type=twopart&amount=10'
      ),
    ]);

    const officialData = await officialRes.json();
    const apiData = await apiRes.json();

    const officialJokes = Array.isArray(officialData)
      ? officialData.map(normalizeOfficial)
      : [];

    const apiRaw = Array.isArray(apiData.jokes)
      ? apiData.jokes
      : apiData.setup
      ? [apiData]
      : [];

    const apiJokes = apiRaw.map(normalizeJokeAPI);

    return shuffle([...officialJokes, ...apiJokes]);
  } catch {
    return [];
  }
};

/* ======================
   MAIN SCREEN
====================== */
export default function JokesScreen() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [index, setIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('ALL');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* ======================
     LOAD JOKES
  ====================== */
  const loadJokes = async () => {
    setLoading(true);
    fadeAnim.setValue(0);

    const fresh = await fetchMixedJokes();

    if (fresh.length > 0) {
      setJokes(fresh);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    } else {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setJokes(JSON.parse(cached));
      else Alert.alert('No jokes available 😢');
    }

    setIndex(0);
    setShowPunchline(false);
    setLoading(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    loadJokes();
  }, []);

  /* ======================
     FILTERING
  ====================== */
  const filteredJokes =
    category === 'ALL'
      ? jokes
      : jokes.filter((j) => j.category.includes(category));

  const currentJoke = filteredJokes[index];

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading jokes…</Text>
      </View>
    );
  }

  if (!currentJoke) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>😢 No jokes found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadJokes}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>😂 Jokes</Text>
        <Text style={styles.headerSubtitle}>Fresh laughs, every tap</Text>
      </LinearGradient>

      {/* CATEGORY SELECTOR */}
      <View style={styles.categories}>
        {(['ALL', 'PROGRAMMING', 'DAD', 'CLEAN'] as Category[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.categoryButton,
              category === c && styles.categoryActive,
            ]}
            onPress={() => {
              setCategory(c);
              setIndex(0);
              setShowPunchline(false);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                category === c && styles.categoryTextActive,
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* JOKE CARD */}
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <LinearGradient
          colors={currentJoke.gradient}
          style={styles.card}
        >
          <Text style={styles.setup}>{currentJoke.setup}</Text>

          {!showPunchline ? (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setShowPunchline(true)}
            >
              <Text style={styles.revealText}>Tap to reveal 👇</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.punchline}>{currentJoke.punchline}</Text>
          )}
        </LinearGradient>
      </Animated.View>

      {/* NAVIGATION */}
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => {
            setShowPunchline(false);
            setIndex((i) => (i - 1 + filteredJokes.length) % filteredJokes.length);
          }}
        >
          <Text style={styles.navText}>← Prev</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {index + 1} / {filteredJokes.length}
        </Text>

        <TouchableOpacity
          onPress={() => {
            setShowPunchline(false);
            setIndex((i) => (i + 1) % filteredJokes.length);
          }}
        >
          <Text style={styles.navText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ======================
   STYLES
====================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },

  emptyText: { fontSize: 18, marginBottom: 12 },

  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  header: { padding: 30, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#e0e7ff', marginTop: 4 },

  categories: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  categoryActive: { backgroundColor: '#6366f1' },
  categoryText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },

  card: {
    margin: 20,
    borderRadius: 24,
    padding: 30,
    justifyContent: 'center',
    flex: 1,
  },
  setup: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  revealButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  revealText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  punchline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  navText: { fontSize: 16, color: '#6366f1', fontWeight: '600' },
  counter: { fontSize: 16, color: '#64748b' },
});
