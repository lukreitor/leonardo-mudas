import { farmColors } from '../../theme/colors';
import type { NewFarm } from '../schema';
import type { PaymentType } from '../../lib/contracts';

export type SeedConfig = {
  name: string;
  paymentType: PaymentType;
  monthlyAmount?: number;
  monthlyDueDay?: number;
  visitAmount?: number;
  commissionPct?: number;
};

export const SEED_CONFIG: SeedConfig[] = [
  { name: 'Marcos', paymentType: 'commission' },
  { name: 'Evandro Maniçoba', paymentType: 'monthly', monthlyAmount: 500, monthlyDueDay: 2 },
  { name: 'Luciano', paymentType: 'commission' },
  { name: 'Gonsalo', paymentType: 'commission' },
  { name: 'Erick', paymentType: 'monthly', monthlyAmount: 400, monthlyDueDay: 18 },
  { name: 'João Edson', paymentType: 'commission' },
  { name: 'Nininho', paymentType: 'commission' },
  { name: 'Wilson', paymentType: 'commission' },
  { name: 'Bier', paymentType: 'commission' },
  { name: 'Damião', paymentType: 'commission' },
  { name: 'Davi Terra Dura', paymentType: 'monthly', monthlyAmount: 200, monthlyDueDay: 1 },
  { name: 'Davi Ilha', paymentType: 'monthly', monthlyAmount: 500, monthlyDueDay: 5 },
  { name: 'Marcelino', paymentType: 'commission' },
  { name: 'Igor e Ricardo', paymentType: 'commission' },
  { name: 'Chicão', paymentType: 'monthly', monthlyAmount: 450, monthlyDueDay: 1 },
  { name: 'Jeová', paymentType: 'monthly', monthlyAmount: 350, monthlyDueDay: 17 },
  { name: 'Ribeiro Lote 1', paymentType: 'monthly', monthlyAmount: 250, monthlyDueDay: 1 },
  { name: 'Ribeiro Lote 2', paymentType: 'monthly', monthlyAmount: 250, monthlyDueDay: 1 },
  { name: 'Ribeiro Lote 3', paymentType: 'none' },
  { name: 'Patricia', paymentType: 'monthly', monthlyAmount: 200, monthlyDueDay: 1 },
  { name: 'Vagner', paymentType: 'visit' },
  { name: 'Leandro', paymentType: 'visit' },
];

export const SEED_FARMS: NewFarm[] = SEED_CONFIG.map((s, idx) => ({
  name: s.name,
  colorToken: farmColors[idx % farmColors.length],
  visitFrequency: 'weekly' as const,
  paymentType: s.paymentType,
  monthlyAmount: s.monthlyAmount ?? null,
  monthlyDueDay: s.monthlyDueDay ?? null,
  visitAmount: s.visitAmount ?? null,
  commissionPct: s.commissionPct ?? null,
}));
