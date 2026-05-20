import { farmsRepo } from '../repositories/farms';
import { visitsRepo, skippedRepo } from '../repositories/visits';
import { weeksRepo } from '../repositories/weeks';
import { paymentsRepo } from '../repositories/payments';
import { currentWeek, type WeekRef } from '../lib/date';
import { isFarmActiveThisWeek } from '../lib/frequency';
import type { Farm, Visit } from '../db/schema';
import type { FarmStatus } from '../lib/contracts';

export type FarmWithStatus = Farm & {
  status: FarmStatus;
  visitId?: number;
  skippedId?: number;
};

export const visitsService = {
  async getFarmsForWeek(ref: WeekRef = currentWeek()): Promise<{
    week: Awaited<ReturnType<typeof weeksRepo.findOrCreate>>;
    farms: FarmWithStatus[];
    counts: { visited: number; skipped: number; pending: number; total: number };
    visitedDays: number[];
  }> {
    const week = await weeksRepo.findOrCreate(ref);
    const farms = await farmsRepo.listActive();
    const visits = await visitsRepo.listByWeek(week.id);
    const skipped = await skippedRepo.listByWeek(week.id);

    const visitMap = new Map(visits.map((v) => [v.farmId, v]));
    const skippedMap = new Map(skipped.map((s) => [s.farmId, s]));

    const result = farms
      .filter((f) => isFarmActiveThisWeek(f, ref) || visitMap.has(f.id))
      .map((f): FarmWithStatus => {
        if (visitMap.has(f.id)) return { ...f, status: 'visited', visitId: visitMap.get(f.id)!.id };
        if (skippedMap.has(f.id)) return { ...f, status: 'skipped', skippedId: skippedMap.get(f.id)!.id };
        return { ...f, status: 'pending' };
      });

    const visited = result.filter((r) => r.status === 'visited').length;
    const skippedC = result.filter((r) => r.status === 'skipped').length;
    const pending = result.filter((r) => r.status === 'pending').length;
    const total = result.length - skippedC;

    const visitedDays = Array.from(
      new Set(
        visits
          .map((v) => {
            const d = new Date(v.visitedDate);
            return (d.getDay() + 6) % 7; // ISO day of week 0=Mon ... 6=Sun
          })
      )
    );

    return {
      week,
      farms: result,
      counts: { visited, skipped: skippedC, pending, total },
      visitedDays,
    };
  },

  async markVisited(farmId: number, ref: WeekRef = currentWeek()): Promise<Visit> {
    const week = await weeksRepo.findOrCreate(ref);
    const farm = await farmsRepo.getById(farmId);
    if (!farm) throw new Error('Farm not found');

    const existingSkip = await skippedRepo.getByFarmAndWeek(farmId, week.id);
    if (existingSkip) await skippedRepo.unskip(farmId, week.id);

    const visit = await visitsRepo.mark(farmId, week.id);

    if (farm.paymentType === 'visit' || farm.paymentType === 'mixed') {
      if (farm.visitAmount && farm.visitAmount > 0) {
        const existing = await paymentsRepo.listByFarm(farmId);
        const { start, end } = (await import('../lib/date')).weekBounds(ref);
        const hasPendingThisWeek = existing.some((p) => {
          if (p.kind !== 'visit') return false;
          if (p.status !== 'pending' && p.status !== 'overdue') return false;
          const created = new Date(p.createdAt ?? new Date().toISOString());
          return created >= start && created <= end;
        });
        if (!hasPendingThisWeek) {
          await paymentsRepo.create({
            farmId,
            amount: farm.visitAmount,
            kind: 'visit',
            status: 'pending',
          });
        }
      }
    }

    return visit;
  },

  async unmarkVisited(farmId: number, ref: WeekRef = currentWeek()): Promise<void> {
    const week = await weeksRepo.findOrCreate(ref);
    await visitsRepo.unmark(farmId, week.id);
  },

  async skipWeek(farmId: number, ref: WeekRef = currentWeek()): Promise<void> {
    const week = await weeksRepo.findOrCreate(ref);
    const existingVisit = await visitsRepo.getByFarmAndWeek(farmId, week.id);
    if (existingVisit) await visitsRepo.unmark(farmId, week.id);
    const existingSkip = await skippedRepo.getByFarmAndWeek(farmId, week.id);
    if (existingSkip) return;
    await skippedRepo.skip(farmId, week.id, 'manual');
  },

  async unskipWeek(farmId: number, ref: WeekRef = currentWeek()): Promise<void> {
    const week = await weeksRepo.findOrCreate(ref);
    await skippedRepo.unskip(farmId, week.id);
  },

  async cycleStatus(
    farmId: number,
    currentStatus: FarmStatus,
    intent: 'tap' | 'longpress',
    ref: WeekRef = currentWeek()
  ): Promise<FarmStatus> {
    if (intent === 'tap') {
      if (currentStatus === 'visited') {
        await this.unmarkVisited(farmId, ref);
        return 'pending';
      }
      if (currentStatus === 'skipped') {
        await this.unskipWeek(farmId, ref);
        return 'pending';
      }
      await this.markVisited(farmId, ref);
      return 'visited';
    }
    if (currentStatus === 'skipped') {
      await this.unskipWeek(farmId, ref);
      return 'pending';
    }
    await this.skipWeek(farmId, ref);
    return 'skipped';
  },
};
