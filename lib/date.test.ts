import { currentWeek, weekBounds, totalWeeksInYear, shiftWeek } from './date';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    throw new Error(`[FAIL] ${label} — expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);
  }
}

export function runDateTests(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  const tryCase = (label: string, fn: () => void) => {
    try { fn(); passed++; } catch (e: any) { failed++; errors.push(`${label}: ${e.message}`); }
  };

  tryCase('Dec 31 2025 ISO week (Wed) maps to week 1 of 2026', () => {
    const ref = currentWeek(new Date(2025, 11, 31));
    assertEqual(ref, { year: 2026, week: 1 }, 'Dec 31 2025');
  });

  tryCase('Jan 1 2026 ISO week 1', () => {
    const ref = currentWeek(new Date(2026, 0, 1));
    assertEqual(ref, { year: 2026, week: 1 }, 'Jan 1 2026');
  });

  tryCase('Dec 28 2025 (Sun) is week 52 of 2025', () => {
    const ref = currentWeek(new Date(2025, 11, 28));
    assertEqual(ref, { year: 2025, week: 52 }, 'Dec 28 2025');
  });

  tryCase('shiftWeek crossing year boundary', () => {
    const ref = shiftWeek({ year: 2025, week: 52 }, 1);
    assertEqual(ref, { year: 2026, week: 1 }, 'sem 52/2025 +1');
  });

  tryCase('shiftWeek back across year', () => {
    const ref = shiftWeek({ year: 2026, week: 1 }, -1);
    assertEqual(ref, { year: 2025, week: 52 }, 'sem 1/2026 -1');
  });

  tryCase('2020 has 53 ISO weeks (long year)', () => {
    const total = totalWeeksInYear(2020);
    assertEqual(total, 53, 'totalWeeksInYear(2020)');
  });

  tryCase('2026 has 53 weeks', () => {
    const total = totalWeeksInYear(2026);
    assertEqual(total, 53, 'totalWeeksInYear(2026)');
  });

  tryCase('weekBounds returns Mon-Sun', () => {
    const { start, end } = weekBounds({ year: 2026, week: 20 });
    const startDow = (start.getDay() + 6) % 7;
    const endDow = (end.getDay() + 6) % 7;
    assertEqual(startDow, 0, 'Monday start');
    assertEqual(endDow, 6, 'Sunday end');
  });

  return { passed, failed, errors };
}
