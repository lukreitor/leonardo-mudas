import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { payments, type Payment } from '../db/schema';

export const paymentsRepo = {
  async listByFarm(farmId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.farmId, farmId));
  },

  async listPending(): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.status, 'pending'));
  },

  async listOverdue(): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.status, 'overdue'));
  },

  async listPaidInMonth(year: number, month: number): Promise<Payment[]> {
    const monthStr = String(month).padStart(2, '0');
    return db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'paid'),
          sql`strftime('%Y-%m', ${payments.paidDate}) = ${year + '-' + monthStr}`
        )
      );
  },

  async create(data: typeof payments.$inferInsert): Promise<Payment> {
    const [created] = await db.insert(payments).values(data).returning();
    return created;
  },

  async markPaid(id: number, paidDate: Date = new Date()): Promise<void> {
    await db
      .update(payments)
      .set({ status: 'paid', paidDate: paidDate.toISOString() })
      .where(eq(payments.id, id));
  },

  async cancel(id: number): Promise<void> {
    await db.update(payments).set({ status: 'cancelled' }).where(eq(payments.id, id));
  },

  async markOverdue(id: number): Promise<void> {
    await db.update(payments).set({ status: 'overdue' }).where(eq(payments.id, id));
  },
};
