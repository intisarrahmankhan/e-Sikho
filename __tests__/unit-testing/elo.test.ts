import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  calculateDynamicKFactor,
  calculateContestRatingDelta,
  calculateCompositeElo,
  calculateBackgroundPriority,
  getRatingTier,
} from '@/lib/elo';

describe('Elo Engine & Mathematical Logic', () => {
  it('calculates logistic expected score correctly', () => {
    // If player rating == benchmark rating, expected score should be 0.5 (50%)
    const expectedEqual = calculateExpectedScore(1500, 1500);
    expect(expectedEqual).toBeCloseTo(0.5, 2);

    // If player rating is higher than benchmark (1900 vs 1500, +400 diff), expected score is ~0.909
    const expectedHigher = calculateExpectedScore(1900, 1500);
    expect(expectedHigher).toBeGreaterThan(0.9);

    // If player rating is lower than benchmark (1100 vs 1500, -400 diff), expected score is ~0.091
    const expectedLower = calculateExpectedScore(1100, 1500);
    expect(expectedLower).toBeLessThan(0.1);
  });

  it('adjusts dynamic K-factor based on player experience and rating', () => {
    // High K for beginners (< 5 contests)
    expect(calculateDynamicKFactor(1200, 2)).toBe(48);

    // Normal K for apprentice (1350 rating, established player)
    expect(calculateDynamicKFactor(1350, 10)).toBe(36);
    // Intermediate K for specialist (1500 rating)
    expect(calculateDynamicKFactor(1500, 10)).toBe(28);

    // High rating stability (Grandmasters >= 2000)
    expect(calculateDynamicKFactor(2100, 20)).toBe(16);
  });

  it('strictly decreases Elo rating when contest performance drops or fails', () => {
    // A 1600-rated student participates in a 1400-rated contest and only gets 10% score
    const resultPoor = calculateContestRatingDelta({
      currentCompetitiveElo: 1600,
      benchmarkRating: 1400,
      score: 10,
      totalMarks: 100,
      timeTakenSeconds: 3000,
      totalDurationSeconds: 3600,
      totalContestsPlayed: 10,
    });

    expect(resultPoor.delta).toBeLessThan(0);
    expect(resultPoor.newCompetitiveElo).toBeLessThan(1600);

    // Completely failing with score 0
    const resultZero = calculateContestRatingDelta({
      currentCompetitiveElo: 1500,
      benchmarkRating: 1500,
      score: 0,
      totalMarks: 100,
      timeTakenSeconds: 1800,
      totalDurationSeconds: 3600,
      totalContestsPlayed: 6,
    });
    expect(resultZero.delta).toBeLessThanOrEqual(-15);
  });

  it('increases Elo rating when performance beats benchmark expectation', () => {
    // A 1300-rated student participates in a 1500-rated contest and gets 95% score
    const resultGreat = calculateContestRatingDelta({
      currentCompetitiveElo: 1300,
      benchmarkRating: 1500,
      score: 95,
      totalMarks: 100,
      timeTakenSeconds: 1200,
      totalDurationSeconds: 3600,
      totalContestsPlayed: 8,
    });

    expect(resultGreat.delta).toBeGreaterThan(15);
    expect(resultGreat.newCompetitiveElo).toBeGreaterThan(1300);
  });

  it('calculates composite Elo with course completion and solved problem bonuses', () => {
    // Base 1300, 4 completed courses (+100 bonus), 30 problems solved (+60 bonus)
    const composite = calculateCompositeElo({
      competitiveElo: 1300,
      completedCoursesCount: 4,
      problemsSolved: 30,
    });

    expect(composite.courseBonus).toBe(100);
    expect(composite.problemsBonus).toBe(60);
    expect(composite.compositeElo).toBe(1460);
    expect(composite.tier.tier).toBe('Specialist');
  });

  it('correctly categorizes rating tiers', () => {
    expect(getRatingTier(1050).tier).toBe('Novice');
    expect(getRatingTier(1250).tier).toBe('Pupil');
    expect(getRatingTier(1450).tier).toBe('Specialist');
    expect(getRatingTier(1650).tier).toBe('Expert');
    expect(getRatingTier(1850).tier).toBe('Candidate Master');
    expect(getRatingTier(2050).tier).toBe('Grandmaster');
  });

  it('prioritizes CS contests for CS students with HIGH priority and deprioritizes for other backgrounds', () => {
    // CS Student viewing a CSE contest
    const csMatch = calculateBackgroundPriority('Computer Science & Engineering (CSE)', ['CSE', 'SWE']);
    expect(csMatch.priority).toBe('HIGH');
    expect(csMatch.priorityScore).toBe(100);
    expect(csMatch.isDirectMatch).toBe(true);

    // Business student viewing a CSE contest
    const bbaMatch = calculateBackgroundPriority('Business Administration (BBA)', ['CSE', 'SWE']);
    expect(bbaMatch.priority).toBe('LOW');
    expect(bbaMatch.priorityScore).toBe(25);
    expect(bbaMatch.isDirectMatch).toBe(false);

    // General contest open for all
    const genMatch = calculateBackgroundPriority('Business Administration (BBA)', ['GENERAL']);
    expect(genMatch.priority).toBe('NORMAL');
    expect(genMatch.priorityScore).toBe(60);
  });
});
