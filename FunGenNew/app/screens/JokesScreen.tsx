import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

/* ======================
   TYPES
   ====================== */
type JokeCategory = 'ALL' | 'PROGRAMMING' | 'DAD';

type Joke = {
  id: string;
  setup: string;
  punchline: string;
  category: 'PROGRAMMING' | 'DAD' | 'CLEAN';
  gradient: string[];
};

/* ======================
   CONSTANTS
   ====================== */
const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

const STORAGE_KEY = 'JOKES_CACHE_V1';

/* ======================
   HELPERS
   ====================== */
const shuffle = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

/* ======================
   NORMALIZERS
   ====================== */
const normalizeOfficial = (joke: any, i: number): Joke => ({
  id: `official-${joke.id}`,
  setup: joke.setup,
  punchline: joke.punchline,
  category: 'CLEAN',
  gradient: GRADIENTS[i % GRADIENTS.length],
});

const normalizeJokeAPI = (joke: any, i: number): Joke => ({
  id: `jokeapi-${joke.id}`,
  setup: joke.setup,
  punchline: joke.delivery,
  category: joke.category === 'Programming' ? 'PROGRAMMING' : 'DAD',
  gradient: GRADIENTS[i % GRADIENTS.length],
});

/* ======================
   FETCH MIXED JOKES
   ====================== */
const fetchMixedJokes = async (): Promise<Joke[]> => {
  const [officialRes, jokeApiRes] = await Promise.all([
    fetch('https://official-joke-api.appspot.com/jokes/ten'),
    fetch(
      'https://v2.jokeapi.dev/joke/Programming,Dad,Clean?type=twopart&amount=10'
    ),
  ]);

  const officialData = await officialRes.json();
  const jokeApiData = await jokeApiRes.json();

  const officialJokes = officialData.map(normalizeOfficial);
  const apiJokes = jokeApiData.jokes.map(normalizeJokeAPI);

  return shuffle([...officialJokes, ...apiJokes]);
};

/* ======================
   SCREEN
   ====================== */
export default function JokesScreen() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<JokeCategory>('ALL');

  /* ======================
     LOAD + CACHE
     ====================== */
  const loadJokes = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setJokes(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const fresh = await fetchMixedJokes();
      setJokes(fresh);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (e) {
      console.warn('Failed to load jokes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJokes();
  }, []);

  /* ======================
     DERIVED
     ====================== */
  const filteredJokes =
    selectedCategory === 'ALL'
      ? jokes
      : jokes.filter((j) => j.category === selectedCategory);

  const currentJoke = filteredJokes[currentIndex];

  /* ======================
     NAVIGATION
     ====================== */
  const nextJoke = () => {
    setShowPunchline(false);
    setCurrentIndex((prev) =>
      prev + 1 >= filteredJokes.length ? 0 : prev + 1
    );
  };

  const prevJoke = () => {
    setShowPunchline(false);
    setCurrentIndex((prev) =>
      prev - 1 < 0 ? filteredJokes.length - 1 : prev - 1
    );
  };

  /* ======================
     LOADING
     ====================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching jokes…</Text>
      </View>
    );
  }

  if (!currentJoke) {
    return (
      <View style={styles.center}>
        <Text>No jokes available 😢</Text>
      </View>
    );
  }

  /* ======================
     UI
     ====================== */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>😂 Jokes</Text>
        <Text style={styles.headerSubtitle}>Fresh from the internet</Text>
      </LinearGradient>

      {/* CATEGORY FILTER */}
      <View style={styles.filterRow}>
        {(['ALL', 'PROGRAMMING', 'DAD'] as JokeCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterButton,
              selectedCategory === cat && styles.filterActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              setShowPunchline(false);
            }}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === cat && styles.filterTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* JOKE CARD */}
      <LinearGradient
        colors={currentJoke.gradient}
        style={styles.jokeCard}
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

      {/* NAVIGATION */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={prevJoke}>
          <Text style={styles.navText}>← Prev</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {currentIndex + 1} / {filteredJokes.length}
        </Text>

        <TouchableOpacity style={styles.navBtn} onPress={nextJoke}>
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

  loadingText: { marginTop: 12, color: '#64748b' },

  header: { padding: 30, paddingTop: 60 },
  headerTitle: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  filterActive: { backgroundColor: '#6366f1' },
  filterText: { color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  jokeCard: {
    margin: 20,
    padding: 30,
    borderRadius: 24,
    minHeight: 280,
    justifyContent: 'center',
  },
  setup: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  revealButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  revealText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  punchline: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  navText: { color: '#6366f1', fontWeight: '600' },
  counter: { color: '#64748b', fontWeight: '600' },
});
