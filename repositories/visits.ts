import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { visits, skippedVisits, type Visit, type SkippedVisit } from '../db/schema';

export const visitsRepo = {
  async getByFarmAndWeek(farmId: number, weekId: number): Promise<Visit | null> {
    const result = await db
      .select()
      .from(visits)
      .where(and(eq(visits.farmId, farmId), eq(visits.weekId, weekId)))
      .limit(1);
    return result[0] ?? null;
  },

  async mark(farmId: number, weekId: number, when: Date = new Date()): Promise<Visit> {
    const [created] = await db
      .insert(visits)
      .values({ farmId, weekId, visitedDate: when.toISOString() })
      .returning();
    return created;
  },

  async unmark(farmId: number, weekId: number): Promise<void> {
    await db.delete(visits).where(and(eq(visits.farmId, farmId), eq(visits.weekId, weekId)));
  },

  async listByWeek(weekId: number): Promise<Visit[]> {
    return db.select().from(visits).where(eq(visits.weekId, weekId));
  },

  async listByFarm(farmId: number): Promise<Visit[]> {
    return db.select().from(visits).where(eq(visits.farmId, farmId));
  },
};

export const skippedRepo = {
  async getByFarmAndWeek(farmId: number, weekId: number): Promise<SkippedVisit | null> {
    const result = await db
      .select()
      .from(skippedVisits)
      .where(and(eq(skippedVisits.farmId, farmId), eq(skippedVisits.weekId, weekId)))
      .limit(1);
    return result[0] ?? null;
  },

  async skip(farmId: number, weekId: number, reason: 'manual' | 'auto_frequency' = 'manual'): Promise<SkippedVisit> {
    const [created] = await db
      .insert(skippedVisits)
      .values({ farmId, weekId, reason })
      .returning();
    return created;
  },

  async unskip(farmId: number, weekId: number): Promise<void> {
    await db
      .delete(skippedVisits)
      .where(and(eq(skippedVisits.farmId, farmId), eq(skippedVisits.weekId, weekId)));
  },

  async listByWeek(weekId: number): Promise<SkippedVisit[]> {
    return db.select().from(skippedVisits).where(eq(skippedVisits.weekId, weekId));
  },
};
