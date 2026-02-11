// ── Moment categories ──
export type MomentCategory =
  | 'legendary_comment'
  | 'platform_event'
  | 'meme'
  | 'controversy'
  | 'subreddit_moment'
  | 'viral_post';

// ── Public moment (what the client sees before reveal) ──
export type MomentPrompt = {
  id: string;
  category: MomentCategory;
  promptTitle: string;
  promptTextRedacted: string;
};

// ── GET /api/puzzle/today ──
export type PuzzleTodayResponse = {
  date: string;
  minYear: number;
  maxYear: number;
  moments: MomentPrompt[];
  hasPlayed: boolean;
  previousResult?: SubmitResult | undefined;
  currentUser: string;
  postUrl: string;
  playerCount: number;
};

// ── POST /api/submit ──
export type SubmitRequest = {
  date: string;
  guessesById: Record<string, number>;
};

export type QuestionResult = {
  id: string;
  promptTitle: string;
  guess: number;
  actual: number;
  delta: number;
  points: number;
  revealContext: string;
  revealLink?: string | undefined;
};

export type QuestionDifficulty = {
  id: string;
  plays: number;
  exactPercent: number;
  avgDelta: number;
};

export type Achievement = {
  id: string;
  title: string;
  emoji: string;
  description: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  score: number;
};

export type SubmitResult = {
  date: string;
  perQuestion: QuestionResult[];
  totalScore: number;
  streak: number;
  bestStreak: number;
  dailyRank?: number | undefined;
  percentile: number;
  streakMilestone?: number | undefined;
  newAchievements: Achievement[];
  questionDifficulty: QuestionDifficulty[];
  leaderboards: {
    dailyTop: LeaderboardEntry[];
    allTimeTop: LeaderboardEntry[];
    monthlyTop: LeaderboardEntry[];
  };
};

// ── GET /api/leaderboards ──
export type LeaderboardsResponse = {
  date: string;
  dailyTop: LeaderboardEntry[];
  allTimeTop: LeaderboardEntry[];
  monthlyTop: LeaderboardEntry[];
  playerCount: number;
};

// ── User stats ──
export type UserStats = {
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  bestStreak: number;
  achievements: Achievement[];
};

// ── Hint ──
export type HintResponse = {
  momentId: string;
  hint: string;
  pointsCost: number;
};

// ── Error response ──
export type ErrorResponse = {
  status: 'error';
  message: string;
};
