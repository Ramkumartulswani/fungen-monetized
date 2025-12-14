import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

/* ---------- Animated Counter ---------- */
const AnimatedNumber = ({ value }: { value: number }) => {
  const animated = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value,
      duration: 600,
      useNativeDriver: false,
    }).start();

    const id = animated.addListener(({ value }) =>
      setDisplay(Math.floor(value))
    );

    return () => animated.removeListener(id);
  }, [value]);

  return <Text style={styles.statValue}>{display}</Text>;
};

type LiveStats = {
  // Games
  gamesPlayed: number;
  totalScore: number;
  bestReaction: number | null;
  
  // Sugar Tracker
  sugarReadings: number;
  lastSugarLevel: number | null;
  avgSugarLevel: number | null;
  
  // Market (if you want to track views)
  marketViews: number;
  
  // General
  lastActive: string;
  streakDays: number;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<LiveStats>({
    gamesPlayed: 0,
    totalScore: 0,
    bestReaction: null,
    sugarReadings: 0,
    lastSugarLevel: null,
    avgSugarLevel: null,
    marketViews: 0,
    lastActive: '',
    streakDays: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Hello');
  
  // Pulse animation for new updates
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAllStats();
    }, [])
  );

  useEffect(() => {
    loadAllStats();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const loadAllStats = async () => {
    try {
      // Load Gaming Stats
      const gameStats = await AsyncStorage.getItem('GAME_STATS');
      const parsedGameStats = gameStats ? JSON.parse(gameStats) : null;

      // Load Sugar Readings
      const sugarReadings = await AsyncStorage.getItem('SUGAR_READINGS');
      const parsedSugarReadings = sugarReadings ? JSON.parse(sugarReadings) : [];

      // Calculate sugar stats
      let avgSugar = null;
      let lastSugar = null;
      if (parsedSugarReadings.length > 0) {
        lastSugar = parsedSugarReadings[0].value;
        const sum = parsedSugarReadings.reduce((acc: number, r: any) => acc + r.value, 0);
        avgSugar = Math.round(sum / parsedSugarReadings.length);
      }

      // Load market views (track if user visited)
      const marketViews = await AsyncStorage.getItem('MARKET_VIEWS');

      // Load last active date for streak
      const lastActive = await AsyncStorage.getItem('LAST_ACTIVE_DATE');
      const today = new Date().toDateString();
      const streak = calculateStreak(lastActive, today);

      // Update last active
      await AsyncStorage.setItem('LAST_ACTIVE_DATE', today);

      setStats({
        gamesPlayed: parsedGameStats?.gamesPlayed || 0,
        totalScore: parsedGameStats?.totalScore || 0,
        bestReaction: parsedGameStats?.bestReaction || null,
        sugarReadings: parsedSugarReadings.length,
        lastSugarLevel: lastSugar,
        avgSugarLevel: avgSugar,
        marketViews: marketViews ? parseInt(marketViews) : 0,
        lastActive: lastActive || today,
        streakDays: streak,
      });

      // Trigger pulse animation when data loads
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const calculateStreak = (lastActive: string | null, today: string) => {
    if (!lastActive) return 1;
    
    const last = new Date(lastActive);
    const current = new Date(today);
    const diffTime = Math.abs(current.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If last active was yesterday or today, increment streak
    if (diffDays <= 1) {
      const savedStreak = AsyncStorage.getItem('STREAK_DAYS').then(s => parseInt(s || '0'));
      return savedStreak.then(s => {
        const newStreak = diffDays === 0 ? s : s + 1;
        AsyncStorage.setItem('STREAK_DAYS', newStreak.toString());
        return newStreak;
      });
    }
    
    // Reset streak
    AsyncStorage.setItem('STREAK_DAYS', '1');
    return 1;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllStats();
    setRefreshing(false);
  };

  const getTotalActivity = () => {
    return stats.gamesPlayed + stats.sugarReadings + stats.marketViews;
  };

  const getMotivationalMessage = () => {
    const total = getTotalActivity();
    if (total === 0) return "Let's get started! 🚀";
    if (total < 5) return "You're just getting warmed up! 💪";
    if (total < 10) return "Great progress! Keep it up! 🌟";
    if (total < 20) return "You're on fire! 🔥";
    return "Incredible dedication! 🏆";
  };

  const quickStats = [
    {
      emoji: '🎮',
      label: 'Games Played',
      value: stats.gamesPlayed,
      color: ['#667eea', '#764ba2'],
      onPress: () => navigation.navigate('Games' as never),
    },
    {
      emoji: '🩸',
      label: 'Health Logs',
      value: stats.sugarReadings,
      color: ['#f093fb', '#f5576c'],
      onPress: () => navigation.navigate('Sugar' as never),
    },
    {
      emoji: '📈',
      label: 'Market Views',
      value: stats.marketViews,
      color: ['#4facfe', '#00f2fe'],
      onPress: () => navigation.navigate('Market' as never),
    },
    {
      emoji: '🔥',
      label: 'Day Streak',
      value: stats.streakDays,
      color: ['#fa709a', '#fee140'],
      onPress: () => {},
    },
  ];

  const detailCards = [
    ...(stats.bestReaction
      ? [{
          title: 'Best Reaction Time',
          value: `${stats.bestReaction}ms`,
          emoji: '⚡',
          subtitle: stats.bestReaction < 200 ? 'Lightning fast!' : 'Keep practicing!',
          color: ['#667eea', '#764ba2'],
        }]
      : []),
    ...(stats.lastSugarLevel
      ? [{
          title: 'Latest Blood Sugar',
          value: `${stats.lastSugarLevel} mg/dL`,
          emoji: '🩸',
          subtitle: stats.lastSugarLevel >= 70 && stats.lastSugarLevel <= 140 
            ? 'Normal range' 
            : 'Check with doctor',
          color: stats.lastSugarLevel >= 70 && stats.lastSugarLevel <= 140
            ? ['#43e97b', '#38f9d7']
            : ['#fa709a', '#fee140'],
        }]
      : []),
    ...(stats.avgSugarLevel
      ? [{
          title: 'Average Blood Sugar',
          value: `${stats.avgSugarLevel} mg/dL`,
          emoji: '📊',
          subtitle: `Based on ${stats.sugarReadings} readings`,
          color: ['#4facfe', '#00f2fe'],
        }]
      : []),
    ...(stats.totalScore > 0
      ? [{
          title: 'Total Game Score',
          value: stats.totalScore.toLocaleString(),
          emoji: '🏆',
          subtitle: 'Points earned',
          color: ['#f093fb', '#f5576c'],
        }]
      : []),
  ];

  const quickActions = [
    {
      title: 'Market Insights',
      emoji: '📈',
      gradient: ['#11998e', '#38ef7d'],
      description: 'Live options data',
      onPress: () => {
        AsyncStorage.setItem('MARKET_VIEWS', (stats.marketViews + 1).toString());
        navigation.navigate('Market' as never);
      },
    },
    {
      title: 'Play Games',
      emoji: '🎮',
      gradient: ['#fa709a', '#fee140'],
      description: `${stats.gamesPlayed > 0 ? 'Play again' : 'Start playing'}`,
      onPress: () => navigation.navigate('Games' as never),
    },
    {
      title: 'Track Blood Sugar',
      emoji: '🩸',
      gradient: ['#ee0979', '#ff6a00'],
      description: `${stats.sugarReadings > 0 ? `${stats.sugarReadings} readings logged` : 'Start tracking'}`,
      onPress: () => navigation.navigate('Sugar' as never),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#667eea"
          colors={['#667eea']}
        />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.greeting}>{greeting}! 👋</Text>
        <Text style={styles.subtitle}>{getMotivationalMessage()}</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{getTotalActivity()}</Text>
            <Text style={styles.headerStatLabel}>Total Activities</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.streakDays}</Text>
            <Text style={styles.headerStatLabel}>Day Streak 🔥</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <TouchableOpacity onPress={loadAllStats}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[styles.statsGrid, { transform: [{ scale: pulseAnim }] }]}
        >
          {quickStats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={stat.onPress}
            >
              <LinearGradient colors={stat.color} style={styles.statCard}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <AnimatedNumber value={stat.value} />
                <Text style={styles.statLabel}>{stat.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Detail Cards */}
      {detailCards.length > 0 && (
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Recent Highlights</Text>
          {detailCards.map((card, index) => (
            <LinearGradient
              key={index}
              colors={card.color}
              style={styles.detailCard}
            >
              <Text style={styles.detailEmoji}>{card.emoji}</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{card.title}</Text>
                <Text style={styles.detailValue}>{card.value}</Text>
                <Text style={styles.detailSubtitle}>{card.subtitle}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            onPress={action.onPress}
          >
            <LinearGradient colors={action.gradient} style={styles.actionCard}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Challenge */}
      {stats.gamesPlayed === 0 && (
        <View style={styles.challengeContainer}>
          <Text style={styles.sectionTitle}>Get Started 🎯</Text>
          <LinearGradient
            colors={['#ff6b6b', '#ee5a6f']}
            style={styles.challengeCard}
          >
            <Text style={styles.challengeTitle}>
              Try your first game!
            </Text>
            <Text style={styles.challengeReward}>
              🏆 Test your reflexes and reaction time
            </Text>
            <TouchableOpacity
              style={styles.challengeButton}
              onPress={() => navigation.navigate('Games' as never)}
            >
              <Text style={styles.challengeButtonText}>Play Now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {stats.bestReaction && stats.bestReaction < 300 && (
        <View style={styles.challengeContainer}>
          <Text style={styles.sectionTitle}>Challenge 🎯</Text>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.challengeCard}
          >
            <Text style={styles.challengeTitle}>
              Beat your {stats.bestReaction}ms record!
            </Text>
            <Text style={styles.challengeReward}>
              🏆 Aim for under 200ms
            </Text>
            <TouchableOpacity
              style={styles.challengeButton}
              onPress={() => navigation.navigate('Games' as never)}
            >
              <Text style={styles.challengeButtonText}>Try Again</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Health Reminder */}
      {stats.sugarReadings === 0 && (
        <View style={styles.reminderContainer}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.reminderCard}
          >
            <Text style={styles.reminderEmoji}>🩸</Text>
            <Text style={styles.reminderTitle}>Start Tracking Your Health</Text>
            <Text style={styles.reminderText}>
              Monitor your blood sugar levels and stay healthy
            </Text>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => navigation.navigate('Sugar' as never)}
            >
              <Text style={styles.reminderButtonText}>Get Started</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  refreshText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  detailEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.8,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.8,
  },
  actionArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  challengeContainer: {
    padding: 20,
    paddingTop: 0,
  },
  challengeCard: {
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  challengeReward: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
  },
  challengeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  reminderContainer: {
    padding: 20,
    paddingTop: 0,
  },
  reminderCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  reminderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  reminderText: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
  },
  reminderButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  reminderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f093fb',
  },
});
