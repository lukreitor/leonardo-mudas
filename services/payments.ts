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
  yearTotal: number;
  paidCount: number;
  commissionsCount: number;
  byFarm: {
    farm: Farm;
    receivedThisMonth: number;
    status: 'paid' | 'pending' | 'overdue' | 'none';
    nextDueDate: string | null;
    nextDueLabel: string | null;
  }[];
};

function monthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export type PaymentWithFarmAndMonth = {
  payment: import('../db/schema').Payment;
  farm: Farm;
  ym: string; // 'YYYY-MM' for grouping
};

export const paymentsService = {
  async listAllWithFarm(status: 'pending' | 'overdue' | 'paid'): Promise<PaymentWithFarmAndMonth[]> {
    const farms = await farmsRepo.listActive();
    const farmMap = new Map(farms.map((f) => [f.id, f]));
    let payments: import('../db/schema').Payment[];
    if (status === 'overdue') payments = await paymentsRepo.listOverdue();
    else if (status === 'pending') payments = await paymentsRepo.listPending();
    else {
      const all = await Promise.all(farms.map((f) => paymentsRepo.listByFarm(f.id)));
      payments = all.flat().filter((p) => p.status === 'paid');
    }

    return payments
      .map((p) => {
        const farm = farmMap.get(p.farmId);
        if (!farm) return null;
        const dateStr = status === 'paid'
          ? (p.paidDate ?? p.createdAt ?? new Date().toISOString())
          : (p.dueDate ?? p.createdAt ?? new Date().toISOString());
        const d = new Date(dateStr);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return { payment: p, farm, ym };
      })
      .filter((x): x is PaymentWithFarmAndMonth => x !== null)
      .sort((a, b) => {
        const aRef = status === 'paid' ? a.payment.paidDate : a.payment.dueDate;
        const bRef = status === 'paid' ? b.payment.paidDate : b.payment.dueDate;
        return (bRef ?? '').localeCompare(aRef ?? '');
      });
  },

  async togglePaidMonthlyCurrent(farmId: number): Promise<'paid' | 'unpaid'> {
    const farm = await farmsRepo.getById(farmId);
    if (!farm) throw new Error('Fazenda não encontrada');
    if (
      (farm.paymentType !== 'monthly' && farm.paymentType !== 'mixed') ||
      !farm.monthlyAmount
    ) {
      throw new Error('Fazenda não é de pagamento mensal');
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const allFarmPayments = await paymentsRepo.listByFarm(farmId);
    const thisMonthMonthly = allFarmPayments.filter((p) => {
      if (p.kind !== 'monthly') return false;
      const ref = p.paidDate ?? p.dueDate ?? p.createdAt;
      if (!ref) return false;
      const d = new Date(ref);
      return d >= monthStart && d <= monthEnd;
    });

    const paidExisting = thisMonthMonthly.find((p) => p.status === 'paid');
    if (paidExisting) {
      await paymentsRepo.cancel(paidExisting.id);
      return 'unpaid';
    }

    const pendingExisting = thisMonthMonthly.find((p) => p.status === 'pending' || p.status === 'overdue');
    if (pendingExisting) {
      await paymentsRepo.markPaid(pendingExisting.id);
      return 'paid';
    }

    await paymentsRepo.create({
      farmId,
      amount: farm.monthlyAmount,
      kind: 'monthly',
      status: 'paid',
      paidDate: now.toISOString(),
      dueDate: new Date(now.getFullYear(), now.getMonth(), Math.min(farm.monthlyDueDay ?? 5, 28)).toISOString(),
    });
    return 'paid';
  },
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

    let yearTotal = 0;
    for (let m = 1; m <= 12; m++) {
      const paid = await paymentsRepo.listPaidInMonth(year, m);
      yearTotal += paid.reduce((s, p) => s + p.amount, 0);
    }

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

      const { nextDueDate, nextDueLabel } = computeNextDue(farm, status);
      return { farm, receivedThisMonth, status, nextDueDate, nextDueLabel };
    });

    return {
      receivedTotal,
      pendingTotal,
      overdueTotal,
      commissionTotal,
      upcomingMonthly,
      yearTotal,
      paidCount: paidThisMonth.length,
      commissionsCount: paidThisMonth.filter((p) => p.kind === 'commission').length,
      byFarm,
    };
  },

  async registerPayment(data: { farmId: number; amount: number; kind: PaymentKind; saleAmount?: number; pct?: number; notes?: string; paidDate?: Date }) {
    return paymentsRepo.create({
      farmId: data.farmId,
      amount: data.amount,
      kind: data.kind,
      status: 'paid',
      paidDate: (data.paidDate ?? new Date()).toISOString(),
      saleAmount: data.saleAmount,
      pct: data.pct,
      notes: data.notes,
    });
  },
};

function computeNextDue(
  farm: Farm,
  currentStatus: 'paid' | 'pending' | 'overdue' | 'none'
): { nextDueDate: string | null; nextDueLabel: string | null } {
  if ((farm.paymentType !== 'monthly' && farm.paymentType !== 'mixed') || !farm.monthlyDueDay) {
    if (farm.paymentType === 'visit' || farm.paymentType === 'commission') {
      return { nextDueDate: null, nextDueLabel: 'sob demanda' };
    }
    return { nextDueDate: null, nextDueLabel: null };
  }
  const now = new Date();
  const day = Math.min(Math.max(farm.monthlyDueDay, 1), 28);
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 1000 * 60 * 60 * 24;

  if (currentStatus === 'paid') {
    const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, day);
    const diffDays = Math.round((nextDue.getTime() - todayMs) / dayMs);
    return { nextDueDate: nextDue.toISOString(), nextDueLabel: `próx: vence em ${diffDays}d` };
  }

  const thisMonthDue = new Date(now.getFullYear(), now.getMonth(), day);
  const thisMonthDueMs = thisMonthDue.getTime();

  if (thisMonthDueMs < todayMs) {
    const overdueDays = Math.round((todayMs - thisMonthDueMs) / dayMs);
    return {
      nextDueDate: thisMonthDue.toISOString(),
      nextDueLabel: overdueDays === 1 ? '1d atrasado' : `${overdueDays}d atrasado`,
    };
  }

  const diffDays = Math.round((thisMonthDueMs - todayMs) / dayMs);
  const label = diffDays === 0
    ? 'vence hoje'
    : diffDays === 1
      ? 'vence amanhã'
      : `vence em ${diffDays}d`;
  return { nextDueDate: thisMonthDue.toISOString(), nextDueLabel: label };
}

export function formatStructure(farm: Farm): string {
  const parts: string[] = [];
  if (farm.paymentType === 'visit' || farm.paymentType === 'mixed') {
    parts.push(farm.visitAmount ? `R$ ${farm.visitAmount}/visita` : 'visita (sem valor)');
  }
  if (farm.paymentType === 'monthly' || farm.paymentType === 'mixed') {
    parts.push(farm.monthlyAmount ? `R$ ${farm.monthlyAmount}/mês` : 'mensal (sem valor)');
  }
  if (farm.paymentType === 'commission' || farm.paymentType === 'mixed') {
    parts.push(farm.commissionPct ? `${farm.commissionPct}% comissão` : 'comissão (sem %)');
  }
  if (parts.length > 0) return parts.join(' · ');
  if (farm.paymentType === 'none') return 'Sem cobrança definida';
  return 'Cobrança incompleta';
}
