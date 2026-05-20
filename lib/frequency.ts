import type { Farm } from '../db/schema';
import type { WeekRef } from './date';

export function isFarmActiveThisWeek(farm: Farm, ref: WeekRef): boolean {
  const frequency = farm.visitFrequency ?? 'weekly';

  if (frequency === 'weekly') return true;

  if (frequency === 'biweekly') {
    const parity = farm.visitBiweeklyParity ?? 'odd';
    const isOddWeek = ref.week % 2 === 1;
    return (parity === 'odd' && isOddWeek) || (parity === 'even' && !isOddWeek);
  }

  if (frequency === 'monthly') {
    const targetWeekOfMonth = farm.visitWeekOfMonth ?? 1;
    const weekOfMonth = approxWeekOfMonth(ref.year, ref.week);
    return weekOfMonth === targetWeekOfMonth;
  }

  return true;
}

function approxWeekOfMonth(year: number, week: number): number {
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = (jan4.getDay() + 6) % 7;
  const week1Start = new Date(year, 0, 4 - jan4Dow);
  const targetWeekStart = new Date(week1Start);
  targetWeekStart.setDate(week1Start.getDate() + (week - 1) * 7);
  const dayOfMonth = targetWeekStart.getDate();
  return Math.ceil(dayOfMonth / 7);
}
