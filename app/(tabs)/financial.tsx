import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { paymentsService, formatStructure, type MonthlySummary } from '@/services/payments';
import { initialsOf } from '@/lib/initials';
import { Sparkline } from '@/components/Sparkline';
import { AmbientBg } from '@/components/AmbientBg';
import { useThemeColors } from '@/theme/hook';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function FinancialScreen() {
  const router = useRouter();
  const { colors: themeColors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabHeight = 56 + Math.max(insets.bottom, 12);
  const fabBottom = tabHeight + 16;
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [trend, setTrend] = useState<number[]>([]);
  const [prevMonthTotal, setPrevMonthTotal] = useState(0);

  const load = useCallback(async () => {
    const s = await paymentsService.monthlySummary(year, month);
    setSummary(s);
    const history = await paymentsService.lastSixMonths(year, month);
    setTrend(history.map((h) => h.total));
    setPrevMonthTotal(history.length >= 2 ? history[history.length - 2].total : 0);
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
  };

  if (!summary) return <View style={{ flex: 1, backgroundColor: colors.papel }} />;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.papel }]}>
      <AmbientBg variant="soft" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Financeiro</Text>
            <Pressable style={styles.searchBtn}>
              <Ionicons name="search" size={16} color={colors.mata} />
            </Pressable>
          </View>
          <View style={styles.monthPill}>
            <Pressable style={styles.monthArrow} onPress={() => shiftMonth(-1)}>
              <Ionicons name="chevron-back" size={14} color={colors.mata} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[month - 1]} · {year}
            </Text>
            <Pressable style={styles.monthArrow} onPress={() => shiftMonth(1)}>
              <Ionicons name="chevron-forward" size={14} color={colors.mata} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.mata, '#234737', '#2D5A47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Text style={styles.heroLabel}>Recebido este mês</Text>
          <Text style={styles.heroAmount}>
            <Text style={styles.currency}>R$ </Text>
            {formatMoney(summary.receivedTotal).split(',')[0]}
            <Text style={styles.cents}>,{formatMoney(summary.receivedTotal).split(',')[1] ?? '00'}</Text>
          </Text>
          <Text style={styles.heroSub}>
            {summary.paidCount} pagamentos · {summary.commissionsCount} comissões
          </Text>

          {prevMonthTotal > 0 ? (
            <View style={styles.trendChip}>
              <Ionicons
                name={summary.receivedTotal >= prevMonthTotal ? 'trending-up' : 'trending-down'}
                size={10}
                color="#B5D49B"
              />
              <Text style={styles.trendText}>
                {summary.receivedTotal >= prevMonthTotal ? '+' : ''}
                {(((summary.receivedTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(0)}
                % vs {MONTHS[(month - 2 + 12) % 12]}
              </Text>
            </View>
          ) : null}

          {trend.length > 0 ? (
            <View style={styles.sparkWrap}>
              <Sparkline values={trend} width={110} height={40} />
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.grid}>
          <Pressable
            style={styles.metric}
            onPress={() => router.push('/payments-list?filter=pending' as any)}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(232,160,76,0.15)' }]}>
              <Ionicons name="time-outline" size={14} color={colors.mangaDeep} />
            </View>
            <Text style={styles.metricLabel}>Pendente</Text>
            <Text style={styles.metricValue}>
              <Text style={styles.metricCurrency}>R$ </Text>
              {summary.pendingTotal.toFixed(0)}
            </Text>
            <Text style={styles.metricTapHint}>ver todos →</Text>
          </Pressable>

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(122,160,91,0.15)' }]}>
              <MaterialCommunityIcons name="percent" size={14} color={colors.casca} />
            </View>
            <Text style={styles.metricLabel}>Comissões</Text>
            <Text style={styles.metricValue}>
              <Text style={styles.metricCurrency}>R$ </Text>
              {summary.commissionTotal.toFixed(0)}
            </Text>
          </View>

          <Pressable
            style={styles.metric}
            onPress={() => router.push('/payments-list?filter=overdue' as any)}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(220,53,69,0.12)' }]}>
              <Ionicons name="warning-outline" size={14} color={colors.danger} />
            </View>
            <Text style={styles.metricLabel}>Atrasado</Text>
            <Text style={[styles.metricValue, summary.overdueTotal > 0 && { color: colors.danger }]}>
              <Text style={styles.metricCurrency}>R$ </Text>
              {summary.overdueTotal.toFixed(0)}
            </Text>
            <Text style={styles.metricTapHint}>ver todos →</Text>
          </Pressable>

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(26,58,46,0.1)' }]}>
              <Ionicons name="bar-chart-outline" size={14} color={colors.mata} />
            </View>
            <Text style={styles.metricLabel}>Total {year}</Text>
            <Text style={styles.metricValue}>
              <Text style={styles.metricCurrency}>R$ </Text>
              {summary.yearTotal.toFixed(0)}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.historyLink}
          onPress={() => router.push('/payments-list?filter=paid' as any)}>
          <Ionicons name="receipt-outline" size={16} color={colors.broto} />
          <Text style={styles.historyText}>Ver histórico completo de pagamentos</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Por fazenda</Text>
          <Text style={styles.sectionCount}>{summary.byFarm.length}</Text>
        </View>
        <Text style={styles.sectionHint}>
          Toque numa fazenda mensal para marcar/desmarcar pago
        </Text>

        <View style={styles.list}>
          {summary.byFarm.map((row, i) => {
            const isPending = row.status === 'pending';
            const isOverdue = row.status === 'overdue';
            const isPaid = row.status === 'paid';
            const isMonthly = row.farm.paymentType === 'monthly' || row.farm.paymentType === 'mixed';
            const onTap = isMonthly && row.farm.monthlyAmount
              ? async () => {
                  try {
                    const result = await paymentsService.togglePaidMonthlyCurrent(row.farm.id);
                    Haptics.notificationAsync(
                      result === 'paid'
                        ? Haptics.NotificationFeedbackType.Success
                        : Haptics.NotificationFeedbackType.Warning
                    );
                    load();
                  } catch (err: any) {
                    Alert.alert('Erro', err?.message ?? 'Não foi possível alternar');
                  }
                }
              : undefined;
            return (
              <Pressable
                key={row.farm.id}
                disabled={!onTap}
                onPress={onTap}
                style={[styles.row, (isPending || isOverdue) && styles.rowPending, isPaid && isMonthly && styles.rowPaidMonthly]}>
                <View style={[styles.avatar, { backgroundColor: row.farm.colorToken ?? farmColors[i % farmColors.length] }]}>
                  <Text style={styles.avatarText}>{initialsOf(row.farm.name)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowName}>{row.farm.name}</Text>
                  <Text style={styles.rowStruct}>{formatStructure(row.farm)}</Text>
                  {row.nextDueLabel ? (
                    <View style={styles.dueRow}>
                      <Ionicons
                        name={row.nextDueLabel.includes('atrasado') ? 'warning-outline' : 'calendar-outline'}
                        size={10}
                        color={row.nextDueLabel.includes('atrasado') ? colors.danger : colors.ink3}
                      />
                      <Text
                        style={[
                          styles.dueText,
                          row.nextDueLabel.includes('atrasado') && { color: colors.danger },
                        ]}>
                        {row.nextDueLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.rowValue}>
                    <Text style={styles.rowCurrency}>R$ </Text>
                    {row.receivedThisMonth.toFixed(0)}
                  </Text>
                  <Text
                    style={[
                      styles.rowStatus,
                      isPaid && { color: colors.broto },
                      isPending && { color: colors.mangaDeep },
                      isOverdue && { color: colors.danger },
                      row.status === 'none' && { color: colors.ink4 },
                    ]}>
                    {isPaid ? '● Pago' : isPending ? '● Pendente' : isOverdue ? '● Atrasado' : '— sem cobrança'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: fabBottom }]} onPress={() => router.push('/register-payment' as any)}>
        <View style={styles.fabIcon}>
          <Ionicons name="add" size={14} color="white" />
        </View>
        <Text style={styles.fabText}>Registrar</Text>
      </Pressable>
    </View>
  );
}

function formatMoney(v: number): string {
  return v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  searchBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  monthPill: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  monthLabel: {
    flex: 1, textAlign: 'center',
    fontFamily: fonts.display, fontSize: 14, color: colors.mata,
    letterSpacing: 0.1, textTransform: 'lowercase',
  },
  scroll: { paddingHorizontal: 20 },
  overdueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.15)',
  },
  overdueTitle: { fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.danger },
  overdueSub: { fontFamily: fonts.ui, fontSize: 12, color: colors.ink2, marginTop: 2 },
  hero: {
    borderRadius: 28, padding: 24, overflow: 'hidden',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 12,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.uiSemibold, fontSize: 12,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroAmount: { color: 'white', fontFamily: fonts.display, fontSize: 52, letterSpacing: -1.6 },
  currency: { fontSize: 22, opacity: 0.7 },
  cents: { fontSize: 24, opacity: 0.5 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 8 },
  trendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(122,160,91,0.25)',
    borderRadius: 999,
  },
  trendText: { color: '#B5D49B', fontFamily: fonts.uiSemibold, fontSize: 11 },
  sparkWrap: { position: 'absolute', bottom: 16, right: 16, opacity: 0.7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metric: {
    flexBasis: '48%',
    backgroundColor: colors.neblina,
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  metricIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontFamily: fonts.uiSemibold, fontSize: 10,
    color: colors.ink3,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  metricValue: { fontFamily: fonts.display, fontSize: 22, color: colors.ink1, marginTop: 4, letterSpacing: -0.6 },
  metricCurrency: { fontSize: 11, opacity: 0.55 },
  metricTapHint: { fontFamily: fonts.uiSemibold, fontSize: 10, color: colors.ink3, marginTop: 4, letterSpacing: 0.2 },
  metricSub: { fontFamily: fonts.uiSemibold, fontSize: 10, color: colors.ink3, marginTop: 4, letterSpacing: 0.2 },
  metricLegend: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 12,
    marginHorizontal: 4,
  },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: 22, paddingBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.mata, letterSpacing: -0.3 },
  sectionCount: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.ink3 },
  sectionHint: {
    fontFamily: fonts.displayItalic, fontStyle: 'italic',
    fontSize: 11, color: colors.ink3, marginBottom: 10,
  },
  historyLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(74,124,89,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.12)',
  },
  historyText: { flex: 1, fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.broto },
  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18,
    backgroundColor: colors.neblina,
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  rowPending: {
    backgroundColor: 'rgba(232,160,76,0.04)',
    borderColor: 'rgba(232,160,76,0.2)',
  },
  rowPaidMonthly: {
    backgroundColor: 'rgba(74,124,89,0.06)',
    borderColor: 'rgba(74,124,89,0.2)',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 16, letterSpacing: -0.3 },
  rowName: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.ink1, letterSpacing: -0.2 },
  rowStruct: { fontFamily: fonts.ui, fontSize: 11, color: colors.ink3, marginTop: 3 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dueText: {
    fontFamily: fonts.uiSemibold,
    fontSize: 10,
    color: colors.ink2,
    letterSpacing: 0.2,
  },
  rowValue: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.mata, letterSpacing: -0.3 },
  rowCurrency: { fontSize: 10, opacity: 0.55 },
  rowStatus: {
    fontFamily: fonts.uiSemibold, fontSize: 10,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 3,
  },
  fab: {
    position: 'absolute',
    right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.mata,
    shadowColor: colors.mata, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 32, elevation: 12,
  },
  fabIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.manga,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 13 },
});
