'use server';

import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Contest, { IContest } from '@/models/Contest';
import ContestSubmission from '@/models/ContestSubmission';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import {
  calculateContestRatingDelta,
  calculateCompositeElo,
  calculateBackgroundPriority,
  normalizeBackground,
} from '@/lib/elo';
import { revalidatePath } from 'next/cache';

/**
 * High-quality seed data for problem-solving contests across different disciplines
 */
const SAMPLE_CONTESTS = [
  {
    title: 'National Algorithmic & Complexity Grand Prix 2026',
    slug: 'national-algorithmic-grand-prix-2026',
    description:
      'The premier competitive programming and algorithmic problem-solving arena. Test your skills against complex dynamic programming, graph flow, graph vertex coloring, and amortized asymptotic complexity proofs.',
    shortSummary: 'High-stakes algorithmic duels, NP-hard approximations, and asymptotic optimizations.',
    category: 'Computer Science & Algorithms',
    targetBackgrounds: ['CSE', 'SWE'],
    difficulty: 'GRANDMASTER' as const,
    benchmarkRating: 1750,
    durationMinutes: 45,
    status: 'LIVE' as const,
    featuredOnHome: true,
    prizePool: '৳৫০,০০০ + Global Certificate',
    rules: [
      'LaTeX mathematical notation is used throughout questions.',
      'Performance directly alters your dynamic Elo rating (+/-).',
      'Time efficiency and minimal wrong attempts grant multiplier bonuses.',
    ],
    problems: [
      {
        id: 'p1',
        title: 'Problem A: Maximum Flow & Minimum Cut Asymptotic Bounds',
        statement:
          'Consider a directed capacitated network $G = (V, E)$ with source $s$ and sink $t$. When applying the Edmonds-Karp algorithm with Breadth-First Search (BFS) augmentation, what is the tight asymptotic upper bound on the maximum number of augmenting iterations before reaching maximum flow?',
        category: 'Graph Theory & Network Flow',
        difficultyRating: 1650,
        points: 100,
        options: [
          '$O(V \\cdot E)$ augmenting paths',
          '$O(V^2 \\cdot E)$ augmenting paths',
          '$O(E \\log V)$ augmenting paths',
          '$O(V \\log E)$ augmenting paths',
        ],
        correctAnswer: 0,
        explanation:
          'In the Edmonds-Karp algorithm, each shortest augmenting path is found via BFS. A critical edge cannot become critical more than $|V|/2$ times. Since there are $|E|$ edges, the maximum number of augmenting iterations is strictly bounded by $O(|V| \\cdot |E|)$. Overall time complexity is $O(|V| \\cdot |E|^2)$.',
      },
      {
        id: 'p2',
        title: 'Problem B: Dynamic Programming State Compression on Hamiltonian Graphs',
        statement:
          'Given a directed weighted graph with $n = 18$ vertices, you must find the minimum-cost Hamiltonian cycle visiting every vertex once. Which bitmask Dynamic Programming transition correctly represents reaching vertex $v$ with visited subset mask $S$ ($v \\in S$)?',
        category: 'Bitmask DP & Combinatorics',
        difficultyRating: 1800,
        points: 200,
        options: [
          '$dp[S][v] = \\min_{u \\in S, u \\neq v} \\{ dp[S \\setminus \\{v\\}][u] + \\text{weight}(u, v) \\}$',
          '$dp[S][v] = \\max_{u \\notin S} \\{ dp[S \\cup \\{u\\}][v] + \\text{weight}(u, v) \\}$',
          '$dp[S][v] = \\sum_{u \\in S} dp[S \\oplus 2^v][u] \\times \\text{weight}(u, v)$',
          '$dp[S][v] = dp[S][v-1] + \\min_{u \\in S} \\text{weight}(u, v)$',
        ],
        correctAnswer: 0,
        explanation:
          'The classic Held-Karp dynamic programming formulation for TSP uses $dp[S][v]$ denoting the minimum weight path visiting all vertices in mask $S$ ending at $v$. The previous state had visited set $S \\setminus \\{v\\}$ ending at some $u \\in S \\setminus \\{v\\}$. Thus: $dp[S][v] = \\min_{u \\in S, u \\neq v} \\{ dp[S \\setminus \\{v\\}][u] + \\text{weight}(u, v) \\}$.',
      },
      {
        id: 'p3',
        title: 'Problem C: Segment Tree with Lazy Propagation & Range Matrix Multiplications',
        statement:
          'You have an array of $2 \\times 2$ matrices. You need to support range matrix multiplication queries $[L, R]$ and range matrix affine update tags in $O(\\log N)$ time. Why is matrix multiplication valid for Segment Tree lazy propagation?',
        category: 'Advanced Data Structures',
        difficultyRating: 1950,
        points: 300,
        options: [
          'Because matrix multiplication is associative: $(A \\times B) \\times C = A \\times (B \\times C)$, allowing hierarchical tree merge and tag composition.',
          'Because matrix multiplication is commutative: $A \\times B = B \\times A$, so node order in the tree does not matter.',
          'Because every $2 \\times 2$ real matrix has non-zero determinant $\\det(M) \\neq 0$.',
          'Because Segment Trees only support scalar addition and multiplication.',
        ],
        correctAnswer: 0,
        explanation:
          'Matrix multiplication is strictly associative, which allows parent nodes to aggregate child answers $(L \\times R)$ correctly and lazy tags to be composed sequentially. It is NOT commutative, so ordering must be preserved during merges.',
      },
    ],
  },
  {
    title: 'Distributed Systems & High-Throughput Concurrency Battle',
    slug: 'distributed-systems-concurrency-battle',
    description:
      'Solve architectural bottleneck puzzles, Raft consensus split-brain mitigations, distributed locking race conditions, and vector clock ordering.',
    shortSummary: 'Raft consensus, vector clocks, Redis distributed locks, and database isolation levels.',
    category: 'Systems & Backend Architecture',
    targetBackgrounds: ['CSE', 'SWE', 'DATA_SCIENCE'],
    difficulty: 'ADVANCED' as const,
    benchmarkRating: 1600,
    durationMinutes: 40,
    status: 'LIVE' as const,
    featuredOnHome: true,
    prizePool: '৳৩৫,০০০ + Cloud Voucher',
    rules: [
      'Scenario-based systems design and edge-case detection.',
      'Scoring weighs correct latency minimization and failure mode tolerance.',
    ],
    problems: [
      {
        id: 'p1',
        title: 'Problem A: Raft Consensus Election Split & Quorum Preservation',
        statement:
          'In a 5-node Raft cluster, a network partition isolates Nodes $\{A, B\}$ from Nodes $\{C, D, E\}$. If a client submits a write request to Node $A$ (which was the previous Leader), what happens in Raft?',
        category: 'Distributed Consensus',
        difficultyRating: 1550,
        points: 120,
        options: [
          'Node $A$ accepts the write but cannot commit it because it cannot reach a majority quorum ($2 < 3$). Meanwhile, $\{C, D, E\}$ elect a new leader and commit new writes.',
          'Node $A$ immediately commits the write locally and sends an acknowledgment to the client.',
          'The entire cluster deadlocks and crashes until all 5 nodes regain full connectivity.',
          'Nodes $C, D, E$ step down and wait for Node $A$ to rejoin.',
        ],
        correctAnswer: 0,
        explanation:
          'In Raft, a leader must replicate log entries to a strict majority quorum (for $N=5$, quorum $\\lfloor 5/2 \\rfloor + 1 = 3$). Partition $\{A, B\}$ has size 2, so it cannot achieve consensus. The partition $\{C, D, E\}$ has size 3 and elects a new valid leader.',
      },
      {
        id: 'p2',
        title: 'Problem B: Snapshot Isolation vs Serializable Anomaly Detection',
        statement:
          'Consider two concurrent transactions under standard Snapshot Isolation (PostgreSQL repeatable read): Transaction 1 reads table $T$ where count of black balls $> 0$ and writes a white ball. Transaction 2 reads count of white balls $> 0$ and writes a black ball. What classic anomaly can occur?',
        category: 'Database Concurrency & ACID',
        difficultyRating: 1650,
        points: 180,
        options: [
          'Write Skew anomaly (each transaction fulfills integrity invariant independently, but serialized state violates it).',
          'Dirty Read anomaly (reading uncommitted memory buffer pages).',
          'Lost Update anomaly on identical primary key row lock.',
          'Phantom Deadlock cascade causing table corruption.',
        ],
        correctAnswer: 0,
        explanation:
          'Write Skew is the quintessential anomaly permitted by Snapshot Isolation that is disallowed under true Serializability. Both transactions read committed snapshots and update disjoint sets of rows based on overlapping premises.',
      },
    ],
  },
  {
    title: 'Applied Data Science & Machine Learning Optimization Arena',
    slug: 'applied-data-science-ml-arena',
    description:
      'Tackle high-dimensional regularization, gradient descent convergence proofs, eigenvalues in PCA dimensionality reduction, and transformer self-attention mechanisms.',
    shortSummary: 'Mathematical foundations of Deep Learning, Loss manifolds, and Attention complexity.',
    category: 'Data Science & AI',
    targetBackgrounds: ['DATA_SCIENCE', 'CSE', 'EEE'],
    difficulty: 'ADVANCED' as const,
    benchmarkRating: 1550,
    durationMinutes: 35,
    status: 'LIVE' as const,
    featuredOnHome: true,
    prizePool: '৳৩০,০০০ + GPU Credits',
    rules: [
      'Mathematical rigor in linear algebra and multivariate calculus.',
      'Elo points directly correlated with analytical derivation correctness.',
    ],
    problems: [
      {
        id: 'p1',
        title: 'Problem A: Scaled Dot-Product Attention Complexity Derivation',
        statement:
          'In the standard Transformer architecture with sequence length $N$ and embedding dimension $d_{model}$, why is the raw attention matrix computation $QK^T$ scaled by $\\frac{1}{\\sqrt{d_k}}$ before applying Softmax?',
        category: 'Deep Learning & NLP',
        difficultyRating: 1500,
        points: 150,
        options: [
          'To prevent dot products from growing excessively large for large $d_k$, which would push softmax into regions with vanishingly small gradients.',
          'To ensure the resulting attention matrix has determinant exactly equal to 1.',
          'To enforce orthogonal weight symmetry between Query and Value projections.',
          'To reduce matrix multiplication time complexity from $O(N^2)$ to $O(N \\log N)$.',
        ],
        correctAnswer: 0,
        explanation:
          'If $q$ and $k$ are independent random variables with mean 0 and variance 1, their dot product $q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i$ has mean 0 and variance $d_k$. As $d_k$ grows large, values explode, causing softmax gradients to vanish (saturation). Dividing by $\\sqrt{d_k}$ normalizes variance to 1.',
      },
    ],
  },
  {
    title: 'FinTech Quantitative Analytics & Algorithmic Optimization',
    slug: 'fintech-quantitative-analytics-optimization',
    description:
      'Quantitative modeling, capital asset pricing (CAPM), Black-Scholes partial differential equations, portfolio variance minimization, and algorithmic risk hedges.',
    shortSummary: 'Portfolio optimization, Sharpe ratio maximization, and derivative hedging.',
    category: 'FinTech & Quantitative Business',
    targetBackgrounds: ['BUSINESS', 'FINANCE', 'CSE'],
    difficulty: 'INTERMEDIATE' as const,
    benchmarkRating: 1450,
    durationMinutes: 30,
    status: 'LIVE' as const,
    featuredOnHome: true,
    prizePool: '৳২৫,০০০ + Certificate',
    rules: [
      'Financial quantitative optimization problems.',
      'Open to all business and quantitative students.',
    ],
    problems: [
      {
        id: 'p1',
        title: 'Problem A: Markowitz Mean-Variance Efficient Frontier Tangency',
        statement:
          'In modern portfolio theory, the portfolio on the efficient frontier that maximizes the Sharpe Ratio $S = \\frac{E[R_p] - R_f}{\\sigma_p}$ represents which fundamental economic concept?',
        category: 'Quantitative Finance & Portfolio Theory',
        difficultyRating: 1420,
        points: 150,
        options: [
          'The Tangency (Market) Portfolio formed by combining risk-free lending/borrowing with risky assets.',
          'The Global Minimum Variance Portfolio with zero covariance.',
          'The Maximum Beta portfolio on the Capital Asset Pricing line.',
          'A risk-neutral arbitrage butterfly spread position.',
        ],
        correctAnswer: 0,
        explanation:
          'Under the Capital Allocation Line (CAL), the optimal risky portfolio is the point of tangency between the CAL and the efficient frontier. It maximizes the slope (Sharpe ratio) and represents the Market Portfolio.',
      },
    ],
  },
  {
    title: 'National Logic Deduction & Algorithmic Aptitude Olympiad',
    slug: 'national-logic-deduction-olympiad',
    description:
      'Foundational problem-solving arena for students of ALL academic backgrounds. Tests discrete logic, combinatorics, pattern inference, and algorithmic reasoning without requiring prior programming experience.',
    shortSummary: 'General analytical reasoning, logical deduction, and discrete math puzzles.',
    category: 'General Logic & Analytical Deduction',
    targetBackgrounds: ['GENERAL', 'CSE', 'EEE', 'BUSINESS'],
    difficulty: 'BEGINNER' as const,
    benchmarkRating: 1300,
    durationMinutes: 30,
    status: 'LIVE' as const,
    featuredOnHome: true,
    prizePool: '৳২০,০০০ + Verified Skill Badge',
    rules: [
      'Open to students from every department and discipline.',
      'Universal logical reasoning and step-by-step deduplication.',
    ],
    problems: [
      {
        id: 'p1',
        title: 'Problem A: Pigeonhole Principle & Parity Invariant Deduction',
        statement:
          'In a room of 15 people, each person shakes hands with an arbitrary number of other people. Is it guaranteed that there exist at least two individuals who have shaken hands with the exact same number of people in the room?',
        category: 'Discrete Mathematics & Logic',
        difficultyRating: 1280,
        points: 100,
        options: [
          'Yes, by the Pigeonhole Principle, because possible degree counts {0 to 14} cannot simultaneously contain both 0 and 14.',
          'No, because 15 is an odd number and odd graphs cannot have equal degrees.',
          'Only if the graph is a complete bipartite tree.',
          'Only if everyone shakes hands at least twice.',
        ],
        correctAnswer: 0,
        explanation:
          'A person can shake between 0 and 14 hands. However, it is impossible for one person to have shaken 0 hands (isolated) while another person has shaken 14 hands (connected to everyone). Therefore, there are at most 14 distinct possible handshakes for 15 people. By the Pigeonhole Principle, at least two must match.',
      },
    ],
  },
];

