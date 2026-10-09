import { describe, it, expect } from 'vitest';
import {
  calculateContestRatingDelta,
  calculateCompositeElo,
  calculateBackgroundPriority,
  normalizeBackground,
} from '@/lib/elo';

describe('Contest Prioritization & Elo System', () => {
  it('identifies discipline match accurately and assigns priority weights', () => {
    // CSE student matching CSE contest -> HIGH priority (score 100)
    const csUser = 'Computer Science & Engineering (CSE)';
    const csContestTarget = ['CSE', 'SWE'];
    const csResult = calculateBackgroundPriority(csUser, csContestTarget);

    expect(csResult.priority).toBe('HIGH');
    expect(csResult.priorityScore).toBe(100);
    expect(csResult.isDirectMatch).toBe(true);

    // Business student viewing CSE contest -> LOW priority (score 25)
    const bbaUser = 'Business Administration (BBA)';
    const bbaResult = calculateBackgroundPriority(bbaUser, csContestTarget);

    expect(bbaResult.priority).toBe('LOW');
    expect(bbaResult.priorityScore).toBe(25);
    expect(bbaResult.isDirectMatch).toBe(false);

    // General contest open for all -> NORMAL priority (score 60)
    const genResult = calculateBackgroundPriority(bbaUser, ['GENERAL']);
    expect(genResult.priority).toBe('NORMAL');
    expect(genResult.priorityScore).toBe(60);
  });

  it('sorts contests by priority score so CS students see CS contests first', () => {
    const csUser = 'Computer Science & Engineering (CSE)';

    const mockContests = [
      { id: '1', title: 'FinTech Optimization', target: ['BUSINESS'] },
      { id: '2', title: 'National CS Algorithmic Grand Prix', target: ['CSE', 'SWE'] },
      { id: '3', title: 'Logic Deduction Olympiad', target: ['GENERAL'] },
    ];

    const sorted = [...mockContests].sort((a, b) => {
      const pA = calculateBackgroundPriority(csUser, a.target).priorityScore;
      const pB = calculateBackgroundPriority(csUser, b.target).priorityScore;
      return pB - pA;
    });

    expect(sorted[0].title).toBe('National CS Algorithmic Grand Prix');
    expect(sorted[1].title).toBe('Logic Deduction Olympiad');
    expect(sorted[2].title).toBe('FinTech Optimization');
  });

  it('demonstrates two-way Elo fluctuation: drops on poor performance and climbs on high performance', () => {
    // 1500 rated player in 1500 benchmark contest
    // Scenario 1: High performance (100% score) -> rating increases
    const highPerf = calculateContestRatingDelta({
      currentCompetitiveElo: 1500,
      benchmarkRating: 1500,
      score: 300,
      totalMarks: 300,
      timeTakenSeconds: 1200,
      totalDurationSeconds: 2700,
      totalContestsPlayed: 10,
    });
    expect(highPerf.delta).toBeGreaterThan(0);
    expect(highPerf.newCompetitiveElo).toBeGreaterThan(1500);

    // Scenario 2: Poor performance (0 score / failed problems) -> rating drops
    const poorPerf = calculateContestRatingDelta({
      currentCompetitiveElo: 1500,
      benchmarkRating: 1500,
      score: 0,
      totalMarks: 300,
      timeTakenSeconds: 2600,
      totalDurationSeconds: 2700,
      totalContestsPlayed: 10,
    });
    expect(poorPerf.delta).toBeLessThan(0);
    expect(poorPerf.newCompetitiveElo).toBeLessThan(1500);
  });

  it('calculates composite Elo with course completion bonus and solved problems bonus', () => {
    // Student with competitive Elo 1420, 3 completed courses, 25 solved problems
    const composite = calculateCompositeElo({
      competitiveElo: 1420,
      completedCoursesCount: 3,
      problemsSolved: 25,
    });

    // 3 * 25 = 75 course bonus
    expect(composite.courseBonus).toBe(75);
    // 25 * 2 = 50 problems bonus
    expect(composite.problemsBonus).toBe(50);
    // Total = 1420 + 75 + 50 = 1545
    expect(composite.compositeElo).toBe(1545);
    expect(composite.tier.tier).toBe('Specialist');
  });
});
