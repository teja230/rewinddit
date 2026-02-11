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
  leaderboards: {
    dailyTop: LeaderboardEntry[];
    allTimeTop: LeaderboardEntry[];
  };
};

// ── GET /api/leaderboards ──
export type LeaderboardsResponse = {
  date: string;
  dailyTop: LeaderboardEntry[];
  allTimeTop: LeaderboardEntry[];
};

// ── Error response ──
export type ErrorResponse = {
  status: 'error';
  message: string;
};
