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

const DEFAULT_COMMISSION_PCT = 5;
const DEFAULT_VISIT_AMOUNT = 250;

export const SEED_CONFIG: SeedConfig[] = [
  { name: 'Marcos', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Evandro Maniçoba', paymentType: 'monthly', monthlyAmount: 500, monthlyDueDay: 2 },
  { name: 'Luciano', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Gonsalo', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Erick', paymentType: 'monthly', monthlyAmount: 400, monthlyDueDay: 18 },
  { name: 'João Edson', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Nininho', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Wilson', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Bier', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Damião', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Davi Terra Dura', paymentType: 'monthly', monthlyAmount: 200, monthlyDueDay: 1 },
  { name: 'Davi Ilha', paymentType: 'monthly', monthlyAmount: 500, monthlyDueDay: 5 },
  { name: 'Marcelino', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Igor e Ricardo', paymentType: 'commission', commissionPct: DEFAULT_COMMISSION_PCT },
  { name: 'Chicão', paymentType: 'monthly', monthlyAmount: 450, monthlyDueDay: 1 },
  { name: 'Jeová', paymentType: 'monthly', monthlyAmount: 350, monthlyDueDay: 17 },
  { name: 'Ribeiro Lote 1', paymentType: 'monthly', monthlyAmount: 250, monthlyDueDay: 1 },
  { name: 'Ribeiro Lote 2', paymentType: 'monthly', monthlyAmount: 250, monthlyDueDay: 1 },
  { name: 'Ribeiro Lote 3', paymentType: 'none' },
  { name: 'Patricia', paymentType: 'monthly', monthlyAmount: 200, monthlyDueDay: 1 },
  { name: 'Vagner', paymentType: 'visit', visitAmount: DEFAULT_VISIT_AMOUNT },
  { name: 'Leandro', paymentType: 'visit', visitAmount: DEFAULT_VISIT_AMOUNT },
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
