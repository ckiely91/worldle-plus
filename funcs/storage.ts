export interface Guess {
  country: string;
  distanceKm: number;
  bearingDeg: number;
  correct: boolean;
}

export interface TodaysData {
  targetCountry: string;
  bonusGuess?: string;
  guesses: (Guess | null)[];
}

const todaysDataLocalStorageKey = "worldle";
const statsDataLocalStorageKey = "worldleStats";

export const setTodaysData = (data: TodaysData) => {
  localStorage.setItem(todaysDataLocalStorageKey, JSON.stringify(data));
};

export const getTodaysData = (): TodaysData | undefined => {
  const json = localStorage.getItem(todaysDataLocalStorageKey);
  if (json) {
    return JSON.parse(json) as TodaysData;
  }

  return undefined;
};

export interface StatsData {
  guessDistribution: Record<number | "X", number>;
  numCompleted: number;
  numBonusCorrect: number;
  currentStreak: number;
  maxStreak: number;
}

const emptyStatsData: StatsData = {
  guessDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    X: 0,
  },
  numCompleted: 0,
  numBonusCorrect: 0,
  currentStreak: 0,
  maxStreak: 0,
};

export const getStatsData = (): StatsData => {
  const json = localStorage.getItem(statsDataLocalStorageKey);
  if (json) {
    return JSON.parse(json) as StatsData;
  }

  return emptyStatsData;
};

export const setStatsData = (data: StatsData) => {
  localStorage.setItem(statsDataLocalStorageKey, JSON.stringify(data));
};

export const updateStatsData = (
  correct: boolean,
  numGuesses: number,
  bonusCorrect: boolean
) => {
  const stats = getStatsData();

  if (correct) {
    stats.guessDistribution[numGuesses]++;
    stats.currentStreak++;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
  } else {
    stats.guessDistribution["X"]++;
    stats.currentStreak = 0;
  }

  stats.numCompleted++;

  if (bonusCorrect) {
    stats.numBonusCorrect++;
  }

  setStatsData(stats);
};
