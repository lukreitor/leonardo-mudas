import { eq, isNull, isNotNull, asc, and, sql, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { farms, type Farm, type NewFarm } from '../db/schema';

export const farmsRepo = {
  async listActive(): Promise<Farm[]> {
    return db
      .select()
      .from(farms)
      .where(and(isNull(farms.deletedAt), isNull(farms.trashedAt)))
      .orderBy(asc(farms.id));
  },

  async listDeactivated(): Promise<Farm[]> {
    return db
      .select()
      .from(farms)
      .where(and(isNotNull(farms.deletedAt), isNull(farms.trashedAt)));
  },

  async listTrashed(): Promise<Farm[]> {
    return db.select().from(farms).where(isNotNull(farms.trashedAt)).orderBy(asc(farms.trashedAt));
  },

  async moveToTrash(id: number): Promise<void> {
    await db.update(farms).set({ trashedAt: new Date().toISOString() }).where(eq(farms.id, id));
  },

  async restoreFromTrash(id: number): Promise<void> {
    await db.update(farms).set({ trashedAt: null }).where(eq(farms.id, id));
  },

  async purgeExpiredTrash(beforeISO: string): Promise<number[]> {
    const expired = await db
      .select({ id: farms.id })
      .from(farms)
      .where(and(isNotNull(farms.trashedAt), lt(farms.trashedAt, beforeISO)));
    return expired.map((r) => r.id);
  },

  async getById(id: number): Promise<Farm | null> {
    const result = await db.select().from(farms).where(eq(farms.id, id)).limit(1);
    return result[0] ?? null;
  },

  async create(data: NewFarm): Promise<Farm> {
    const [created] = await db.insert(farms).values(data).returning();
    return created;
  },

  async update(id: number, patch: Partial<NewFarm>): Promise<void> {
    await db.update(farms).set(patch).where(eq(farms.id, id));
  },

  async softDelete(id: number): Promise<void> {
    await db.update(farms).set({ deletedAt: new Date().toISOString() }).where(eq(farms.id, id));
  },

  async restore(id: number): Promise<void> {
    await db.update(farms).set({ deletedAt: null }).where(eq(farms.id, id));
  },

  async hardDelete(id: number): Promise<void> {
    await db.delete(farms).where(eq(farms.id, id));
  },
};
