import { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { WeekProgressCard } from '@/components/WeekProgressCard';
import { WeekNav } from '@/components/WeekNav';
import { FarmCard } from '@/components/FarmCard';
import { UndoToast } from '@/components/UndoToast';
import { HomeFab } from '@/components/HomeFab';
import { Confetti } from '@/components/Confetti';
import { AmbientBg } from '@/components/AmbientBg';
import { FarmPreviewSheet } from '@/components/FarmPreviewSheet';
import { EmptyIllustration } from '@/components/EmptyIllustration';

import { visitsService, type FarmWithStatus } from '@/services/visits';
import { useThemeColors } from '@/theme/hook';
import { speakWeekSummary } from '@/lib/voice';
import { paymentsService } from '@/services/payments';
import { locationService } from '@/services/location';
import type { Farm } from '@/db/schema';
import { currentWeek, formatDayLong, shiftWeek, type WeekRef } from '@/lib/date';
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
  const { colors: themeColors } = useThemeColors();
  const [data, setData] = useState<{
    farms: FarmWithStatus[];
    counts: { visited: number; skipped: number; pending: number; total: number };
    visitedDays: number[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [undo, setUndo] = useState<UndoState>({ visible: false, message: '', farmId: null, prevStatus: null });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiShownForWeek, setConfettiShownForWeek] = useState<string | null>(null);
  const [nearbyFarm, setNearbyFarm] = useState<{ farm: Farm; distanceM: number } | null>(null);
  const [previewFarm, setPreviewFarm] = useState<FarmWithStatus | null>(null);

  const today = useMemo(() => currentWeek(), []);
  const [selectedWeek, setSelectedWeek] = useState<WeekRef>(today);
  const isCurrent = selectedWeek.year === today.year && selectedWeek.week === today.week;
  const isFuture = selectedWeek.year > today.year || (selectedWeek.year === today.year && selectedWeek.week > today.week);

  const weekKey = `${selectedWeek.year}-W${selectedWeek.week}`;
  const todayIdx = (new Date().getDay() + 6) % 7;

  const load = useCallback(async () => {
    const result = await visitsService.getFarmsForWeek(selectedWeek);
    setData({ farms: result.farms, counts: result.counts, visitedDays: result.visitedDays });
  }, [selectedWeek]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!isCurrent) {
      setNearbyFarm(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const has = await locationService.hasPermission();
      if (!has) return;
      const suggestion = await locationService.suggestNearbyVisit();
      if (!cancelled) setNearbyFarm(suggestion);
    })();
    return () => { cancelled = true; };
  }, [isCurrent, data?.farms.length]);

  useEffect(() => {
    if (!data || !isCurrent) return;
    const { visited, total } = data.counts;
    if (total > 0 && visited === total && confettiShownForWeek !== weekKey) {
      setShowConfetti(true);
      setConfettiShownForWeek(weekKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [data, weekKey, confettiShownForWeek, isCurrent]);

  const updateFarm = useCallback((farmId: number, nextStatus: FarmStatus) => {
    setData((prev) => {
      if (!prev) return prev;
      const farms = prev.farms.map((f) => (f.id === farmId ? { ...f, status: nextStatus } : f));
      return { ...prev, farms, counts: recalcCounts(farms) };
    });
  }, []);

  const onTap = useCallback(
    async (farm: FarmWithStatus) => {
      const next = await visitsService.cycleStatus(farm.id, farm.status, 'tap', selectedWeek);
      updateFarm(farm.id, next);
    },
    [selectedWeek, updateFarm]
  );

  const onLongPress = useCallback(
    async (farm: FarmWithStatus) => {
      const prevStatus = farm.status;
      const next = await visitsService.cycleStatus(farm.id, farm.status, 'longpress', selectedWeek);
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
    [selectedWeek, updateFarm]
  );

  const handleUndo = useCallback(async () => {
    if (!undo.farmId) return;
    await visitsService.unskipWeek(undo.farmId, selectedWeek);
    if (undo.prevStatus === 'visited') {
      await visitsService.markVisited(undo.farmId, selectedWeek);
    }
    updateFarm(undo.farmId, undo.prevStatus ?? 'pending');
    setUndo({ visible: false, message: '', farmId: null, prevStatus: null });
  }, [undo, selectedWeek, updateFarm]);

  const dismissUndo = useCallback(() => {
    setUndo((s) => ({ ...s, visible: false }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goPrev = useCallback(() => {
    Haptics.selectionAsync();
    setSelectedWeek((w) => shiftWeek(w, -1));
  }, []);

  const goNext = useCallback(() => {
    Haptics.selectionAsync();
    setSelectedWeek((w) => shiftWeek(w, 1));
  }, []);

  if (!data) {
    return <View style={{ flex: 1, backgroundColor: colors.papel }} />;
  }

  const dateLabel = formatDayLong(new Date());

  return (
    <View style={[styles.root, { backgroundColor: themeColors.papel }]}>
      <AmbientBg variant="soft" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
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
            weekNumber={selectedWeek.week}
            pendingCount={data.counts.pending}
            weekLabel={isCurrent ? `Semana ${selectedWeek.week}` : isFuture ? `Próx · Sem ${selectedWeek.week}` : `Sem ${selectedWeek.week}`}
            onPrev={goPrev}
            onNext={goNext}
            onSpeak={async () => {
              const today = new Date();
              const summary = await paymentsService.monthlySummary(today.getFullYear(), today.getMonth() + 1);
              const overdueCount = summary.byFarm.filter((b) => b.status === 'overdue').length;
              await speakWeekSummary(data.counts.visited, data.counts.total, overdueCount);
            }}
          />
        </View>

        {!isCurrent ? (
          <Pressable style={styles.todayChip} onPress={() => setSelectedWeek(today)}>
            <Ionicons name="arrow-back" size={11} color={colors.mangaDeep} />
            <Text style={styles.todayChipText}>voltar à semana atual</Text>
          </Pressable>
        ) : null}

        <WeekNav today={isCurrent ? todayIdx : -1} visitedDays={data.visitedDays} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>
            {isFuture ? 'Próxima semana' : isCurrent ? 'Suas fazendas' : `Semana ${selectedWeek.week}`}
          </Text>
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

        {isFuture ? (
          <View style={styles.futureHint}>
            <Ionicons name="information-circle-outline" size={14} color={colors.mangaDeep} />
            <Text style={styles.futureHintText}>
              Você pode adiantar visitas dessa semana
            </Text>
          </View>
        ) : null}

        {nearbyFarm && isCurrent ? (
          <Pressable
            style={styles.nearbyChip}
            onPress={async () => {
              const farm = data.farms.find((f) => f.id === nearbyFarm.farm.id);
              if (farm && farm.status !== 'visited') {
                await onTap(farm);
              }
              setNearbyFarm(null);
            }}>
            <Ionicons name="location" size={14} color={colors.broto} />
            <Text style={styles.nearbyText}>
              Você está a {Math.round(nearbyFarm.distanceM)}m de {nearbyFarm.farm.name}. Marcar visita?
            </Text>
            <Ionicons name="checkmark-circle" size={18} color={colors.broto} />
          </Pressable>
        ) : null}

        <View style={styles.list}>
          {data.farms.length === 0 ? (
            <View style={styles.emptyHome}>
              <EmptyIllustration size={120} />
              <Text style={styles.emptyTitle}>Sem fazendas pra essa semana</Text>
              <Text style={styles.emptySub}>
                Cadastre a primeira no botão "+" abaixo.
              </Text>
            </View>
          ) : (
            data.farms.map((farm, i) => (
              <FarmCard
                key={farm.id}
                farmId={farm.id}
                name={farm.name}
                avatarColor={farm.colorToken ?? farmColors[i % farmColors.length]}
                initials={initialsOf(farm.name)}
                status={farm.status}
                meta={metaFor(farm, isFuture)}
                onTap={() => onTap(farm)}
                onLongPress={() => onLongPress(farm)}
                onOpen={() => router.push(`/farm/${farm.id}` as any)}
                onPreview={() => setPreviewFarm(farm)}
              />
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <HomeFab onPress={() => router.push('/farm-edit?id=new' as any)} />

      <UndoToast visible={undo.visible} message={undo.message} onUndo={handleUndo} onDismiss={dismissUndo} />

      <Confetti visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <FarmPreviewSheet
        visible={previewFarm !== null}
        onDismiss={() => setPreviewFarm(null)}
        farm={previewFarm}
        lastVisit={previewFarm?.status === 'visited' ? 'Visitada esta semana' : 'Pendente esta semana'}
        notesCount={0}
        paymentSummary={previewFarm?.paymentType && previewFarm.paymentType !== 'none' ? `Cobrança: ${previewFarm.paymentType}` : 'Sem cobrança definida'}
      />
    </View>
  );
}

function metaFor(farm: FarmWithStatus, isFuture: boolean): string | undefined {
  if (farm.status === 'visited') return isFuture ? 'Adiantada para esta semana' : 'Visitada esta semana';
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
  todayChip: {
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(232,160,76,0.12)',
    borderRadius: 999,
    marginTop: 12,
  },
  todayChipText: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.mangaDeep },
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
  futureHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(232,160,76,0.08)',
    borderRadius: 12,
  },
  futureHintText: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.mangaDeep },
  nearbyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(74,124,89,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.25)',
  },
  nearbyText: { flex: 1, fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.mata },
  list: { paddingHorizontal: 16, gap: 8 },
  emptyHome: {
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.mata, marginTop: 14 },
  emptySub: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink3, textAlign: 'center' },
});
