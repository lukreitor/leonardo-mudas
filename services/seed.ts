import { db } from '../db/client';
import { meta, farms } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { SEED_FARMS } from '../db/seeds/farms';

const SEED_KEY = 'seeded';

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db
    .select({ id: farms.id, name: farms.name })
    .from(farms)
    .where(isNull(farms.deletedAt));

  const existingNames = new Set(existing.map((f) => f.name.toLowerCase().trim()));
  const missing = SEED_FARMS.filter((f) => !existingNames.has(f.name.toLowerCase().trim()));

  if (missing.length > 0) {
    await db.insert(farms).values(missing);
  }

  await db
    .insert(meta)
    .values({ key: SEED_KEY, value: 'true' })
    .onConflictDoUpdate({ target: meta.key, set: { value: 'true' } });
}
