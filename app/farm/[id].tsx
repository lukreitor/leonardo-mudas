import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { farmsRepo } from '@/repositories/farms';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';
import { currentWeek, weekLabel } from '@/lib/date';
import type { Farm } from '@/db/schema';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);

  const load = useCallback(async () => {
    const f = await farmsRepo.getById(Number(id));
    setFarm(f);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!farm) return <View style={{ flex: 1, backgroundColor: colors.papel }} />;

  const week = currentWeek();
  const avatarColor = farm.colorToken ?? farmColors[(farm.id - 1) % farmColors.length];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[avatarColor, mix(avatarColor, colors.noite, 0.3)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.nav}>
              <Pressable onPress={() => router.back()} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={22} color="white" />
              </Pressable>
              <Pressable style={styles.navBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color="white" />
              </Pressable>
            </View>
            <View style={styles.heroBody}>
              <View style={styles.avatarBig}>
                <Text style={styles.avatarBigText}>{initialsOf(farm.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.farmName}>{farm.name}</Text>
                <Text style={styles.farmSub}>{farm.ownerName ?? 'Sem dono cadastrado'}</Text>
                {farm.ownerPhone ? (
                  <View style={styles.phoneChip}>
                    <Ionicons name="call-outline" size={12} color="white" />
                    <Text style={styles.phoneText}>{farm.ownerPhone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.weekBar}>
          <Pressable style={styles.arrow}>
            <Ionicons name="chevron-back" size={14} color={colors.mata} />
          </Pressable>
          <View style={styles.weekPill}>
            <Text style={styles.weekPillLabel}>Semana {week.week}</Text>
            <Text style={styles.weekPillDates}>{weekLabel(week)}</Text>
          </View>
          <Pressable style={styles.arrow}>
            <Ionicons name="chevron-forward" size={14} color={colors.mata} />
          </Pressable>
          <Pressable style={styles.calBtn}>
            <Ionicons name="calendar-outline" size={16} color="white" />
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Anotações da visita</Text>
          <Pressable style={styles.addBtn}>
            <Ionicons name="add" size={14} color="white" />
          </Pressable>
        </View>

        <View style={styles.emptyNotes}>
          <Ionicons name="leaf-outline" size={36} color={colors.broto} />
          <Text style={styles.emptyTitle}>Nenhuma anotação ainda</Text>
          <Text style={styles.emptySub}>
            Comece gravando um áudio, tirando uma foto ou escrevendo uma observação.
          </Text>
          <Pressable
            onPress={() => router.push(`/record?farmId=${farm.id}` as any)}
            style={styles.emptyCta}>
            <Ionicons name="mic" size={16} color="white" />
            <Text style={styles.emptyCtaText}>Gravar visita</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bb = Math.round(pa.b * (1 - t) + pb.b * t);
  return `rgb(${r},${g},${bb})`;
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  hero: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  avatarBig: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBigText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 28 },
  farmName: { color: 'white', fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.6 },
  farmSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4 },
  phoneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: 8,
  },
  phoneText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 11 },
  weekBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12,
  },
  arrow: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  weekPill: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 11,
    backgroundColor: colors.neblina,
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  weekPillLabel: { fontFamily: fonts.display, fontSize: 16, color: colors.mata, letterSpacing: -0.3 },
  weekPillDates: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.ink3 },
  calBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.mata,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 18, paddingBottom: 14,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.mata, letterSpacing: -0.3 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.mata,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mata, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  emptyNotes: {
    marginHorizontal: 20,
    padding: 32,
    backgroundColor: colors.neblina,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.mata, marginTop: 14 },
  emptySub: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 18,
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: colors.manga,
    borderRadius: 999,
  },
  emptyCtaText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 14 },
});