/**
 * Seeds sample problem-solving contests and prioritized notifications
 */
export async function seedContestsAndNotificationsAction() {
  try {
    await dbConnect();

    // 1. Check or seed contests
    const existingContestsCount = await Contest.countDocuments();
    if (existingContestsCount === 0) {
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const contestData of SAMPLE_CONTESTS) {
        await Contest.create({
          ...contestData,
          startTime: now,
          endTime: inSevenDays,
          totalParticipants: Math.floor(Math.random() * 45) + 12,
        });
      }
    }

    // 2. Seed notifications for current user if logged in
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (userId) {
      let userQuery: any = { _id: userId };
      if (typeof userId === 'string' && userId.includes('@')) {
        userQuery = { email: userId };
      }
      const user = await User.findOne(userQuery);

      if (user) {
        const notifCount = await Notification.countDocuments({ recipientId: user._id });
        if (notifCount === 0) {
          const userBg = user.academicBackground || 'Computer Science & Engineering (CSE)';
          const userNormBg = normalizeBackground(userBg);

          const contests = await Contest.find().lean();
          for (const c of contests) {
            const priorityInfo = calculateBackgroundPriority(userBg, c.targetBackgrounds);
            const isCsStudent = userNormBg === 'CSE';
            const isCsContest = c.targetBackgrounds.includes('CSE') || c.targetBackgrounds.includes('SWE');

            let notifTitle = '';
            let notifMessage = '';

            if (priorityInfo.priority === 'HIGH') {
              notifTitle = `🔥 Priority Contest Alert: ${c.title}`;
              notifMessage = `This arena is prioritized at the top of your list as a top match for your ${userBg} curriculum. Register and boost your Elo!`;
            } else if (priorityInfo.priority === 'NORMAL') {
              notifTitle = `🌐 Open Arena Challenge: ${c.title}`;
              notifMessage = `A general problem-solving competition is live. Open for all backgrounds. Test your logical aptitude.`;
            } else {
              notifTitle = `📌 Open Contest Track: ${c.title}`;
              notifMessage = `This contest belongs to a different track (${c.category}), but you are welcome to participate in this open problem-solving challenge.`;
            }

            await Notification.create({
              recipientId: user._id,
              title: notifTitle,
              message: notifMessage,
              type: 'CONTEST_ANNOUNCEMENT',
              priority: priorityInfo.priority,
              priorityWeight: priorityInfo.priority === 'HIGH' ? 3 : priorityInfo.priority === 'NORMAL' ? 2 : 1,
              targetBackgrounds: c.targetBackgrounds,
              actionUrl: `/contests/${c.slug}`,
              badgeLabel: priorityInfo.badgeTextEn,
              isRead: false,
            });
          }
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in seedContestsAndNotificationsAction:', err);
    return { error: err.message };
  }
}

/**
 * Retrieves prioritized contests for the Homepage, taking student background into account.
 * CS students receive CS contests at the very top of their list!
 */
export async function getHomepageContestsAction(userBackground?: string) {
  try {
    await dbConnect();
    await seedContestsAndNotificationsAction();

    // If userBackground not provided directly, try resolving from authenticated session
    let effectiveBg = userBackground;
    if (!effectiveBg) {
      const session = await auth();
      const userId = (session?.user as any)?.id;
      if (userId) {
        let userQuery: any = { _id: userId };
        if (typeof userId === 'string' && userId.includes('@')) {
          userQuery = { email: userId };
        }
        const user = await User.findOne(userQuery).select('academicBackground').lean() as any;
        if (user?.academicBackground) {
          effectiveBg = user.academicBackground;
        }
      }
    }

    const contests = await Contest.find({ featuredOnHome: true })
      .sort({ createdAt: -1 })
      .lean();

    // Map contests with background matching and priority scores
    const enrichedContests = contests.map((c: any) => {
      const match = calculateBackgroundPriority(effectiveBg, c.targetBackgrounds);
      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortSummary: c.shortSummary,
        category: c.category,
        targetBackgrounds: c.targetBackgrounds,
        difficulty: c.difficulty,
        benchmarkRating: c.benchmarkRating,
        durationMinutes: c.durationMinutes,
        status: c.status,
        totalParticipants: c.totalParticipants,
        prizePool: c.prizePool,
        problemCount: c.problems?.length || 0,
        // Prioritization metrics
        priority: match.priority,
        priorityScore: match.priorityScore,
        badgeTextEn: match.badgeTextEn,
        badgeTextBn: match.badgeTextBn,
        isDirectMatch: match.isDirectMatch,
        matchReason: match.matchReason,
      };
    });

    // Sort strictly by priority score descending (Highest priority first!), then by benchmark rating
    enrichedContests.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.benchmarkRating - a.benchmarkRating;
    });

    return {
      success: true,
      userBackground: effectiveBg || 'Computer Science & Engineering (CSE)',
      contests: enrichedContests,
    };
  } catch (error: any) {
    console.error('Error fetching homepage contests:', error);
    return { error: 'কনটেস্টের তথ্য লোড করা যায়নি।' };
  }
}

