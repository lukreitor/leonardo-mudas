import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { farmsRepo } from '@/repositories/farms';
import { locationService } from '@/services/location';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';
import type { Farm } from '@/db/schema';

export default function MapScreen() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const list = await farmsRepo.listActive();
      const withCoords = list.filter((f) => f.lat != null && f.lng != null);
      setFarms(withCoords);

      const has = await locationService.hasPermission();
      if (!has) {
        await locationService.requestPermission();
      }
      const pos = await locationService.getCurrent();
      if (pos) setUserLoc(pos);
    })();
  }, []);

  const initialRegion = userLoc
    ? { latitude: userLoc.lat, longitude: userLoc.lng, latitudeDelta: 0.2, longitudeDelta: 0.2 }
    : farms[0]
      ? { latitude: farms[0].lat!, longitude: farms[0].lng!, latitudeDelta: 0.2, longitudeDelta: 0.2 }
      : { latitude: -9.3856, longitude: -40.5067, latitudeDelta: 1, longitudeDelta: 1 };

  if (farms.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.mata} />
            </Pressable>
            <Text style={styles.title}>Mapa</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyWrap}>
          <Ionicons name="location-outline" size={60} color={colors.broto} />
          <Text style={styles.emptyTitle}>Nenhuma fazenda com localização</Text>
          <Text style={styles.emptySub}>
            Edite uma fazenda e adicione coordenadas GPS para ver pinos no mapa.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}>
        {farms.map((farm, i) => (
          <Marker
            key={farm.id}
            coordinate={{ latitude: farm.lat!, longitude: farm.lng! }}
            title={farm.name}
            description={farm.ownerName ?? ''}
            onCalloutPress={() => router.push(`/farm/${farm.id}` as any)}>
            <View style={[styles.pin, { backgroundColor: farm.colorToken ?? farmColors[i % farmColors.length] }]}>
              <Text style={styles.pinText}>{initialsOf(farm.name)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.headerFloat}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backFloat}>
            <Ionicons name="chevron-back" size={22} color={colors.mata} />
          </Pressable>
          <View style={styles.titleFloat}>
            <Text style={styles.title}>Mapa</Text>
            <Text style={styles.subtitle}>{farms.length} {farms.length === 1 ? 'fazenda' : 'fazendas'} com GPS</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  back: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  headerFloat: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backFloat: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  titleFloat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  title: { fontFamily: fonts.display, fontSize: 16, color: colors.mata, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 10, color: colors.ink3 },
  pin: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  pinText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 13 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.mata, textAlign: 'center' },
  emptySub: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink3, textAlign: 'center', lineHeight: 19 },
});
