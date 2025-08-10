// Seeded random number generator for consistent randomization
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export const createSeededRandom = (budget: number): SeededRandom => {
  // Create seed from budget to ensure same budget gives same base results
  // but add some time-based variation to prevent exact repeats
  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60)); // Changes hourly
  const seed = budget + timeSeed;
  return new SeededRandom(seed);
};