/**
 * Retrieves all contests with optional category filtering
 */
export async function getContestsListAction(filterCategory?: string, userBackground?: string) {
  try {
    await dbConnect();
    await seedContestsAndNotificationsAction();

    let query: any = {};
    if (filterCategory && filterCategory !== 'ALL') {
      query.category = filterCategory;
    }

    const contests = await Contest.find(query).lean();

    const enriched = contests.map((c: any) => {
      const match = calculateBackgroundPriority(userBackground, c.targetBackgrounds);
      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortSummary: c.shortSummary,
        category: c.category,
        targetBackgrounds: c.targetBackgrounds,
        difficulty: c.difficulty,
        benchmarkRating: c.benchmarkRating,
        durationMinutes: c.durationMinutes,
        status: c.status,
        totalParticipants: c.totalParticipants,
        prizePool: c.prizePool,
        problemCount: c.problems?.length || 0,
        priority: match.priority,
        priorityScore: match.priorityScore,
        badgeTextEn: match.badgeTextEn,
        badgeTextBn: match.badgeTextBn,
        isDirectMatch: match.isDirectMatch,
      };
    });

    enriched.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      success: true,
      contests: enriched,
    };
  } catch (error: any) {
    console.error('Error fetching contests list:', error);
    return { error: 'কনটেস্ট তালিকা লোড ব্যর্থ হয়েছে।' };
  }
}

