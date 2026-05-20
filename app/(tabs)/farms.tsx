import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { farmsRepo } from '@/repositories/farms';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';
import { FarmCard } from '@/components/FarmCard';
import type { Farm } from '@/db/schema';

export default function FarmsScreen() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);

  const load = useCallback(async () => {
    const list = await farmsRepo.listActive();
    setFarms(list);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <Text style={styles.title}>Fazendas</Text>
          <Text style={styles.subtitle}>{farms.length} ativas</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll}>
        {farms.map((farm, i) => (
          <FarmCard
            key={farm.id}
            farmId={farm.id}
            name={farm.name}
            avatarColor={farm.colorToken ?? farmColors[i % farmColors.length]}
            initials={initialsOf(farm.name)}
            status="pending"
            meta={farm.ownerName ?? undefined}
            onTap={() => router.push(`/farm/${farm.id}` as any)}
            onLongPress={() => router.push(`/farm/${farm.id}` as any)}
            onOpen={() => router.push(`/farm/${farm.id}` as any)}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink3, marginTop: 4 },
  scroll: { paddingHorizontal: 16, gap: 8 },
});
