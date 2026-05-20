import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';

type Props = {
  farmName: string;
  lat: number;
  lng: number;
  colorToken: string;
};

export function FarmMapPreview({ farmName, lat, lng, colorToken }: Props) {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        0
      );
    }
  }, [lat, lng]);

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push('/map' as any)}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        liteMode={Platform.OS === 'android'}
        toolbarEnabled={false}>
        <Marker coordinate={{ latitude: lat, longitude: lng }}>
          <View style={[styles.pin, { backgroundColor: colorToken }]}>
            <Text style={styles.pinText}>{initialsOf(farmName)}</Text>
          </View>
        </Marker>
      </MapView>

      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.openBadge}>
          <Ionicons name="expand-outline" size={12} color="white" />
          <Text style={styles.openBadgeText}>abrir mapa</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.papelWarm,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.06)',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(26,58,46,0.85)',
  },
  openBadgeText: {
    color: 'white',
    fontFamily: fonts.uiSemibold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  pinText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 11 },
});
