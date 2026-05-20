import { db } from '../db/client';
import { meta, farms } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SEED_FARMS } from '../db/seeds/farms';

const SEED_KEY = 'seeded';

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db.select().from(meta).where(eq(meta.key, SEED_KEY)).limit(1);
  if (existing[0]?.value === 'true') return;

  await db.insert(farms).values(SEED_FARMS);
  await db
    .insert(meta)
    .values({ key: SEED_KEY, value: 'true' })
    .onConflictDoUpdate({ target: meta.key, set: { value: 'true' } });
}
