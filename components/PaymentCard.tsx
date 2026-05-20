import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { formatStructure } from '@/services/payments';
import type { Farm } from '@/db/schema';

type Props = {
  farm: Farm;
  receivedMonth: number;
  status: 'paid' | 'pending' | 'overdue' | 'none';
};

export function PaymentCard({ farm, receivedMonth, status }: Props) {
  const router = useRouter();
  const struct = formatStructure(farm);

  const statusLabel = status === 'paid'
    ? 'Pago este mês'
    : status === 'pending'
      ? 'Pendente'
      : status === 'overdue'
        ? 'Atrasado'
        : 'Sem cobrança definida';

  const statusColor = status === 'paid'
    ? colors.broto
    : status === 'pending'
      ? colors.mangaDeep
      : status === 'overdue'
        ? colors.danger
        : colors.ink3;

  return (
    <Pressable style={styles.card} onPress={() => router.push('/(tabs)/financial' as any)}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={16} color={colors.broto} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Pagamento</Text>
          <Text style={styles.structure}>{struct}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.bottomLabel}>Recebido este mês</Text>
          <Text style={styles.amount}>
            <Text style={styles.currency}>R$ </Text>
            {receivedMonth.toFixed(0)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neblina,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(74,124,89,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.uiSemibold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  structure: {
    fontFamily: fonts.uiSemibold,
    fontSize: 13,
    color: colors.ink1,
    marginTop: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(26,58,46,0.08)',
    marginVertical: 12,
  },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bottomLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.ink3,
    marginBottom: 2,
  },
  amount: { fontFamily: fonts.display, fontSize: 22, color: colors.mata, letterSpacing: -0.4 },
  currency: { fontSize: 12, opacity: 0.55 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: {
    fontFamily: fonts.uiSemibold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
