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

export default function FarmsScreen() {
  const router = useRouter();
  const { colors: themeColors } = useThemeColors();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showDeactivated, setShowDeactivated] = useState(false);

  const load = useCallback(async () => {
    const list = showDeactivated ? await farmsRepo.listDeactivated() : await farmsRepo.listActive();
    setFarms(list);
  }, [showDeactivated]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.root, { backgroundColor: themeColors.papel }]}>
      <AmbientBg variant="soft" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fazendas</Text>
            <Text style={styles.subtitle}>
              {farms.length} {showDeactivated ? 'desativadas' : 'ativas'}
            </Text>
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setShowDeactivated((s) => !s)}>
            <Ionicons
              name={showDeactivated ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.mata}
            />
          </Pressable>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll}>
        {farms.length === 0 ? (
          <View style={styles.empty}>
            <EmptyIllustration size={120} />
            <Text style={styles.emptyTitle}>
              {showDeactivated ? 'Nenhuma fazenda desativada' : 'Nenhuma fazenda ativa'}
            </Text>
            <Text style={styles.emptySub}>
              {showDeactivated
                ? 'Quando você desativar uma fazenda, ela aparece aqui.'
                : 'Toque no botão "+" para adicionar.'}
            </Text>
          </View>
        ) : (
          farms.map((farm, i) => (
            <Pressable
              key={farm.id}
              style={styles.row}
              onPress={() =>
                showDeactivated
                  ? farmsRepo.restore(farm.id).then(load)
                  : router.push(`/farm/${farm.id}` as any)
              }>
              <View style={[styles.avatar, { backgroundColor: farm.colorToken ?? farmColors[i % farmColors.length] }]}>
                <Text style={styles.avatarText}>{initialsOf(farm.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name}>{farm.name}</Text>
                <Text style={styles.meta}>
                  {farm.ownerName ?? (farm.sizeHa ? `${farm.sizeHa} ha` : 'sem detalhes')}
                </Text>
              </View>
              {showDeactivated ? (
                <View style={styles.restoreChip}>
                  <Ionicons name="refresh" size={14} color={colors.broto} />
                  <Text style={styles.restoreText}>Reativar</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
              )}
            </Pressable>
          ))
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
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink3, marginTop: 4 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
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
