import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { weeks, type Week } from '../db/schema';
import { weekBounds, type WeekRef } from '../lib/date';

export const weeksRepo = {
  async findOrCreate(ref: WeekRef): Promise<Week> {
    const existing = await db
      .select()
      .from(weeks)
      .where(and(eq(weeks.year, ref.year), eq(weeks.weekNumber, ref.week)))
      .limit(1);

    if (existing[0]) return existing[0];

    const { start, end } = weekBounds(ref);
    const [created] = await db
      .insert(weeks)
      .values({
        year: ref.year,
        weekNumber: ref.week,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
      .returning();
    return created;
  },
};