/**
 * Retrieves a single contest by its slug with problems sanitized for taking
 */
export async function getContestBySlugAction(slug: string, forSolving: boolean = false) {
  try {
    await dbConnect();
    await seedContestsAndNotificationsAction();

    const contest = await Contest.findOne({ slug }).lean() as any;
    if (!contest) {
      return { error: 'কনটেস্টটি পাওয়া যায়নি।' };
    }

    const session = await auth();
    const userId = (session?.user as any)?.id;
    let existingSubmission: any = null;

    if (userId) {
      let userQuery: any = { _id: userId };
      if (typeof userId === 'string' && userId.includes('@')) {
        userQuery = { email: userId };
      }
      const user = await User.findOne(userQuery).select('_id').lean() as any;
      if (user) {
        existingSubmission = await ContestSubmission.findOne({
          contestId: contest._id,
          studentId: user._id,
        }).lean();
      }
    }

    const formattedProblems = (contest.problems || []).map((p: any, idx: number) => ({
      id: p.id || `p_${idx}`,
      index: idx,
      title: p.title,
      statement: p.statement,
      category: p.category,
      difficultyRating: p.difficultyRating,
      points: p.points,
      options: p.options,
      sampleInputOutput: p.sampleInputOutput,
      // Only include correct answer and explanation if not in student solving mode
      ...(forSolving
        ? {}
        : {
            correctAnswer: p.correctAnswer,
            explanation: p.explanation,
          }),
    }));

    return {
      success: true,
      contest: {
        id: contest._id.toString(),
        title: contest.title,
        slug: contest.slug,
        description: contest.description,
        shortSummary: contest.shortSummary,
        category: contest.category,
        targetBackgrounds: contest.targetBackgrounds,
        difficulty: contest.difficulty,
        benchmarkRating: contest.benchmarkRating,
        durationMinutes: contest.durationMinutes,
        status: contest.status,
        totalParticipants: contest.totalParticipants,
        prizePool: contest.prizePool,
        rules: contest.rules || [],
        problems: formattedProblems,
      },
      hasSubmitted: !!existingSubmission,
      submission: existingSubmission
        ? {
            id: existingSubmission._id.toString(),
            totalScore: existingSubmission.totalScore,
            maxScore: existingSubmission.maxScore,
            accuracy: existingSubmission.accuracy,
            eloChange: existingSubmission.eloChange,
            previousCompetitiveElo: existingSubmission.previousCompetitiveElo,
            newCompetitiveElo: existingSubmission.newCompetitiveElo,
            newCompositeElo: existingSubmission.newCompositeElo,
            performanceSummary: existingSubmission.performanceSummary,
            submittedAt: existingSubmission.submittedAt?.toISOString(),
          }
        : null,
    };
  } catch (error: any) {
    console.error('Error fetching contest by slug:', error);
    return { error: 'কনটেস্টের বিবরণ পেতে সমস্যা হয়েছে।' };
  }
}

