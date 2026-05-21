import { db } from '../db/client';
import { meta, farms } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { SEED_FARMS, SEED_CONFIG } from '../db/seeds/farms';

const SEED_KEY = 'seeded';
const PAYMENT_SEED_KEY = 'seed_payment_v2';

export async function runSeedIfNeeded(): Promise<void> {
  const existing = await db
    .select({
      id: farms.id,
      name: farms.name,
      paymentType: farms.paymentType,
      monthlyAmount: farms.monthlyAmount,
      monthlyDueDay: farms.monthlyDueDay,
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

      const updates: Record<string, any> = {};

      if (!existingFarm.paymentType || existingFarm.paymentType === 'none') {
        if (seed.paymentType !== 'none') {
          updates.paymentType = seed.paymentType;
        }
      }

      if (seed.monthlyAmount != null && existingFarm.monthlyAmount == null) {
        updates.monthlyAmount = seed.monthlyAmount;
      }
      if (seed.monthlyDueDay != null && existingFarm.monthlyDueDay == null) {
        updates.monthlyDueDay = seed.monthlyDueDay;
      }
      if (seed.visitAmount != null && existingFarm.visitAmount == null) {
        updates.visitAmount = seed.visitAmount;
      }
      if (seed.commissionPct != null && existingFarm.commissionPct == null) {
        updates.commissionPct = seed.commissionPct;
      }

      if (Object.keys(updates).length > 0) {
        await db.update(farms).set(updates).where(eq(farms.id, existingFarm.id));
      }
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
