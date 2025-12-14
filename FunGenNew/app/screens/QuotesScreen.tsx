import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Share,
  ScrollView,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

/* ======================
   TYPES
   ====================== */
type Quote = {
  id: string;
  text: string;
  author: string;
  category?: string;
  isFavorite?: boolean;
};

type ViewMode = 'swipe' | 'list' | 'daily' | 'favorites';

/* ======================
   CONFIG
   ====================== */
const QUOTES_API = 'https://zenquotes.io/api/quotes';
const CACHE_KEY = 'QUOTES_CACHE';
const CACHE_TIME_KEY = 'QUOTES_CACHE_TIME';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FAVORITES_KEY = 'FAVORITE_QUOTES';
const DAILY_QUOTE_KEY = 'DAILY_QUOTE';
const DAILY_DATE_KEY = 'DAILY_QUOTE_DATE';
const QUOTE_STATS_KEY = 'QUOTE_STATS';

type QuoteStats = {
  totalViewed: number;
  favorites: number;
  shared: number;
};

// Gradient themes for quotes
const GRADIENT_THEMES = [
  ['#667eea', '#764ba2'], // Purple
  ['#f093fb', '#f5576c'], // Pink
  ['#4facfe', '#00f2fe'], // Blue
  ['#43e97b', '#38f9d7'], // Green
  ['#fa709a', '#fee140'], // Orange
  ['#30cfd0', '#330867'], // Teal
  ['#a8edea', '#fed6e3'], // Pastel
  ['#ff6b6b', '#ee5a6f'], // Red
];

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [stats, setStats] = useState<QuoteStats>({
    totalViewed: 0,
    favorites: 0,
    shared: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    animateEntry();
  }, [viewMode]);

  const animateEntry = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.4,
        duration: 200,
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

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load stats
      const savedStats = await AsyncStorage.getItem(QUOTE_STATS_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      // Load favorites
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      // Load daily quote
      await loadDailyQuote();

      // Load quotes
      await loadQuotes();

      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const loadQuotes = async () => {
    try {
      const now = Date.now();
      const lastFetch = await AsyncStorage.getItem(CACHE_TIME_KEY);
      const cachedQuotes = await AsyncStorage.getItem(CACHE_KEY);

      if (cachedQuotes && lastFetch && now - Number(lastFetch) < CACHE_TTL) {
        setQuotes(JSON.parse(cachedQuotes));
        return;
      }

      const res = await fetch(QUOTES_API);
      const data = await res.json();

      const formatted: Quote[] = data.map((q: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        text: q.q,
        author: q.a || 'Unknown',
        category: categorizeQuote(q.q),
      }));

      setQuotes(formatted);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
      await AsyncStorage.setItem(CACHE_TIME_KEY, now.toString());
    } catch (err) {
      console.warn('Quotes fetch failed', err);
    }
  };

  const categorizeQuote = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('success') || lower.includes('achieve')) return 'Success';
    if (lower.includes('life') || lower.includes('live')) return 'Life';
    if (lower.includes('love') || lower.includes('heart')) return 'Love';
    if (lower.includes('wisdom') || lower.includes('wise')) return 'Wisdom';
    if (lower.includes('happy') || lower.includes('joy')) return 'Happiness';
    return 'Inspiration';
  };

  const loadDailyQuote = async () => {
    try {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem(DAILY_DATE_KEY);
      const savedQuote = await AsyncStorage.getItem(DAILY_QUOTE_KEY);

      if (savedDate === today && savedQuote) {
        setDailyQuote(JSON.parse(savedQuote));
        return;
      }

      // Fetch new daily quote
      const res = await fetch('https://zenquotes.io/api/today');
      const data = await res.json();

      if (data && data[0]) {
        const newDaily: Quote = {
          id: `daily-${Date.now()}`,
          text: data[0].q,
          author: data[0].a || 'Unknown',
          category: 'Daily',
        };

        setDailyQuote(newDaily);
        await AsyncStorage.setItem(DAILY_QUOTE_KEY, JSON.stringify(newDaily));
        await AsyncStorage.setItem(DAILY_DATE_KEY, today);
      }
    } catch (error) {
      console.error('Failed to load daily quote:', error);
    }
  };

  const saveStats = async (newStats: QuoteStats) => {
    try {
      await AsyncStorage.setItem(QUOTE_STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  };

  const saveFavorites = async (newFavorites: Quote[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const toggleFavorite = (quote: Quote) => {
    animateHeart();

    const isFavorite = favorites.some((f) => f.id === quote.id);

    if (isFavorite) {
      const updated = favorites.filter((f) => f.id !== quote.id);
      saveFavorites(updated);
    } else {
      const updated = [...favorites, { ...quote, isFavorite: true }];
      saveFavorites(updated);
      
      const newStats = {
        ...stats,
        favorites: updated.length,
      };
      saveStats(newStats);
    }
  };

  const shareQuote = async (quote: Quote) => {
    try {
      await Share.share({
        message: `"${quote.text}"\n\n— ${quote.author}\n\n✨ Shared from Daily Inspiration`,
      });

      const newStats = {
        ...stats,
        shared: stats.shared + 1,
      };
      saveStats(newStats);
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const trackView = () => {
    const newStats = {
      ...stats,
      totalViewed: stats.totalViewed + 1,
    };
    saveStats(newStats);
  };

  const getGradient = (index: number) => {
    return GRADIENT_THEMES[index % GRADIENT_THEMES.length];
  };

  const displayQuotes = viewMode === 'favorites' ? favorites : quotes;
  const currentQuote = displayQuotes[currentIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <Animated.Text style={[styles.loadingEmoji, { transform: [{ scale: scaleAnim }] }]}>
          ✨
        </Animated.Text>
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading inspiration...</Text>
      </View>
    );
  }

  if (!quotes.length && viewMode !== 'daily') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🧘</Text>
        <Text style={styles.emptyText}>No quotes available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuotes}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Daily Quote View
  if (viewMode === 'daily' && dailyQuote) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <LinearGradient colors={getGradient(0)} style={styles.dailyContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('swipe')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.dailyContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.dailyBadge}>☀️ Quote of the Day</Text>
            <Text style={styles.dailyDate}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}</Text>
            
            <View style={styles.dailyQuoteCard}>
              <Text style={styles.dailyQuoteText}>"{dailyQuote.text}"</Text>
              <Text style={styles.dailyAuthor}>— {dailyQuote.author}</Text>
            </View>

            <View style={styles.dailyActions}>
              <TouchableOpacity
                style={styles.dailyActionButton}
                onPress={() => toggleFavorite(dailyQuote)}
              >
                <Animated.Text
                  style={[styles.actionEmoji, { transform: [{ scale: heartAnim }] }]}
                >
                  {favorites.some((f) => f.id === dailyQuote.id) ? '❤️' : '🤍'}
                </Animated.Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dailyActionButton}
                onPress={() => shareQuote(dailyQuote)}
              >
                <Text style={styles.actionEmoji}>📤</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        <View style={styles.listHeader}>
          <TouchableOpacity onPress={() => setViewMode('swipe')}>
            <Text style={styles.listBackButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.listTitle}>All Quotes</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {displayQuotes.map((quote, index) => {
            const isFavorite = favorites.some((f) => f.id === quote.id);
            return (
              <TouchableOpacity
                key={quote.id}
                activeOpacity={0.7}
                onPress={() => {
                  setCurrentIndex(index);
                  setViewMode('swipe');
                }}
              >
                <LinearGradient
                  colors={getGradient(index)}
                  style={styles.listCard}
                >
                  <View style={styles.listCardContent}>
                    <Text style={styles.listQuoteText} numberOfLines={3}>
                      "{quote.text}"
                    </Text>
                    <Text style={styles.listAuthor}>— {quote.author}</Text>
                    {quote.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{quote.category}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.listActions}>
                    <TouchableOpacity onPress={() => toggleFavorite(quote)}>
                      <Text style={styles.listActionIcon}>
                        {isFavorite ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Swipe View (Default)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.controlIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {displayQuotes.length}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.controlIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Quotes Swiper */}
      <Animated.FlatList
        data={displayQuotes}
        keyExtractor={(item) => item.id}
        horizontal={false}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
          trackView();
        }}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * height,
            index * height,
            (index + 1) * height,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const rotateY = scrollY.interpolate({
            inputRange,
            outputRange: ['15deg', '0deg', '-15deg'],
            extrapolate: 'clamp',
          });

          const isFavorite = favorites.some((f) => f.id === item.id);

          return (
            <View style={styles.page}>
              <LinearGradient
                colors={getGradient(index)}
                style={styles.pageGradient}
              >
                <Animated.View
                  style={[
                    styles.card,
                    {
                      transform: [{ scale }, { perspective: 1000 }, { rotateY }],
                      opacity,
                    },
                  ]}
                >
                  {item.category && (
                    <View style={styles.swipeCategoryBadge}>
                      <Text style={styles.swipeCategoryText}>{item.category}</Text>
                    </View>
                  )}

                  <Text style={styles.quoteText}>"{item.text}"</Text>
                  <Text style={styles.authorText}>— {item.author}</Text>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => toggleFavorite(item)}
                    >
                      <Animated.Text
                        style={[
                          styles.cardActionIcon,
                          { transform: [{ scale: heartAnim }] },
                        ]}
                      >
                        {isFavorite ? '❤️' : '🤍'}
                      </Animated.Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => shareQuote(item)}
                    >
                      <Text style={styles.cardActionIcon}>📤</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.swipeHint}>↕️ Swipe for more</Text>
                </Animated.View>
              </LinearGradient>
            </View>
          );
        }}
      />

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>✨ Inspiration Menu</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setViewMode('daily');
              }}
            >
              <Text style={styles.menuIcon}>☀️</Text>
              <Text style={styles.menuText}>Daily Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setViewMode('list');
              }}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>View All ({quotes.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setViewMode('favorites');
                setCurrentIndex(0);
              }}
            >
              <Text style={styles.menuIcon}>❤️</Text>
              <Text style={styles.menuText}>Favorites ({favorites.length})</Text>
            </TouchableOpacity>

            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>📊 Your Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalViewed}</Text>
                  <Text style={styles.statLabel}>Viewed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{favorites.length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.shared}</Text>
                  <Text style={styles.statLabel}>Shared</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingEmoji: {
    fontSize: 80,
  },

  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },

  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },

  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },

  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Top Controls
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },

  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  controlIcon: {
    fontSize: 20,
    color: '#ffffff',
  },

  progressIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Swipe View
  page: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    paddingHorizontal: 32,
    paddingVertical: 60,
    maxWidth: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  swipeCategoryBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },

  swipeCategoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  quoteText: {
    fontSize: 28,
    lineHeight: 40,
    color: '#F9FAFB',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 32,
  },

  authorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 32,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },

  cardActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  cardActionIcon: {
    fontSize: 24,
  },

  swipeHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },

  actionEmoji: {
    fontSize: 24,
  },

  // List View
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8fafc',
  },

  listBackButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },

  listTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },

  listContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  listCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  listCardContent: {
    flex: 1,
  },

  listQuoteText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },

  listAuthor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  categoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  listActions: {
    justifyContent: 'center',
    marginLeft: 12,
  },

  listActionIcon: {
    fontSize: 28,
  },

  // Daily View
  dailyContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 40,
  },

  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  dailyContent: {
    flex: 1,
    justifyContent: 'center',
  },

  dailyBadge: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },

  dailyDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },

  dailyQuoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 40,
  },

  dailyQuoteText: {
    fontSize: 32,
    lineHeight: 44,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },

  dailyAuthor: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  dailyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },

  dailyActionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },

  menuContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },

  menuTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },

  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },

  menuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },

  statsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
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
    color: '#6366F1',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },

  closeButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
