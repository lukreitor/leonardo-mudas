import { farmsRepo } from '../repositories/farms';
import { paymentsRepo } from '../repositories/payments';
import { farmsService } from './farms';

export const maintenanceService = {
  async runStartupChecks(): Promise<{ createdMonthly: number; markedOverdue: number; purgedTrash: number }> {
    const now = new Date();
    let createdMonthly = 0;

    const purgedTrash = await farmsService.purgeExpiredTrash();

    const farms = await farmsRepo.listActive();
    for (const f of farms) {
      if (
        (f.paymentType === 'monthly' || f.paymentType === 'mixed') &&
        f.monthlyAmount &&
        f.monthlyDueDay
      ) {
        const dueDay = Math.min(Math.max(f.monthlyDueDay, 1), 28);
        if (now.getDate() < dueDay) continue;

        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
        const exists = await paymentsRepo.existsForFarmAndDueMonth(
          f.id,
          dueDate.getFullYear(),
          dueDate.getMonth() + 1,
          'monthly'
        );
        if (exists) continue;

        await paymentsRepo.create({
          farmId: f.id,
          amount: f.monthlyAmount,
          kind: 'monthly',
          status: 'pending',
          dueDate: dueDate.toISOString(),
        });
        createdMonthly++;
      }
    }

    const markedOverdue = await paymentsRepo.markPendingAsOverdue(now.toISOString());

    return { createdMonthly, markedOverdue, purgedTrash };
  },
};
