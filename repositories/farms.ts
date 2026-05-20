import { eq, isNull, isNotNull, asc } from 'drizzle-orm';
import { db } from '../db/client';
import { farms, type Farm, type NewFarm } from '../db/schema';

export const farmsRepo = {
  async listActive(): Promise<Farm[]> {
    return db.select().from(farms).where(isNull(farms.deletedAt)).orderBy(asc(farms.id));
  },

  async listDeactivated(): Promise<Farm[]> {
    return db.select().from(farms).where(isNotNull(farms.deletedAt));
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
