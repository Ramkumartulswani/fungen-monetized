import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const JOKES = [
  {
    id: 1,
    setup: "Why don't scientists trust atoms?",
    punchline: "Because they make up everything! 😄",
    category: 'Science',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    setup: "What do you call a bear with no teeth?",
    punchline: "A gummy bear! 🐻",
    category: 'Animals',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    setup: "Why did the scarecrow win an award?",
    punchline: "He was outstanding in his field! 🌾",
    category: 'Dad Jokes',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    id: 4,
    setup: "What do you call a fake noodle?",
    punchline: "An impasta! 🍝",
    category: 'Food',
    gradient: ['#43e97b', '#38f9d7'],
  },
  {
    id: 5,
    setup: "Why don't eggs tell jokes?",
    punchline: "They'd crack each other up! 🥚",
    category: 'Food',
    gradient: ['#fa709a', '#fee140'],
  },
];

export default function JokesScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const currentJoke = JOKES[currentIndex];

  const nextJoke = () => {
    setShowPunchline(false);
    setCurrentIndex((prev) => (prev + 1) % JOKES.length);
  };

  const previousJoke = () => {
    setShowPunchline(false);
    setCurrentIndex((prev) => (prev - 1 + JOKES.length) % JOKES.length);
  };

  const toggleFavorite = () => {
    setFavorites((prev) =>
      prev.includes(currentJoke.id)
        ? prev.filter((id) => id !== currentJoke.id)
        : [...prev, currentJoke.id]
    );
  };

  const isFavorite = favorites.includes(currentJoke.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>😂 Jokes</Text>
        <Text style={styles.headerSubtitle}>Swipe for more laughs!</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{currentJoke.category}</Text>
        </View>

        {/* Joke Card */}
        <LinearGradient
          colors={currentJoke.gradient}
          style={styles.jokeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.jokeContent}>
            <Text style={styles.setup}>{currentJoke.setup}</Text>

            {!showPunchline ? (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => setShowPunchline(true)}
              >
                <Text style={styles.revealButtonText}>Tap to reveal 👇</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.punchlineContainer}>
                <View style={styles.divider} />
                <Text style={styles.punchline}>{currentJoke.punchline}</Text>
              </View>
            )}
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={previousJoke}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {JOKES.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={nextJoke}
          >
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonEmoji}>📤</Text>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonEmoji}>🔀</Text>
            <Text style={styles.actionButtonText}>Random</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonEmoji}>⭐</Text>
            <Text style={styles.actionButtonText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: '#6366f1',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  jokeCard: {
    flex: 1,
    borderRadius: 30,
    padding: 30,
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginBottom: 20,
  },
  jokeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  setup: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 36,
  },
  revealButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignSelf: 'center',
  },
  revealButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  punchlineContainer: {
    alignItems: 'center',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginBottom: 20,
  },
  punchline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 34,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  counter: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
