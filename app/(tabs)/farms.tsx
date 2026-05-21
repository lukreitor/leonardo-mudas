import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { farmsRepo } from '@/repositories/farms';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useThemeColors } from '@/theme/hook';
import { initialsOf } from '@/lib/initials';
import { HomeFab } from '@/components/HomeFab';
import { AmbientBg } from '@/components/AmbientBg';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import type { Farm } from '@/db/schema';

type Mode = 'active' | 'deactivated' | 'trashed';

export default function FarmsScreen() {
  const router = useRouter();
  const { colors: themeColors } = useThemeColors();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [mode, setMode] = useState<Mode>('active');

  const load = useCallback(async () => {
    const list =
      mode === 'trashed'
        ? await farmsRepo.listTrashed()
        : mode === 'deactivated'
          ? await farmsRepo.listDeactivated()
          : await farmsRepo.listActive();
    setFarms(list);
  }, [mode]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.root, { backgroundColor: themeColors.papel }]}>
      <AmbientBg variant="soft" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fazendas</Text>
            <Text style={styles.subtitle}>
              {farms.length} {mode === 'trashed' ? 'na lixeira' : mode === 'deactivated' ? 'desativadas' : 'ativas'}
            </Text>
          </View>
          <Pressable
            style={styles.mapBtn}
            onPress={() => router.push('/map' as any)}>
            <Ionicons name="map-outline" size={18} color={colors.mata} />
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          {(['active', 'deactivated', 'trashed'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.filterPill, mode === m && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, mode === m && styles.filterPillTextActive]}>
                {m === 'active' ? 'Ativas' : m === 'deactivated' ? 'Desativadas' : 'Lixeira'}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll}>
        {farms.length === 0 ? (
          <View style={styles.empty}>
            <EmptyIllustration size={120} />
            <Text style={styles.emptyTitle}>
              {mode === 'trashed'
                ? 'Lixeira vazia'
                : mode === 'deactivated'
                  ? 'Nenhuma fazenda desativada'
                  : 'Nenhuma fazenda ativa'}
            </Text>
            <Text style={styles.emptySub}>
              {mode === 'trashed'
                ? 'Fazendas excluídas aparecem aqui por 30 dias antes de serem apagadas.'
                : mode === 'deactivated'
                  ? 'Quando você desativar uma fazenda, ela aparece aqui.'
                  : 'Toque no botão "+" para adicionar.'}
            </Text>
          </View>
        ) : (
          farms.map((farm, i) => {
            const daysLeft = mode === 'trashed' && farm.trashedAt
              ? Math.max(0, 30 - Math.floor((Date.now() - new Date(farm.trashedAt).getTime()) / (1000 * 60 * 60 * 24)))
              : null;
            return (
              <Pressable
                key={farm.id}
                style={styles.row}
                onPress={() => {
                  if (mode === 'deactivated') {
                    farmsRepo.restore(farm.id).then(load);
                  } else if (mode === 'trashed') {
                    farmsRepo.restoreFromTrash(farm.id).then(load);
                  } else {
                    router.push(`/farm/${farm.id}` as any);
                  }
                }}>
                <View style={[styles.avatar, { backgroundColor: farm.colorToken ?? farmColors[i % farmColors.length] }]}>
                  <Text style={styles.avatarText}>{initialsOf(farm.name)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name}>{farm.name}</Text>
                  <Text style={styles.meta}>
                    {mode === 'trashed' && daysLeft !== null
                      ? `${daysLeft}d até apagar de vez`
                      : farm.ownerName ?? (farm.sizeHa ? `${farm.sizeHa} ha` : 'sem detalhes')}
                  </Text>
                </View>
                {mode === 'active' ? (
                  <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
                ) : (
                  <View style={styles.restoreChip}>
                    <Ionicons name="refresh" size={14} color={colors.broto} />
                    <Text style={styles.restoreText}>Restaurar</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
        <View style={{ height: 140 }} />
      </ScrollView>
      <HomeFab onPress={() => router.push('/farm-edit?id=new' as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: {
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  mapBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink3, marginTop: 4 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.neblina,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
  },
  filterPillActive: { backgroundColor: colors.mata, borderColor: colors.mata },
  filterPillText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.ink2 },
  filterPillTextActive: { color: 'white' },
  scroll: { paddingHorizontal: 16, gap: 8 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.mata },
  emptySub: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink3, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    backgroundColor: colors.neblina,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.3 },
  name: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.ink1, letterSpacing: -0.2 },
  meta: { fontFamily: fonts.ui, fontSize: 12, color: colors.ink3, marginTop: 2 },
  restoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,124,89,0.12)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
  },
  restoreText: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.broto },
});
