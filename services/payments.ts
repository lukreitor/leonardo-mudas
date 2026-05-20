import { paymentsRepo } from '../repositories/payments';
import { farmsRepo } from '../repositories/farms';
import type { Payment, Farm } from '../db/schema';
import type { PaymentKind } from '../lib/contracts';

export type PaymentWithFarm = Payment & { farm: Farm };

export type MonthlySummary = {
  receivedTotal: number;
  pendingTotal: number;
  overdueTotal: number;
  commissionTotal: number;
  upcomingMonthly: number;
  paidCount: number;
  commissionsCount: number;
  byFarm: { farm: Farm; receivedThisMonth: number; status: 'paid' | 'pending' | 'overdue' | 'none' }[];
};

function monthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export const paymentsService = {
  async lastSixMonths(year: number, month: number): Promise<{ year: number; month: number; total: number }[]> {
    const results: { year: number; month: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const paid = await paymentsRepo.listPaidInMonth(y, m);
      results.push({ year: y, month: m, total: paid.reduce((s, p) => s + p.amount, 0) });
    }
    return results;
  },

  async monthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const farms = await farmsRepo.listActive();
    const paidThisMonth = await paymentsRepo.listPaidInMonth(year, month);
    const pending = await paymentsRepo.listPending();
    const overdue = await paymentsRepo.listOverdue();

    const receivedTotal = paidThisMonth.reduce((s, p) => s + p.amount, 0);
    const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
    const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);
    const commissionTotal = paidThisMonth.filter((p) => p.kind === 'commission').reduce((s, p) => s + p.amount, 0);
    const upcomingMonthly = farms.reduce((s, f) => s + (f.monthlyAmount ?? 0), 0);

    const byFarmMap = new Map<number, number>();
    for (const p of paidThisMonth) {
      byFarmMap.set(p.farmId, (byFarmMap.get(p.farmId) ?? 0) + p.amount);
    }

    const overdueFarms = new Set(overdue.map((p) => p.farmId));
    const pendingFarms = new Set(pending.map((p) => p.farmId));

    const byFarm = farms.map((farm) => {
      const receivedThisMonth = byFarmMap.get(farm.id) ?? 0;
      const status = overdueFarms.has(farm.id)
        ? ('overdue' as const)
        : pendingFarms.has(farm.id)
          ? ('pending' as const)
          : receivedThisMonth > 0
            ? ('paid' as const)
            : ('none' as const);
      return { farm, receivedThisMonth, status };
    });

    return {
      receivedTotal,
      pendingTotal,
      overdueTotal,
      commissionTotal,
      upcomingMonthly,
      paidCount: paidThisMonth.length,
      commissionsCount: paidThisMonth.filter((p) => p.kind === 'commission').length,
      byFarm,
    };
  },

  async registerPayment(data: { farmId: number; amount: number; kind: PaymentKind; saleAmount?: number; pct?: number; notes?: string }) {
    return paymentsRepo.create({
      farmId: data.farmId,
      amount: data.amount,
      kind: data.kind,
      status: 'paid',
      paidDate: new Date().toISOString(),
      saleAmount: data.saleAmount,
      pct: data.pct,
      notes: data.notes,
    });
  },
};

export function formatStructure(farm: Farm): string {
  const parts: string[] = [];
  if (farm.paymentType === 'visit' || farm.paymentType === 'mixed') {
    if (farm.visitAmount) parts.push(`R$ ${farm.visitAmount}/visita`);
  }
  if (farm.paymentType === 'monthly' || farm.paymentType === 'mixed') {
    if (farm.monthlyAmount) parts.push(`R$ ${farm.monthlyAmount}/mês`);
  }
  if (farm.paymentType === 'commission' || farm.paymentType === 'mixed') {
    if (farm.commissionPct) parts.push(`${farm.commissionPct}% comissão`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Sem cobrança definida';
}
