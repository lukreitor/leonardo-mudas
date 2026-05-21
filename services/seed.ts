import { db } from '../db/client';
import { meta, farms } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { SEED_FARMS, SEED_CONFIG } from '../db/seeds/farms';

const SEED_KEY = 'seeded';
const PAYMENT_SEED_KEY = 'seed_payment_v1';

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db
    .select({
      id: farms.id,
      name: farms.name,
      paymentType: farms.paymentType,
      monthlyAmount: farms.monthlyAmount,
      visitAmount: farms.visitAmount,
      commissionPct: farms.commissionPct,
    })
    .from(farms)
    .where(isNull(farms.deletedAt));

  const existingByName = new Map(existing.map((f) => [f.name.toLowerCase().trim(), f]));

  const missing = SEED_FARMS.filter((f) => !existingByName.has(f.name.toLowerCase().trim()));
  if (missing.length > 0) {
    await db.insert(farms).values(missing);
  }

  const paymentSeedApplied = await db
    .select()
    .from(meta)
    .where(eq(meta.key, PAYMENT_SEED_KEY))
    .limit(1);

  if (paymentSeedApplied[0]?.value !== 'true') {
    for (const seed of SEED_CONFIG) {
      const existingFarm = existingByName.get(seed.name.toLowerCase().trim());
      if (!existingFarm) continue;

      const hasCustomization =
        (existingFarm.paymentType && existingFarm.paymentType !== 'none') ||
        existingFarm.monthlyAmount != null ||
        existingFarm.visitAmount != null ||
        existingFarm.commissionPct != null;

      if (hasCustomization) continue;

      await db
        .update(farms)
        .set({
          paymentType: seed.paymentType,
          monthlyAmount: seed.monthlyAmount ?? null,
          monthlyDueDay: seed.monthlyDueDay ?? null,
          visitAmount: seed.visitAmount ?? null,
          commissionPct: seed.commissionPct ?? null,
        })
        .where(eq(farms.id, existingFarm.id));
    }

    await db
      .insert(meta)
      .values({ key: PAYMENT_SEED_KEY, value: 'true' })
      .onConflictDoUpdate({ target: meta.key, set: { value: 'true' } });
  }

  await db
    .insert(meta)
    .values({ key: SEED_KEY, value: 'true' })
    .onConflictDoUpdate({ target: meta.key, set: { value: 'true' } });
}
