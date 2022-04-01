export interface Guess {
  country: string;
  distanceKm: number;
  bearingDeg: number;
  correct: boolean;
}

export interface StoredData {
  targetCountry: string;
  guesses: (Guess | null)[];
}

const localStorageKey = "worldle";

export const setStoredData = (data: StoredData) => {
  localStorage.setItem(localStorageKey, JSON.stringify(data));
};

export const getStoredData = (): StoredData | undefined => {
  const json = localStorage.getItem(localStorageKey);
  if (json) {
    return JSON.parse(json) as StoredData;
  }

  return undefined;
};