/**
 * Submits student answers for a contest, calculates actual vs expected score,
 * evaluates two-way Elo fluctuation (+ or -), updates cumulative bonuses, and logs rating history.
 */
export async function submitContestAction({
  contestSlug,
  answers,
  timeTakenSeconds,
}: {
  contestSlug: string;
  answers: Record<number, number>; // { [problemIndex]: selectedOptionIndex }
  timeTakenSeconds: number;
}) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) {
      return { error: 'উত্তর জমা দিতে লগইন আবশ্যক।' };
    }

    await dbConnect();

    let userQuery: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      userQuery = { email: sessionUserId };
    }

    const user = await User.findOne(userQuery);
    if (!user) {
      return { error: 'ইউজার অ্যাকাউন্ট পাওয়া যায়নি।' };
    }

    const contest = await Contest.findOne({ slug: contestSlug }).lean() as any;
    if (!contest) {
      return { error: 'কনটেস্টটি পাওয়া যায়নি।' };
    }

    // Evaluate problems
    let calculatedScore = 0;
    let maxPossibleScore = 0;
    let problemsSolvedCount = 0;
    const submissionAnswers: any[] = [];
    const problemsBreakdown: any[] = [];

    (contest.problems || []).forEach((p: any, idx: number) => {
      const selected = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selected === p.correctAnswer;
      const problemPoints = p.points || 100;
      maxPossibleScore += problemPoints;

      if (isCorrect) {
        calculatedScore += problemPoints;
        problemsSolvedCount += 1;
      }

      submissionAnswers.push({
        problemId: p.id || `p_${idx}`,
        problemIndex: idx,
        selectedOption: selected,
        isCorrect,
        timeSpentSeconds: Math.floor(timeTakenSeconds / Math.max(1, contest.problems.length)),
      });

      problemsBreakdown.push({
        index: idx,
        title: p.title,
        statement: p.statement,
        options: p.options,
        selectedOption: selected,
        correctAnswer: p.correctAnswer,
        isCorrect,
        explanation: p.explanation,
        points: problemPoints,
      });
    });

    const accuracy = maxPossibleScore > 0 ? Math.round((calculatedScore / maxPossibleScore) * 100) : 0;

    // Get current competitive Elo (default 1200)
    const currentCompetitiveElo = user.competitiveElo || 1200;

    // Total contests played by this user
    const totalContestsPlayed = await ContestSubmission.countDocuments({ studentId: user._id });

    // Calculate dynamic Elo Delta (Can be POSITIVE or NEGATIVE!)
    const ratingResult = calculateContestRatingDelta({
      currentCompetitiveElo,
      benchmarkRating: contest.benchmarkRating || 1500,
      score: calculatedScore,
      totalMarks: maxPossibleScore,
      timeTakenSeconds,
      totalDurationSeconds: (contest.durationMinutes || 45) * 60,
      totalContestsPlayed,
    });

    // Calculate completed courses count from database
    const completedCourses = await Enrollment.countDocuments({
      userId: user._id,
      paymentStatus: { $in: ['success', 'GRANTED', 'granted'] },
    });

    // Update cumulative problems solved
    const updatedProblemsSolved = (user.problemsSolved || 0) + problemsSolvedCount;

    // Calculate new Composite Elo (Competitive Elo + Completed Courses Bonus + Total Solved Problems Bonus)
    const compositeResult = calculateCompositeElo({
      competitiveElo: ratingResult.newCompetitiveElo,
      completedCoursesCount: completedCourses,
      problemsSolved: updatedProblemsSolved,
    });

    const previousCompositeElo = user.elo || 1200;
    const newCompositeElo = compositeResult.compositeElo;
    const netCompositeDelta = newCompositeElo - previousCompositeElo;

    // Save Contest Submission
    const submission = await ContestSubmission.create({
      contestId: contest._id,
      studentId: user._id,
      answers: submissionAnswers,
      totalScore: calculatedScore,
      maxScore: maxPossibleScore,
      accuracy,
      timeTakenSeconds,
      previousCompetitiveElo: currentCompetitiveElo,
      newCompetitiveElo: ratingResult.newCompetitiveElo,
      eloChange: ratingResult.delta,
      previousCompositeElo,
      newCompositeElo,
      problemsSolvedCount,
      performanceSummary: ratingResult.performanceSummary,
      submittedAt: new Date(),
    });

    // Increment contest participants count
    await Contest.findByIdAndUpdate(contest._id, { $inc: { totalParticipants: 1 } });

    // Update User Document with new Ratings & History
    const historyEntry = {
      date: new Date(),
      oldElo: previousCompositeElo,
      newElo: newCompositeElo,
      delta: netCompositeDelta,
      contestId: contest._id.toString(),
      contestTitle: contest.title,
      reason: `Contest: ${contest.title} (${ratingResult.delta >= 0 ? '+' : ''}${ratingResult.delta} competitive)`,
    };

    await User.findByIdAndUpdate(user._id, {
      $set: {
        competitiveElo: ratingResult.newCompetitiveElo,
        elo: newCompositeElo,
        problemsSolved: updatedProblemsSolved,
        completedCoursesCount: completedCourses,
      },
      $push: {
        eloHistory: historyEntry,
      },
    });

    // Create high-priority notification for the student about their rating change
    const deltaSign = netCompositeDelta >= 0 ? '+' : '';
    await Notification.create({
      recipientId: user._id,
      title: `📊 Elo Rating Update: ${deltaSign}${netCompositeDelta} Elo`,
      message: `${contest.title} সমাপ্ত হয়েছে! আপনার স্কোর: ${calculatedScore}/${maxPossibleScore} (${accuracy}%)। নতুন রেটিং: ${newCompositeElo} (${compositeResult.tier.titleEn})।`,
      type: 'ELO_UPDATE',
      priority: 'HIGH',
      priorityWeight: 3,
      actionUrl: `/contests/${contest.slug}`,
      badgeLabel: `${deltaSign}${netCompositeDelta} Elo`,
      isRead: false,
    });

    revalidatePath('/');
    revalidatePath('/student');
    revalidatePath('/student/settings');
    revalidatePath('/contests');
    revalidatePath(`/contests/${contest.slug}`);

    return {
      success: true,
      result: {
        submissionId: submission._id.toString(),
        score: calculatedScore,
        maxScore: maxPossibleScore,
        accuracy,
        timeTakenSeconds,
        ratingDelta: ratingResult.delta,
        netCompositeDelta,
        previousCompetitiveElo: currentCompetitiveElo,
        newCompetitiveElo: ratingResult.newCompetitiveElo,
        previousCompositeElo,
        newCompositeElo,
        tier: compositeResult.tier,
        courseBonus: compositeResult.courseBonus,
        problemsBonus: compositeResult.problemsBonus,
        expectedScore: ratingResult.expectedScore,
        actualPerformance: ratingResult.actualPerformance,
        performanceSummary: ratingResult.performanceSummary,
        problemsBreakdown,
      },
    };
  } catch (error: any) {
    console.error('Error submitting contest:', error);
    return { error: error.message || 'কনটেস্ট সাবমিট করতে সমস্যা হয়েছে।' };
  }
}
