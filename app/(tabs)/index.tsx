import { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { WeekProgressCard } from '@/components/WeekProgressCard';
import { WeekNav } from '@/components/WeekNav';
import { FarmCard } from '@/components/FarmCard';
import { UndoToast } from '@/components/UndoToast';
import { HomeFab } from '@/components/HomeFab';
import { Confetti } from '@/components/Confetti';

import { visitsService, type FarmWithStatus } from '@/services/visits';
import { currentWeek, formatDayLong } from '@/lib/date';
import { initialsOf } from '@/lib/initials';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { FarmStatus } from '@/lib/contracts';

type UndoState = {
  visible: boolean;
  message: string;
  farmId: number | null;
  prevStatus: FarmStatus | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<{
    farms: FarmWithStatus[];
    counts: { visited: number; skipped: number; pending: number; total: number };
    visitedDays: number[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [undo, setUndo] = useState<UndoState>({ visible: false, message: '', farmId: null, prevStatus: null });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiShownForWeek, setConfettiShownForWeek] = useState<string | null>(null);

  const week = currentWeek();
  const weekKey = `${week.year}-W${week.week}`;
  const todayIdx = (new Date().getDay() + 6) % 7;

  const load = useCallback(async () => {
    const result = await visitsService.getFarmsForWeek(week);
    setData({ farms: result.farms, counts: result.counts, visitedDays: result.visitedDays });
  }, [week]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!data) return;
    const { visited, total } = data.counts;
    if (total > 0 && visited === total && confettiShownForWeek !== weekKey) {
      setShowConfetti(true);
      setConfettiShownForWeek(weekKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [data, weekKey, confettiShownForWeek]);

  const updateFarm = useCallback((farmId: number, nextStatus: FarmStatus) => {
    setData((prev) => {
      if (!prev) return prev;
      const farms = prev.farms.map((f) => (f.id === farmId ? { ...f, status: nextStatus } : f));
      return { ...prev, farms, counts: recalcCounts(farms) };
    });
  }, []);

  const onTap = useCallback(
    async (farm: FarmWithStatus) => {
      const next = await visitsService.cycleStatus(farm.id, farm.status, 'tap', week);
      updateFarm(farm.id, next);
    },
    [week, updateFarm]
  );

  const onLongPress = useCallback(
    async (farm: FarmWithStatus) => {
      const prevStatus = farm.status;
      const next = await visitsService.cycleStatus(farm.id, farm.status, 'longpress', week);
      updateFarm(farm.id, next);
      if (next === 'skipped') {
        setUndo({
          visible: true,
          message: `${farm.name} pulada essa semana`,
          farmId: farm.id,
          prevStatus,
        });
      }
    },
    [week, updateFarm]
  );

  const handleUndo = useCallback(async () => {
    if (!undo.farmId) return;
    await visitsService.unskipWeek(undo.farmId, week);
    if (undo.prevStatus === 'visited') {
      await visitsService.markVisited(undo.farmId, week);
    }
    updateFarm(undo.farmId, undo.prevStatus ?? 'pending');
    setUndo({ visible: false, message: '', farmId: null, prevStatus: null });
  }, [undo, week, updateFarm]);

  const dismissUndo = useCallback(() => {
    setUndo((s) => ({ ...s, visible: false }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!data) {
    return <View style={{ flex: 1, backgroundColor: colors.papel }} />;
  }

  const today = new Date();
  const dateLabel = formatDayLong(today);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bom dia,</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>L</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.broto} />
        }>
        <View style={styles.cardWrap}>
          <WeekProgressCard
            visited={data.counts.visited}
            total={data.counts.total}
            weekNumber={week.week}
            pendingCount={data.counts.pending}
          />
        </View>

        <WeekNav today={todayIdx} visitedDays={data.visitedDays} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Suas fazendas</Text>
          {data.counts.skipped > 0 ? (
            <View style={styles.skipBadge}>
              <Text style={styles.skipBadgeText}>{data.counts.skipped} puladas</Text>
            </View>
          ) : data.counts.pending > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{data.counts.pending} pendentes</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.list}>
          {data.farms.map((farm, i) => (
            <FarmCard
              key={farm.id}
              farmId={farm.id}
              name={farm.name}
              avatarColor={farm.colorToken ?? farmColors[i % farmColors.length]}
              initials={initialsOf(farm.name)}
              status={farm.status}
              meta={metaFor(farm)}
              onTap={() => onTap(farm)}
              onLongPress={() => onLongPress(farm)}
              onOpen={() => router.push(`/farm/${farm.id}` as any)}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <HomeFab onPress={() => router.push('/farm-edit?id=new' as any)} />

      <UndoToast visible={undo.visible} message={undo.message} onUndo={handleUndo} onDismiss={dismissUndo} />

      <Confetti visible={showConfetti} onComplete={() => setShowConfetti(false)} />
    </View>
  );
}

function metaFor(farm: FarmWithStatus): string | undefined {
  if (farm.status === 'visited') return 'Visitada esta semana';
  if (farm.status === 'skipped') return undefined;
  return farm.ownerName ?? undefined;
}

function recalcCounts(farms: FarmWithStatus[]): {
  visited: number;
  skipped: number;
  pending: number;
  total: number;
} {
  const visited = farms.filter((f) => f.status === 'visited').length;
  const skipped = farms.filter((f) => f.status === 'skipped').length;
  const pending = farms.filter((f) => f.status === 'pending').length;
  return { visited, skipped, pending, total: farms.length - skipped };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink3, letterSpacing: 0.2 },
  date: {
    fontFamily: fonts.display, fontSize: 22, color: colors.mata,
    letterSpacing: -0.4, marginTop: 2, textTransform: 'capitalize',
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mata,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mata, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  userAvatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 18 },
  scroll: { paddingBottom: 32 },
  cardWrap: { paddingHorizontal: 20, paddingTop: 8 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.mata, letterSpacing: -0.3 },
  countBadge: {
    backgroundColor: 'rgba(232,160,76,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  countBadgeText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.mangaDeep },
  skipBadge: {
    backgroundColor: 'rgba(26,58,46,0.06)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  skipBadgeText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.ink3 },
  list: { paddingHorizontal: 16, gap: 8 },
});
