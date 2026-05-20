import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { weekLabel, type WeekRef } from '@/lib/date';
import type { WeekStat } from '@/services/farms';

type Props = {
  stat: WeekStat;
  onPress?: () => void;
};

export function RecentWeekCard({ stat, onPress }: Props) {
  const ref: WeekRef = { year: stat.year, week: stat.week };

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <LinearGradient
        colors={[colors.broto, colors.mata]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.numBox}>
        <Text style={styles.numText}>{stat.week}</Text>
        <Text style={styles.numLabel}>SEM</Text>
      </LinearGradient>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.dates}>{weekLabel(ref)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {stat.noteCount} {stat.noteCount === 1 ? 'anotação' : 'anotações'}
          </Text>
          {stat.audioCount > 0 ? <Text style={styles.stat}>🎙 {stat.audioCount}</Text> : null}
          {stat.photoCount > 0 ? <Text style={styles.stat}>📷 {stat.photoCount}</Text> : null}
          {stat.videoCount > 0 ? <Text style={styles.stat}>📹 {stat.videoCount}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.neblina,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
  },
  numBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  numText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 15 },
  numLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: fonts.uiBold,
    marginTop: 1,
  },
  dates: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.ink1 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  statsText: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.ink3 },
  stat: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.ink3 },
});
