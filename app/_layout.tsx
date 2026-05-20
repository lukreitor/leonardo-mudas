import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import {
  useFonts as useFraunces,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useDbMigrations } from '@/db/migrate';
import { runSeedIfNeeded } from '@/services/seed';
import { maintenanceService } from '@/services/maintenance';
import { notificationsService } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { useSettings } from '@/stores/settings';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { success: migrationsReady, error: migrationsError } = useDbMigrations();
  const [seeded, setSeeded] = useState(false);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFraunces({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (migrationsReady && !seeded) {
      (async () => {
        await runSeedIfNeeded();
        await maintenanceService.runStartupChecks();
        notificationsService.scheduleDailySummary().catch(() => {});
        notificationsService.fireOverdueAlerts().catch(() => {});
        setSeeded(true);
      })();
    }
  }, [migrationsReady, seeded]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    useSettings.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || !seeded || !fontsLoaded || !migrationsReady) return;
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) {
      router.replace('/auth/login' as any);
    } else if (session && inAuth) {
      router.replace('/(tabs)' as any);
    }
  }, [session, hydrated, seeded, fontsLoaded, migrationsReady, segments, router]);

  if (migrationsError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.papel, padding: 24 }}>
        <Text style={{ color: colors.danger, fontSize: 16 }}>Erro ao iniciar banco de dados</Text>
        <Text style={{ color: colors.ink2, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
          {migrationsError.message}
        </Text>
      </View>
    );
  }

  if (!migrationsReady || !fontsLoaded || !seeded || !hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.papel }}>
        <ActivityIndicator color={colors.broto} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.papel } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="farm/[id]/index" options={{ presentation: 'card' }} />
        <Stack.Screen
          name="farm/[id]/delete"
          options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name="farm-edit" options={{ presentation: 'card' }} />
        <Stack.Screen
          name="register-payment"
          options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name="payments-list" options={{ presentation: 'card' }} />
        <Stack.Screen name="record" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
