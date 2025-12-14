import React, { createContext, useContext, useState, ReactNode } from 'react';

type Stats = {
  gamesPlayed: number;
  jokesRead: number;
  factsLearned: number;
  achievements: number;
};

type StatsContextType = {
  stats: Stats;
  incrementGame: () => void;
  incrementJoke: () => void;
  incrementFact: () => void;
};

const StatsContext = createContext<StatsContextType | null>(null);

export const StatsProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<Stats>({
    gamesPlayed: 0,
    jokesRead: 0,
    factsLearned: 0,
    achievements: 0,
  });

  const incrementGame = () =>
    setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));

  const incrementJoke = () =>
    setStats(prev => ({ ...prev, jokesRead: prev.jokesRead + 1 }));

  const incrementFact = () =>
    setStats(prev => ({ ...prev, factsLearned: prev.factsLearned + 1 }));

  return (
    <StatsContext.Provider
      value={{ stats, incrementGame, incrementJoke, incrementFact }}
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
