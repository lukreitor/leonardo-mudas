import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { farmsRepo } from '@/repositories/farms';
import { visitsRepo } from '@/repositories/visits';
import { weeksRepo } from '@/repositories/weeks';
import { notesService, type NoteWithMedia } from '@/services/notes';
import { farmsService, type WeekStat } from '@/services/farms';
import { paymentsService } from '@/services/payments';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NoteBlock } from '@/components/NoteBlock';
import { YearHeatmap } from '@/components/YearHeatmap';
import { PaymentCard } from '@/components/PaymentCard';
import { RecentWeekCard } from '@/components/RecentWeekCard';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';
import { currentWeek, weekLabel, shiftWeek, type WeekRef } from '@/lib/date';
import type { Farm } from '@/db/schema';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [notes, setNotes] = useState<NoteWithMedia[]>([]);
  const [weekStats, setWeekStats] = useState<Map<number, WeekStat>>(new Map());
  const [selectedWeek, setSelectedWeek] = useState<WeekRef>(currentWeek());
  const [receivedMonth, setReceivedMonth] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'overdue' | 'none'>('none');
  const [visitedAt, setVisitedAt] = useState<string | null>(null);

  const todayWeek = useMemo(() => currentWeek(), []);
  const isCurrentWeek = selectedWeek.year === todayWeek.year && selectedWeek.week === todayWeek.week;

  const load = useCallback(async () => {
    const f = await farmsRepo.getById(Number(id));
    setFarm(f);
    if (!f) return;
    const ns = await notesService.listForFarmAndWeek(f.id, selectedWeek);
    setNotes(ns);
    const stats = await farmsService.getWeekStats(f.id, selectedWeek.year);
    setWeekStats(stats);

    const week = await weeksRepo.findOrCreate(selectedWeek);
    const visit = await visitsRepo.getByFarmAndWeek(f.id, week.id);
    setVisitedAt(visit?.visitedDate ?? null);

    const today = new Date();
    const summary = await paymentsService.monthlySummary(today.getFullYear(), today.getMonth() + 1);
    const farmRow = summary.byFarm.find((r) => r.farm.id === f.id);
    if (farmRow) {
      setReceivedMonth(farmRow.receivedThisMonth);
      setPaymentStatus(farmRow.status);
    }
  }, [id, selectedWeek]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!farm) return <View style={{ flex: 1, backgroundColor: colors.papel }} />;

  const avatarColor = farm.colorToken ?? farmColors[(farm.id - 1) % farmColors.length];

  const weekLevels = new Map<number, 0 | 1 | 2 | 3 | 4>();
  for (const [wn, st] of weekStats.entries()) {
    const total = st.noteCount;
    const lvl: 0 | 1 | 2 | 3 | 4 =
      total >= 5 ? 4 : total >= 3 ? 3 : total >= 2 ? 2 : total >= 1 ? 1 : 0;
    weekLevels.set(wn, lvl);
  }

  const recentStats = Array.from(weekStats.values())
    .sort((a, b) => b.week - a.week)
    .filter((s) => !(s.year === todayWeek.year && s.week === todayWeek.week))
    .slice(0, 3);

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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => router.push(`/farm-edit?id=${farm.id}` as any)}
                  style={styles.navBtn}>
                  <Ionicons name="create-outline" size={18} color="white" />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/farm/${farm.id}/delete` as any)}
                  style={styles.navBtn}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                </Pressable>
              </View>
            </View>
            <View style={styles.heroBody}>
              <View style={styles.avatarBig}>
                <Text style={styles.avatarBigText}>{initialsOf(farm.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.farmName}>{farm.name}</Text>
                <Text style={styles.farmSub}>
                  {farm.ownerName ?? 'Sem dono cadastrado'}
                  {farm.sizeHa ? ` · ${farm.sizeHa} ha` : ''}
                </Text>
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
          <Pressable style={styles.arrow} onPress={() => setSelectedWeek(shiftWeek(selectedWeek, -1))}>
            <Ionicons name="chevron-back" size={14} color={colors.mata} />
          </Pressable>
          <Pressable
            style={styles.weekPill}
            onPress={() => !isCurrentWeek && setSelectedWeek(todayWeek)}>
            <Text style={styles.weekPillLabel}>Semana {selectedWeek.week}</Text>
            <Text style={styles.weekPillDates}>{weekLabel(selectedWeek)}</Text>
          </Pressable>
          <Pressable
            style={[styles.arrow, isCurrentWeek && { opacity: 0.4 }]}
            disabled={isCurrentWeek}
            onPress={() => setSelectedWeek(shiftWeek(selectedWeek, 1))}>
            <Ionicons name="chevron-forward" size={14} color={colors.mata} />
          </Pressable>
        </View>

        {!isCurrentWeek ? (
          <Pressable style={styles.todayChip} onPress={() => setSelectedWeek(todayWeek)}>
            <Ionicons name="arrow-back" size={12} color={colors.mangaDeep} />
            <Text style={styles.todayChipText}>voltar à semana atual</Text>
          </Pressable>
        ) : null}

        {visitedAt ? (
          <View style={styles.visitStampWrap}>
            <View style={styles.visitStamp}>
              <Ionicons name="checkmark-circle" size={14} color={colors.broto} />
              <Text style={styles.visitStampText}>
                Visitada {format(parseISO(visitedAt), "EEEE", { locale: ptBR })} · {format(parseISO(visitedAt), 'HH:mm')}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Anotações</Text>
          <Pressable
            onPress={() => router.push(`/record?farmId=${farm.id}` as any)}
            style={styles.addBtn}>
            <Ionicons name="add" size={14} color="white" />
          </Pressable>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyNotes}>
            <Ionicons name="leaf-outline" size={36} color={colors.broto} />
            <Text style={styles.emptyTitle}>Nenhuma anotação ainda</Text>
            <Text style={styles.emptySub}>
              {isCurrentWeek
                ? 'Comece gravando um áudio, tirando uma foto ou escrevendo uma observação.'
                : 'Nesta semana você não fez anotações nesta fazenda.'}
            </Text>
            {isCurrentWeek ? (
              <Pressable
                onPress={() => router.push(`/record?farmId=${farm.id}` as any)}
                style={styles.emptyCta}>
                <Ionicons name="mic" size={16} color="white" />
                <Text style={styles.emptyCtaText}>Gravar visita</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.notesList}>
              {notes.map((n) => (
                <NoteBlock
                  key={n.id}
                  note={n}
                  onAddPhoto={isCurrentWeek ? () => router.push(`/record?farmId=${farm.id}&mode=photo` as any) : undefined}
                  onAddAudio={isCurrentWeek ? () => router.push(`/record?farmId=${farm.id}&mode=audio` as any) : undefined}
                  onAddVideo={isCurrentWeek ? () => router.push(`/record?farmId=${farm.id}&mode=video` as any) : undefined}
                  onAddText={isCurrentWeek ? () => router.push(`/record?farmId=${farm.id}&mode=text` as any) : undefined}
                />
              ))}
            </View>
            {isCurrentWeek ? (
              <Pressable
                style={styles.newNoteBtn}
                onPress={() => router.push(`/record?farmId=${farm.id}` as any)}>
                <View style={styles.newNoteIcon}>
                  <Ionicons name="add" size={14} color="white" />
                </View>
                <Text style={styles.newNoteText}>Nova anotação</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <PaymentCard farm={farm} receivedMonth={receivedMonth} status={paymentStatus} />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Calendário</Text>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <YearHeatmap
            year={selectedWeek.year}
            currentWeek={selectedWeek.week}
            weekLevels={weekLevels}
            onWeekPress={(w) => setSelectedWeek({ year: selectedWeek.year, week: w })}
          />
        </View>

        {recentStats.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Semanas recentes</Text>
            </View>
            <View style={styles.recentList}>
              {recentStats.map((s) => (
                <RecentWeekCard
                  key={s.weekId}
                  stat={s}
                  onPress={() => setSelectedWeek({ year: s.year, week: s.week })}
                />
              ))}
            </View>
          </>
        ) : null}
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
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
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
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
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
  todayChip: {
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(232,160,76,0.12)',
    borderRadius: 999,
    marginTop: 6,
  },
  todayChipText: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.mangaDeep },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 22, paddingBottom: 14,
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
    fontFamily: fonts.displayItalic, fontStyle: 'italic',
    fontSize: 13, color: colors.ink2,
    textAlign: 'center', marginTop: 6, lineHeight: 19, maxWidth: 260,
  },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 18,
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: colors.manga,
    borderRadius: 999,
  },
  emptyCtaText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 14 },
  notesList: { paddingHorizontal: 20, gap: 10 },
  newNoteBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    backgroundColor: 'rgba(74,124,89,0.05)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(74,124,89,0.3)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  newNoteIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.broto,
    alignItems: 'center', justifyContent: 'center',
  },
  newNoteText: { color: colors.broto, fontFamily: fonts.uiSemibold, fontSize: 14 },
  visitStampWrap: { paddingHorizontal: 20, marginTop: 10 },
  visitStamp: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(74,124,89,0.08)',
    borderRadius: 12,
  },
  visitStampText: {
    fontFamily: fonts.uiSemibold,
    fontSize: 12,
    color: colors.mata,
    textTransform: 'capitalize',
  },
  recentList: { paddingHorizontal: 20, gap: 8 },
});
