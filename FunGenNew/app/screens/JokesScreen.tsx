import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Share,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type Category = 'ALL' | 'PROGRAMMING' | 'DAD' | 'GENERAL' | 'PUNS';

type Joke = {
  id: number;
  setup: string;
  punchline: string;
  category: Category;
  isFavorite?: boolean;
};

type JokeStats = {
  totalViewed: number;
  favorites: number;
  lastCategory: Category;
};

export default function JokesScreen() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [favorites, setFavorites] = useState<Joke[]>([]);
  const [category, setCategory] = useState<Category>('ALL');
  const [index, setIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'jokes' | 'favorites'>('jokes');
  const [stats, setStats] = useState<JokeStats>({
    totalViewed: 0,
    favorites: 0,
    lastCategory: 'ALL',
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    animateJokeEntry();
  }, [index, viewMode]);

  useEffect(() => {
    ensureJokesAvailable();
  }, [category]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load saved stats
      const savedStats = await AsyncStorage.getItem('JOKE_STATS');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      // Load favorites
      const savedFavorites = await AsyncStorage.getItem('FAVORITE_JOKES');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      // Load initial jokes
      const initialJokes = await fetchJokesByCategory('ALL');
      setJokes(initialJokes);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load jokes:', error);
      setLoading(false);
    }
  };

  const animateJokeEntry = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(heartAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchJokesByCategory = async (cat: Category): Promise<Joke[]> => {
    try {
      let fetched: Joke[] = [];

      if (cat === 'PROGRAMMING') {
        const res = await fetch(
          'https://v2.jokeapi.dev/joke/Programming?type=twopart&amount=10&safe-mode'
        );
        const data = await res.json();
        if (data.jokes) {
          fetched = data.jokes.map((j: any) => ({
            id: j.id,
            setup: j.setup,
            punchline: j.delivery,
            category: 'PROGRAMMING',
          }));
        }
      } else if (cat === 'PUNS') {
        const res = await fetch(
          'https://v2.jokeapi.dev/joke/Pun?type=twopart&amount=10&safe-mode'
        );
        const data = await res.json();
        if (data.jokes) {
          fetched = data.jokes.map((j: any) => ({
            id: j.id,
            setup: j.setup,
            punchline: j.delivery,
            category: 'PUNS',
          }));
        }
      } else {
        const res = await fetch(
          'https://official-joke-api.appspot.com/jokes/general/ten'
        );
        const data = await res.json();
        fetched = data.map((j: any, idx: number) => ({
          id: j.id || Date.now() + idx,
          setup: j.setup,
          punchline: j.punchline,
          category: cat === 'DAD' ? 'DAD' : 'GENERAL',
        }));
      }

      return fetched;
    } catch (error) {
      console.error('Failed to fetch jokes:', error);
      return [];
    }
  };

  const ensureJokesAvailable = async () => {
    if (viewMode === 'favorites') return;

    const filtered =
      category === 'ALL' ? jokes : jokes.filter((j) => j.category === category);

    if (filtered.length === 0) {
      setLoading(true);
      const more = await fetchJokesByCategory(category);
      if (more.length > 0) {
        setJokes((prev) => [...prev, ...more]);
        setIndex(0);
        setShowPunchline(false);
      }
      setLoading(false);
    }
  };

  const saveStats = async (newStats: JokeStats) => {
    try {
      await AsyncStorage.setItem('JOKE_STATS', JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  };

  const saveFavorites = async (newFavorites: Joke[]) => {
    try {
      await AsyncStorage.setItem('FAVORITE_JOKES', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const toggleFavorite = () => {
    if (!currentJoke) return;

    animateHeart();

    const isCurrentlyFavorite = favorites.some((f) => f.id === currentJoke.id);

    if (isCurrentlyFavorite) {
      const updated = favorites.filter((f) => f.id !== currentJoke.id);
      saveFavorites(updated);
    } else {
      const updated = [...favorites, { ...currentJoke, isFavorite: true }];
      saveFavorites(updated);
      
      const newStats = {
        ...stats,
        favorites: updated.length,
      };
      saveStats(newStats);
    }
  };

  const shareJoke = async () => {
    if (!currentJoke) return;

    try {
      await Share.share({
        message: `${currentJoke.setup}\n\n${currentJoke.punchline}\n\n😂 Shared from Jokes App`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const nextJoke = () => {
    setShowPunchline(false);
    const displayJokes = viewMode === 'favorites' ? favorites : filteredJokes;
    setIndex((prev) => (prev + 1) % displayJokes.length);

    // Update stats
    const newStats = {
      ...stats,
      totalViewed: stats.totalViewed + 1,
      lastCategory: category,
    };
    saveStats(newStats);
  };

  const prevJoke = () => {
    setShowPunchline(false);
    const displayJokes = viewMode === 'favorites' ? favorites : filteredJokes;
    setIndex((prev) => (prev === 0 ? displayJokes.length - 1 : prev - 1));
  };

  const randomJoke = async () => {
    setShowPunchline(false);
    
    if (viewMode === 'favorites') {
      const randomIndex = Math.floor(Math.random() * favorites.length);
      setIndex(randomIndex);
    } else {
      const displayJokes = filteredJokes;
      if (displayJokes.length > 1) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * displayJokes.length);
        } while (randomIndex === index);
        setIndex(randomIndex);
      }
    }
  };

  const filteredJokes =
    category === 'ALL' ? jokes : jokes.filter((j) => j.category === category);

  const displayJokes = viewMode === 'favorites' ? favorites : filteredJokes;
  const currentJoke = displayJokes[index] || displayJokes[0];

  const isFavorite = currentJoke
    ? favorites.some((f) => f.id === currentJoke.id)
    : false;

  if (loading) {
    return (
      <View style={styles.center}>
        <Animated.Text style={[styles.loadingEmoji, { transform: [{ scale: heartAnim }] }]}>
          😂
        </Animated.Text>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading jokes...</Text>
      </View>
    );
  }

  if (!currentJoke) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>😅</Text>
        <Text style={styles.emptyText}>No jokes available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>😂 Jokes</Text>
            <Text style={styles.headerSubtitle}>Laugh out loud!</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsNumber}>{stats.totalViewed}</Text>
            <Text style={styles.statsLabel}>Jokes Viewed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* VIEW MODE TOGGLE */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'jokes' && styles.modeButtonActive]}
          onPress={() => {
            setViewMode('jokes');
            setIndex(0);
            setShowPunchline(false);
          }}
        >
          <Text style={[styles.modeText, viewMode === 'jokes' && styles.modeTextActive]}>
            😂 All Jokes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'favorites' && styles.modeButtonActive]}
          onPress={() => {
            setViewMode('favorites');
            setIndex(0);
            setShowPunchline(false);
          }}
        >
          <Text style={[styles.modeText, viewMode === 'favorites' && styles.modeTextActive]}>
            ❤️ Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORY SELECTOR */}
      {viewMode === 'jokes' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {(['ALL', 'GENERAL', 'DAD', 'PROGRAMMING', 'PUNS'] as Category[]).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
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
        </ScrollView>
      )}

      {/* JOKE CARD */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          }}
        >
          <LinearGradient
            colors={
              viewMode === 'favorites'
                ? ['#f093fb', '#f5576c']
                : ['#4facfe', '#00f2fe']
            }
            style={styles.card}
          >
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{currentJoke.category}</Text>
            </View>

            {/* Setup */}
            <Text style={styles.setup}>{currentJoke.setup}</Text>

            {/* Punchline Toggle */}
            {!showPunchline ? (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => setShowPunchline(true)}
              >
                <Text style={styles.revealText}>Tap for punchline 👇</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.punchlineContainer}>
                <View style={styles.punchlineDivider} />
                <Text style={styles.punchline}>{currentJoke.punchline}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
                <Animated.Text
                  style={[styles.actionEmoji, { transform: [{ scale: heartAnim }] }]}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </Animated.Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={shareJoke}>
                <Text style={styles.actionEmoji}>📤</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={randomJoke}>
                <Text style={styles.actionEmoji}>🎲</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* NAVIGATION */}
          <View style={styles.navigation}>
            <TouchableOpacity style={styles.navButton} onPress={prevJoke}>
              <Text style={styles.navArrow}>←</Text>
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>

            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {displayJokes.length}
              </Text>
              <Text style={styles.counterLabel}>
                {viewMode === 'favorites' ? 'Favorite' : currentJoke.category}
              </Text>
            </View>

            <TouchableOpacity style={styles.navButton} onPress={nextJoke}>
              <Text style={styles.navText}>Next</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* TIPS */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
            <Text style={styles.tipText}>• Tap ❤️ to save your favorites</Text>
            <Text style={styles.tipText}>• Use 📤 to share with friends</Text>
            <Text style={styles.tipText}>• Hit 🎲 for a random joke</Text>
            <Text style={styles.tipText}>• Swipe categories to explore</Text>
          </View>

          {/* STATS CARD */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>📊 Your Laugh Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalViewed}</Text>
                <Text style={styles.statLabel}>Jokes Viewed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{favorites.length}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{jokes.length}</Text>
                <Text style={styles.statLabel}>In Library</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingEmoji: {
    fontSize: 80,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },

  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 24,
  },

  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },

  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  header: {
    padding: 30,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },

  statsBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },

  statsNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },

  statsLabel: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },

  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 4,
  },

  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },

  modeTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },

  categoriesScroll: {
    maxHeight: 50,
  },

  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 10,
  },

  categoryChipActive: {
    backgroundColor: '#6366f1',
  },

  categoryText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },

  categoryTextActive: {
    color: '#fff',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
  },

  card: {
    padding: 30,
    borderRadius: 24,
    minHeight: 320,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  categoryBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  setup: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },

  revealButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 16,
    borderRadius: 14,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  revealText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  punchlineContainer: {
    marginTop: 8,
  },

  punchlineDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 16,
    borderRadius: 1,
  },

  punchline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 20,
  },

  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  actionEmoji: {
    fontSize: 24,
  },

  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },

  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },

  navArrow: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: 'bold',
  },

  navText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
  },

  counter: {
    alignItems: 'center',
  },

  counterText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },

  counterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  tipsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#fde047',
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 12,
  },

  tipText: {
    fontSize: 14,
    color: '#78350f',
    marginBottom: 6,
    lineHeight: 20,
  },

  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  statsCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6366f1',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
