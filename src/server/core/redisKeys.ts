export const KEY_PREFIX = 'rewinddittt';

export const K = {
  puzzle: (date: string) => `${KEY_PREFIX}:puzzle:${date}`,
  play: (date: string, userId: string) => `${KEY_PREFIX}:play:${date}:${userId}`,
  lastPlayed: (userId: string) => `${KEY_PREFIX}:user:${userId}:lastPlayed`,
  streak: (userId: string) => `${KEY_PREFIX}:user:${userId}:streak`,
  bestStreak: (userId: string) => `${KEY_PREFIX}:user:${userId}:bestStreak`,
  stats: (userId: string) => `${KEY_PREFIX}:user:${userId}:stats`,
  userName: (userId: string) => `${KEY_PREFIX}:user:${userId}:name`,
  dailyLb: (date: string) => `${KEY_PREFIX}:lb:daily:${date}`,
  allTimeLb: `${KEY_PREFIX}:lb:alltime`,
} as const;
