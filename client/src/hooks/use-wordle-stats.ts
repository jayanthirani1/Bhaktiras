import { useState, useEffect } from "react";

export interface WordleStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // 1-6 guesses
  lastPlayedDate?: string;
}

const STORAGE_KEY = "wordle-stats";

const defaultStats: WordleStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

function loadStats(): WordleStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultStats, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
  return defaultStats;
}

function saveStats(stats: WordleStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
}

export function useWordleStats() {
  const [stats, setStats] = useState<WordleStats>(loadStats);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const recordWin = (guessCount: number) => {
    const today = new Date().toDateString();
    const lastPlayed = stats.lastPlayedDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Update streak
    let newStreak = stats.currentStreak;
    if (!lastPlayed || lastPlayed === yesterday || lastPlayed === today) {
      newStreak = lastPlayed === today ? stats.currentStreak : stats.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      gamesWon: prev.gamesWon + 1,
      currentStreak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
      guessDistribution: {
        ...prev.guessDistribution,
        [guessCount]: (prev.guessDistribution[guessCount] ?? 0) + 1,
      },
      lastPlayedDate: today,
    }));
  };

  const recordLoss = () => {
    const today = new Date().toDateString();
    
    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      currentStreak: 0,
      lastPlayedDate: today,
    }));
  };

  const resetStats = () => {
    setStats(defaultStats);
  };

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  return {
    stats,
    winRate,
    recordWin,
    recordLoss,
    resetStats,
  };
}
