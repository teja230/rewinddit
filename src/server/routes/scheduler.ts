import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import { generateDailyPuzzle, getTodayUTC } from '../core/puzzle';
import { K } from '../core/redisKeys';

export const scheduler = new Hono();

// Called daily at 00:00 UTC by Devvit scheduler (and manually for testing)
scheduler.post('/rewinddit-daily-seed', async (c) => {
  try {
    const today = getTodayUTC();
    const key = K.puzzle(today);

    const existing = await redis.get(key);
    if (existing) {
      return c.json({ status: 'ok', message: 'Puzzle already exists', date: today });
    }

    const puzzle = generateDailyPuzzle(today);
    await redis.set(key, JSON.stringify(puzzle));

    return c.json({
      status: 'ok',
      message: 'Puzzle created',
      date: today,
      momentIds: puzzle.momentIds,
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return c.json({ status: 'error', message: 'Failed to seed puzzle' }, 500);
  }
});
