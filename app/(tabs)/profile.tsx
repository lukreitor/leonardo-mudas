import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await authService.isBiometricSupported();
      const enabled = await authService.getBiometricEnabled();
      setBioAvailable(avail);
      setBioEnabled(enabled);
    })();
  }, []);

  const toggleBio = async () => {
    if (!bioAvailable) {
      Alert.alert('Indisponível', 'Biometria não configurada no aparelho.');
      return;
    }
    const next = !bioEnabled;
    if (next) {
      const ok = await authService.promptBiometric('Confirmar para habilitar biometria');
      if (!ok) return;
    }
    await authService.setBiometricEnabled(next);
    setBioEnabled(next);
  };

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login' as any);
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session?.email ? session.email[0].toUpperCase() : 'L'}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name}>{session?.email ?? 'Convidado'}</Text>
            <Text style={styles.subtitle}>consultor de mudas</Text>
          </View>
        </View>

        <View style={styles.list}>
          <Pressable style={styles.row} onPress={toggleBio}>
            <View style={styles.rowIcon}>
              <Ionicons name="finger-print" size={18} color={colors.broto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Biometria</Text>
              <Text style={styles.rowSub}>
                {!bioAvailable
                  ? 'Não disponível neste aparelho'
                  : bioEnabled
                    ? 'Ativada — usa Face ID/digital ao abrir'
                    : 'Desativada — apenas senha'}
              </Text>
            </View>
            <View style={[styles.toggle, bioEnabled && styles.toggleOn]}>
              <View style={[styles.toggleKnob, bioEnabled && styles.toggleKnobOn]} />
            </View>
          </Pressable>

          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,160,76,0.15)' }]}>
              <Ionicons name="share-outline" size={18} color={colors.mangaDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Exportar dados</Text>
              <Text style={styles.rowSub}>WhatsApp ou arquivo ZIP</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(26,58,46,0.08)' }]}>
              <Ionicons name="archive-outline" size={18} color={colors.mata} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Backup completo</Text>
              <Text style={styles.rowSub}>.sqlite + mídias</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(74,124,89,0.12)' }]}>
              <Ionicons name="moon-outline" size={18} color={colors.broto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Modo escuro</Text>
              <Text style={styles.rowSub}>Automático (sistema)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>
        </View>

        <Pressable style={styles.logout} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  scroll: { paddingHorizontal: 20 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18,
    backgroundColor: colors.neblina,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
    marginBottom: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.mata,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 22 },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.mata, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.ink3, marginTop: 2 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    backgroundColor: colors.neblina,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(74,124,89,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.ink1 },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: colors.ink3, marginTop: 2 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(26,58,46,0.1)',
    padding: 2,
  },
  toggleOn: { backgroundColor: colors.broto },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2,
  },
  toggleKnobOn: { transform: [{ translateX: 18 }] },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, padding: 14,
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius: 18,
  },
  logoutText: { color: colors.danger, fontFamily: fonts.uiSemibold, fontSize: 14 },
});
