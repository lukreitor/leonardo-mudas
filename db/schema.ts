import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  biometricEnabled: integer('biometric_enabled', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const farms = sqliteTable('farms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  ownerPhone: text('owner_phone'),
  address: text('address'),
  lat: real('lat'),
  lng: real('lng'),
  sizeHa: real('size_ha'),
  colorToken: text('color_token'),
  notes: text('notes'),

  paymentType: text('payment_type').$type<'visit' | 'monthly' | 'commission' | 'mixed' | 'none'>().default('none'),
  visitAmount: real('visit_amount'),
  monthlyAmount: real('monthly_amount'),
  monthlyDueDay: integer('monthly_due_day'),
  commissionPct: real('commission_pct'),

  visitFrequency: text('visit_frequency').$type<'weekly' | 'biweekly' | 'monthly' | 'custom'>().default('weekly'),
  visitWeekOfMonth: integer('visit_week_of_month'),
  visitBiweeklyParity: text('visit_biweekly_parity').$type<'even' | 'odd'>(),

  deletedAt: text('deleted_at'),
  trashedAt: text('trashed_at'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const weeks = sqliteTable('weeks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  weekNumber: integer('week_number').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
});

export const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  farmId: integer('farm_id').notNull().references(() => farms.id),
  weekId: integer('week_id').notNull().references(() => weeks.id),
  visitedDate: text('visited_date').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const skippedVisits = sqliteTable('skipped_visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  farmId: integer('farm_id').notNull().references(() => farms.id),
  weekId: integer('week_id').notNull().references(() => weeks.id),
  reason: text('reason').$type<'manual' | 'auto_frequency'>().notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  visitId: integer('visit_id').notNull().references(() => visits.id),
  title: text('title'),
  kind: text('kind').$type<'growth' | 'water' | 'soil' | 'talk' | 'other'>().default('other'),
  noteText: text('note_text'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  noteId: integer('note_id').notNull().references(() => notes.id),
  type: text('type').$type<'audio' | 'photo' | 'video'>().notNull(),
  filePath: text('file_path').notNull(),
  durationSec: real('duration_sec'),
  transcript: text('transcript'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  farmId: integer('farm_id').notNull().references(() => farms.id),
  amount: real('amount').notNull(),
  kind: text('kind').$type<'visit' | 'monthly' | 'commission'>().notNull(),
  status: text('status').$type<'pending' | 'paid' | 'overdue' | 'cancelled'>().notNull().default('pending'),
  dueDate: text('due_date'),
  paidDate: text('paid_date'),
  saleAmount: real('sale_amount'),
  pct: real('pct'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableName: text('table_name').notNull(),
  rowId: integer('row_id').notNull(),
  op: text('op').$type<'insert' | 'update' | 'delete'>().notNull(),
  synced: integer('synced', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export type Farm = typeof farms.$inferSelect;
export type NewFarm = typeof farms.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type SkippedVisit = typeof skippedVisits.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Week = typeof weeks.$inferSelect;
