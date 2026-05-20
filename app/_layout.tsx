import { Stack } from 'expo-router';
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
import { colors } from '@/theme/colors';

import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { success: migrationsReady, error: migrationsError } = useDbMigrations();
  const [seeded, setSeeded] = useState(false);

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
      runSeedIfNeeded().then(() => setSeeded(true));
    }
  }, [migrationsReady, seeded]);

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

  if (!migrationsReady || !fontsLoaded || !seeded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.papel }}>
        <ActivityIndicator color={colors.broto} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.papel } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="farm/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="record" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
