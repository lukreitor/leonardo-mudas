import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type Props = {
  today: number; // 0 = Mon ... 6 = Sun (ISO weekday - 1)
  visitedDays: number[]; // array of day indices that had visits
};

export function WeekNav({ today, visitedDays }: Props) {
  const visitedSet = new Set(visitedDays);
  return (
    <View style={styles.row}>
      {DAYS.map((label, i) => {
        const isToday = i === today;
        const isVisited = visitedSet.has(i);
        return (
          <View key={label} style={styles.day}>
            <Text style={[styles.label, isToday && styles.labelToday]}>{label}</Text>
            <View
              style={[
                styles.dot,
                isToday && styles.dotToday,
                isVisited && !isToday && styles.dotVisited,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  label: {
    fontSize: 11,
    fontFamily: fonts.uiSemibold,
    color: colors.ink3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelToday: { color: colors.mangaDeep },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(26,58,46,0.12)',
  },
  dotVisited: {
    backgroundColor: colors.broto,
  },
  dotToday: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.manga,
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
