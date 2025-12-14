import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

type Category = 'ALL' | 'PROGRAMMING' | 'DAD' | 'CLEAN';

type Joke = {
  id: number;
  setup: string;
  punchline: string;
  category: Category;
};

export default function JokesScreen() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [category, setCategory] = useState<Category>('ALL');
  const [index, setIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ======================
     FETCH JOKES BY CATEGORY
     ====================== */
  const fetchJokesByCategory = async (cat: Category) => {
    try {
      let fetched: Joke[] = [];

      if (cat === 'PROGRAMMING') {
        const res = await fetch(
          'https://v2.jokeapi.dev/joke/Programming?type=twopart&amount=6&safe-mode'
        );
        const data = await res.json();
        fetched = data.jokes.map((j: any) => ({
          id: j.id,
          setup: j.setup,
          punchline: j.delivery,
          category: 'PROGRAMMING',
        }));
      } else {
        const res = await fetch(
          'https://official-joke-api.appspot.com/jokes/general/ten'
        );
        const data = await res.json();
        fetched = data.map((j: any) => ({
          id: j.id,
          setup: j.setup,
          punchline: j.punchline,
          category: 'DAD',
        }));
      }

      return fetched;
    } catch {
      return [];
    }
  };

  /* ======================
     INITIAL LOAD
     ====================== */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const base = await fetchJokesByCategory('ALL');
      setJokes(base);
      setLoading(false);
    };
    init();
  }, []);

  /* ======================
     AUTO REFILL ON CATEGORY CHANGE
     ====================== */
  useEffect(() => {
    const ensureJokes = async () => {
      const filtered =
        category === 'ALL'
          ? jokes
          : jokes.filter((j) => j.category === category);

      if (filtered.length === 0) {
        const more = await fetchJokesByCategory(category);
        if (more.length > 0) {
          setJokes((prev) => [...prev, ...more]);
          setIndex(0);
          setShowPunchline(false);
        }
      }
    };

    ensureJokes();
  }, [category]);

  /* ======================
     SAFE CURRENT JOKE
     ====================== */
  const filteredJokes =
    category === 'ALL'
      ? jokes
      : jokes.filter((j) => j.category === category);

  const currentJoke =
    filteredJokes[index] || filteredJokes[0] || jokes[0];

  const nextJoke = () => {
    setShowPunchline(false);
    setIndex((prev) => (prev + 1) % filteredJokes.length);
  };

  const prevJoke = () => {
    setShowPunchline(false);
    setIndex((prev) =>
      prev === 0 ? filteredJokes.length - 1 : prev - 1
    );
  };

  if (loading || !currentJoke) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading jokes…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>😂 Jokes</Text>
        <Text style={styles.headerSubtitle}>Fresh laughs, nonstop</Text>
      </LinearGradient>

      {/* CATEGORY SELECTOR */}
      <View style={styles.tabs}>
        {(['ALL', 'PROGRAMMING', 'DAD', 'CLEAN'] as Category[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.tab, category === c && styles.tabActive]}
            onPress={() => {
              setCategory(c);
              setIndex(0);
              setShowPunchline(false);
            }}
          >
            <Text
              style={[
                styles.tabText,
                category === c && styles.tabTextActive,
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* JOKE CARD */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.card}
      >
        <Text style={styles.setup}>{currentJoke.setup}</Text>

        {!showPunchline ? (
          <TouchableOpacity
            style={styles.revealButton}
            onPress={() => setShowPunchline(true)}
          >
            <Text style={styles.revealText}>Tap for punchline 👇</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.punchline}>{currentJoke.punchline}</Text>
        )}
      </LinearGradient>

      {/* NAVIGATION */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={prevJoke}>
          <Text style={styles.navText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {index + 1} / {filteredJokes.length}
        </Text>

        <TouchableOpacity onPress={nextJoke}>
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
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 18, color: '#fff', opacity: 0.9 },

  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#334155', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  card: {
    margin: 20,
    padding: 30,
    borderRadius: 26,
    minHeight: 280,
    justifyContent: 'center',
  },
  setup: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  revealButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 14,
    borderRadius: 14,
    alignSelf: 'center',
  },
  revealText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  punchline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 40,
    alignItems: 'center',
  },
  navText: { fontSize: 18, color: '#6366f1', fontWeight: '600' },
  counter: { fontSize: 16, color: '#64748b' },
});
