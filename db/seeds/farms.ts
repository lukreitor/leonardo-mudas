import { farmColors } from '../../theme/colors';
import type { NewFarm } from '../schema';

export const SEED_FARMS: NewFarm[] = [
  'Marcos',
  'Evandro Maniçoba',
  'Luciano',
  'Gonsalo',
  'Erick',
  'João Edson',
  'Nininho',
  'Wilson',
  'Bier',
  'Damião',
  'Davi Terra Dura',
  'Davi Ilha',
  'Marcelino',
  'Igor e Ricardo',
  'Chicão',
  'Jeová',
  'Ribeiro Lote 1 e 2',
  'Ribeiro Lote 3',
].map((name, idx) => ({
  name,
  colorToken: farmColors[idx],
  visitFrequency: 'weekly' as const,
  paymentType: 'none' as const,
}));
