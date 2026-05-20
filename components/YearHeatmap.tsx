import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { totalWeeksInYear } from '@/lib/date';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const LVL_BG = ['rgba(26,58,46,0.06)', 'rgba(122,160,91,0.32)', 'rgba(74,124,89,0.6)', 'rgba(74,124,89,0.85)', colors.mata];

type Props = {
  year: number;
  currentWeek?: number;
  weekLevels?: Map<number, 0 | 1 | 2 | 3 | 4>;
  onWeekPress?: (week: number) => void;
};

export function YearHeatmap({ year, currentWeek, weekLevels = new Map(), onWeekPress }: Props) {
  const total = totalWeeksInYear(year);
  const weeks = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.year}>{year}</Text>
        <Text style={styles.subtitle}>{total} semanas · toque para abrir</Text>
      </View>

      <View style={styles.months}>
        {MONTHS.map((m) => (
          <Text key={m} style={styles.month}>
            {m}
          </Text>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {weeks.map((w) => {
            const lvl = weekLevels.get(w) ?? 0;
            const isCurrent = w === currentWeek;
            return (
              <Pressable
                key={w}
                onPress={() => onWeekPress?.(w)}
                style={[
                  styles.cell,
                  { backgroundColor: LVL_BG[lvl] },
                  isCurrent && styles.cellCurrent,
                ]}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>sem visitas → mais visitas</Text>
        <View style={styles.legendScale}>
          {LVL_BG.map((bg, i) => (
            <View key={i} style={[styles.legendCell, { backgroundColor: bg }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neblina,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  year: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.mata, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.uiSemibold, fontSize: 10, color: colors.ink3, letterSpacing: 0.6, textTransform: 'uppercase' },
  months: { flexDirection: 'row', marginBottom: 5, paddingHorizontal: 1 },
  month: {
    flex: 1,
    fontFamily: fonts.uiSemibold,
    fontSize: 9,
    color: colors.ink3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', gap: 3 },
  cell: { width: 12, height: 32, borderRadius: 3 },
  cellCurrent: {
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.manga,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  legendLabel: { fontFamily: fonts.uiMedium, fontSize: 10, color: colors.ink3 },
  legendScale: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});
