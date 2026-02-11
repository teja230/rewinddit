export const KEY_PREFIX = 'rewinddittt';

export const K = {
  puzzle: (date: string) => `${KEY_PREFIX}:puzzle:${date}`,
  play: (date: string, userId: string) => `${KEY_PREFIX}:play:${date}:${userId}`,
  lastPlayed: (userId: string) => `${KEY_PREFIX}:user:${userId}:lastPlayed`,
  streak: (userId: string) => `${KEY_PREFIX}:user:${userId}:streak`,
  bestStreak: (userId: string) => `${KEY_PREFIX}:user:${userId}:bestStreak`,
  stats: (userId: string) => `${KEY_PREFIX}:user:${userId}:stats`,
  userName: (userId: string) => `${KEY_PREFIX}:user:${userId}:name`,
  bestScore: (userId: string) => `${KEY_PREFIX}:user:${userId}:bestScore`,
  achievements: (userId: string) => `${KEY_PREFIX}:user:${userId}:achievements`,
  hintsUsed: (date: string, userId: string) => `${KEY_PREFIX}:hints:${date}:${userId}`,
  dailyLb: (date: string) => `${KEY_PREFIX}:lb:daily:${date}`,
  monthlyLb: (yearMonth: string) => `${KEY_PREFIX}:lb:monthly:${yearMonth}`,
  allTimeLb: `${KEY_PREFIX}:lb:alltime`,
  /** Per-question difficulty stats: hash with fields plays, exactCount, totalDelta */
  qStats: (date: string, momentId: string) => `${KEY_PREFIX}:qstats:${date}:${momentId}`,
} as const;
