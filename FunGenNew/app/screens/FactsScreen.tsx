import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FACTS = [
  {
    id: 1,
    fact: "Honey never spoils! Archaeologists have found 3000-year-old honey in Egyptian tombs that was still perfectly edible.",
    category: 'Nature',
    emoji: '🍯',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    fact: "Octopuses have three hearts and blue blood! Two hearts pump blood to the gills, while the third pumps it to the rest of the body.",
    category: 'Animals',
    emoji: '🐙',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    fact: "The human brain uses 20% of the body's energy but only makes up 2% of body weight.",
    category: 'Science',
    emoji: '🧠',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    id: 4,
    fact: "Bananas are berries, but strawberries aren't! In botanical terms, a berry is a fruit produced from a single flower with one ovary.",
    category: 'Food',
    emoji: '🍌',
    gradient: ['#43e97b', '#38f9d7'],
  },
  {
    id: 5,
    fact: "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion of the metal.",
    category: 'History',
    emoji: '🗼',
    gradient: ['#fa709a', '#fee140'],
  },
  {
    id: 6,
    fact: "A day on Venus is longer than a year on Venus! It takes 243 Earth days to rotate but only 225 Earth days to orbit the Sun.",
    category: 'Space',
    emoji: '🌍',
    gradient: ['#30cfd0', '#330867'],
  },
];

const CATEGORIES = ['All', 'Nature', 'Animals', 'Science', 'Food', 'History', 'Space'];

export default function FactsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [readFacts, setReadFacts] = useState<number[]>([]);

  const filteredFacts =
    selectedCategory === 'All'
      ? FACTS
      : FACTS.filter((fact) => fact.category === selectedCategory);

  const markAsRead = (id: number) => {
    if (!readFacts.includes(id)) {
      setReadFacts((prev) => [...prev, id]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>💡 Amazing Facts</Text>
        <Text style={styles.headerSubtitle}>Expand your knowledge!</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{readFacts.length}</Text>
          <Text style={styles.statLabel}>Facts Read</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{FACTS.length}</Text>
          <Text style={styles.statLabel}>Total Facts</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{CATEGORIES.length - 1}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Facts List */}
      <ScrollView
        style={styles.factsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.factsContent}
      >
        {filteredFacts.map((fact) => (
          <TouchableOpacity
            key={fact.id}
            activeOpacity={0.9}
            onPress={() => markAsRead(fact.id)}
          >
            <LinearGradient
              colors={fact.gradient}
              style={styles.factCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {readFacts.includes(fact.id) && (
                <View style={styles.readBadge}>
                  <Text style={styles.readBadgeText}>✓ Read</Text>
                </View>
              )}
              
              <Text style={styles.factEmoji}>{fact.emoji}</Text>
              
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{fact.category}</Text>
              </View>
              
              <Text style={styles.factText}>{fact.fact}</Text>
              
              <View style={styles.factFooter}>
                <TouchableOpacity style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>📤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>⭐</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>📋</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  factsContainer: {
    flex: 1,
  },
  factsContent: {
    padding: 20,
  },
  factCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
  },
  readBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  factEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  factText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    marginBottom: 16,
  },
  factFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 20,
  },
});
