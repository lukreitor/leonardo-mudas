import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  setISOWeek,
  setISOWeekYear,
  format,
  parseISO,
  addWeeks,
  subWeeks,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type WeekRef = { year: number; week: number };

export function currentWeek(now: Date = new Date()): WeekRef {
  return { year: getISOWeekYear(now), week: getISOWeek(now) };
}

export function weekBounds(ref: WeekRef): { start: Date; end: Date } {
  const base = setISOWeek(setISOWeekYear(new Date(), ref.year), ref.week);
  return { start: startOfISOWeek(base), end: endOfISOWeek(base) };
}

export function weekKey(ref: WeekRef): string {
  return `${ref.year}-W${String(ref.week).padStart(2, '0')}`;
}

export function weekLabel(ref: WeekRef): string {
  const { start, end } = weekBounds(ref);
  const startDay = format(start, 'd', { locale: ptBR });
  const endDay = format(end, 'd', { locale: ptBR });
  const month = format(end, 'MMM', { locale: ptBR });
  return `${startDay} – ${endDay} ${month}`;
}

export function shiftWeek(ref: WeekRef, delta: number): WeekRef {
  const { start } = weekBounds(ref);
  const shifted = delta >= 0 ? addWeeks(start, delta) : subWeeks(start, Math.abs(delta));
  return currentWeek(shifted);
}

export function totalWeeksInYear(year: number): number {
  const dec28 = new Date(year, 11, 28);
  return getISOWeek(dec28);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysOverdue(dueISO: string, now: Date = new Date()): number {
  return differenceInDays(now, parseISO(dueISO));
}

export function formatDayLong(d: Date): string {
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatTime(d: Date): string {
  return format(d, 'HH:mm');
}
