import * as Location from 'expo-location';
import { farmsRepo } from '../repositories/farms';
import type { Farm } from '../db/schema';

const PROXIMITY_M = 500;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const locationService = {
  async hasPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  },

  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrent(): Promise<{ lat: number; lng: number } | null> {
    try {
      const has = await this.hasPermission();
      if (!has) return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  },

  async findNearestFarm(lat: number, lng: number): Promise<{ farm: Farm; distanceM: number } | null> {
    const farms = await farmsRepo.listActive();
    let nearest: { farm: Farm; distanceM: number } | null = null;
    for (const f of farms) {
      if (f.lat == null || f.lng == null) continue;
      const d = haversineDistance(lat, lng, f.lat, f.lng);
      if (!nearest || d < nearest.distanceM) nearest = { farm: f, distanceM: d };
    }
    return nearest;
  },

  async suggestNearbyVisit(): Promise<{ farm: Farm; distanceM: number } | null> {
    const pos = await this.getCurrent();
    if (!pos) return null;
    const nearest = await this.findNearestFarm(pos.lat, pos.lng);
    if (!nearest) return null;
    return nearest.distanceM <= PROXIMITY_M ? nearest : null;
  },
};
