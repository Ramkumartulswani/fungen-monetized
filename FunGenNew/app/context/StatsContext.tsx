import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Stats = {
  gamesPlayed: number;
  jokesRead: number;
  factsLearned: number;
  achievements: number;
};

type StatsContextType = {
  stats: Stats;
  incrementGame: () => Promise<void>;
  incrementJoke: () => Promise<void>;
  incrementFact: () => Promise<void>;
  syncStats: () => Promise<void>;
};

const StatsContext = createContext<StatsContextType | null>(null);

const STATS_KEYS = {
  gamesPlayed: 'GAME_STATS',
  jokesRead: 'JOKES_VIEWED',
  factsLearned: 'FACTS_READ',
  achievements: 'GAME_ACHIEVEMENTS',
};

export const StatsProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<Stats>({
    gamesPlayed: 0,
    jokesRead: 0,
    factsLearned: 0,
    achievements: 0,
  });

  const loadFromStorage = useCallback(async (): Promise<Stats> => {
    try {
      const [gameStats, jokesViewed, factsRead, achievements] = await Promise.all([
        AsyncStorage.getItem(STATS_KEYS.gamesPlayed),
        AsyncStorage.getItem(STATS_KEYS.jokesRead),
        AsyncStorage.getItem(STATS_KEYS.factsLearned),
        AsyncStorage.getItem(STATS_KEYS.achievements),
      ]);

      const parsedGameStats = gameStats ? JSON.parse(gameStats) : { gamesPlayed: 0 };
      const parsedAchievements = achievements ? JSON.parse(achievements) : [];
      const unlockedCount = parsedAchievements.filter((a: { unlocked: boolean }) => a.unlocked).length;

      return {
        gamesPlayed: parsedGameStats.gamesPlayed || 0,
        jokesRead: jokesViewed ? parseInt(jokesViewed, 10) : 0,
        factsLearned: factsRead ? parseInt(factsRead, 10) : 0,
        achievements: unlockedCount,
      };
    } catch {
      return { gamesPlayed: 0, jokesRead: 0, factsLearned: 0, achievements: 0 };
    }
  }, []);

  const syncStats = useCallback(async () => {
    const loaded = await loadFromStorage();
    setStats(loaded);
  }, [loadFromStorage]);

  const incrementGame = useCallback(async () => {
    try {
      const savedStats = await AsyncStorage.getItem(STATS_KEYS.gamesPlayed);
      const currentStats = savedStats ? JSON.parse(savedStats) : { gamesPlayed: 0 };
      const newStats = { ...currentStats, gamesPlayed: currentStats.gamesPlayed + 1 };
      await AsyncStorage.setItem(STATS_KEYS.gamesPlayed, JSON.stringify(newStats));
      setStats(prev => ({ ...prev, gamesPlayed: newStats.gamesPlayed }));
    } catch (e) {
      console.error('Failed to update game stats:', e);
    }
  }, []);

  const incrementJoke = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STATS_KEYS.jokesRead);
      const current = saved ? parseInt(saved, 10) : 0;
      const newCount = current + 1;
      await AsyncStorage.setItem(STATS_KEYS.jokesRead, newCount.toString());
      setStats(prev => ({ ...prev, jokesRead: newCount }));
    } catch (e) {
      console.error('Failed to update joke stats:', e);
    }
  }, []);

  const incrementFact = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STATS_KEYS.factsLearned);
      const current = saved ? parseInt(saved, 10) : 0;
      const newCount = current + 1;
      await AsyncStorage.setItem(STATS_KEYS.factsLearned, newCount.toString());
      setStats(prev => ({ ...prev, factsLearned: newCount }));
    } catch (e) {
      console.error('Failed to update fact stats:', e);
    }
  }, []);

  React.useEffect(() => {
    syncStats();
  }, [syncStats]);

  return (
    <StatsContext.Provider
      value={{ stats, incrementGame, incrementJoke, incrementFact, syncStats }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) {
    throw new Error('useStats must be used inside StatsProvider');
  }
  return ctx;
};
