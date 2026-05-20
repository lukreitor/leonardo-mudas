import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useAuthStore } from '@/stores/auth';
import { useSettings } from '@/stores/settings';
import { authService } from '@/services/auth';
import { exportService } from '@/services/export';
import { backupService } from '@/services/backup';
import { pdfService } from '@/services/pdf';
import { runDateTests } from '@/lib/date.test';
import { AmbientBg } from '@/components/AmbientBg';
import { useThemeColors } from '@/theme/hook';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors: themeColors } = useThemeColors();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backupping, setBackupping] = useState(false);
  const darkMode = useSettings((s) => s.darkMode);
  const soundEnabled = useSettings((s) => s.soundEnabled);
  const setDarkMode = useSettings((s) => s.setDarkMode);
  const setSoundEnabled = useSettings((s) => s.setSoundEnabled);

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

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportService.shareWeekSummary({
        includeText: true,
        includeAudio: true,
        includePhoto: true,
        includeVideo: true,
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível exportar');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleBackup = useCallback(async () => {
    setBackupping(true);
    try {
      await backupService.exportFullBackup();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível fazer backup');
    } finally {
      setBackupping(false);
    }
  }, []);

  const cycleDarkMode = useCallback(() => {
    const next = darkMode === 'system' ? 'light' : darkMode === 'light' ? 'dark' : 'system';
    setDarkMode(next);
  }, [darkMode, setDarkMode]);

  const handleRestore = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    Alert.alert(
      'Restaurar backup?',
      'Isso vai substituir os dados atuais. Um backup de segurança será criado antes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              await backupService.restoreFromBackup(uri);
              Alert.alert(
                '✓ Restaurado',
                'Backup importado com sucesso. Feche e reabra o app para ver os dados restaurados.'
              );
            } catch (err: any) {
              Alert.alert('Erro', err?.message ?? 'Falha ao restaurar');
            }
          },
        },
      ]
    );
  }, []);

  const handlePdf = useCallback(async () => {
    try {
      const now = new Date();
      await pdfService.generateMonthlyReport(now.getFullYear(), now.getMonth() + 1);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao gerar PDF');
    }
  }, []);

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
    <View style={[styles.root, { backgroundColor: themeColors.papel }]}>
      <AmbientBg variant="soft" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
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

          <Pressable style={styles.row} onPress={handleExport} disabled={exporting}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,160,76,0.15)' }]}>
              <Ionicons name="share-outline" size={18} color={colors.mangaDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Exportar dados</Text>
              <Text style={styles.rowSub}>
                {exporting ? 'Gerando resumo...' : 'WhatsApp, e-mail ou arquivo'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row} onPress={handleBackup} disabled={backupping}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(26,58,46,0.08)' }]}>
              <Ionicons name="archive-outline" size={18} color={colors.mata} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Backup completo</Text>
              <Text style={styles.rowSub}>
                {backupping ? 'Copiando banco...' : '.sqlite com todos dados'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row} onPress={handleRestore}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(122,160,91,0.15)' }]}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.casca} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Restaurar de backup</Text>
              <Text style={styles.rowSub}>Importar .sqlite previamente salvo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row} onPress={handlePdf}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,160,76,0.15)' }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.mangaDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Relatório PDF mensal</Text>
              <Text style={styles.rowSub}>Anotações + fotos + financeiro do mês</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
          </Pressable>

          <Pressable style={styles.row} onPress={cycleDarkMode}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(74,124,89,0.12)' }]}>
              <Ionicons name="moon-outline" size={18} color={colors.broto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Modo escuro</Text>
              <Text style={styles.rowSub}>
                {darkMode === 'system' ? 'Automático (sistema)' : darkMode === 'dark' ? 'Sempre escuro' : 'Sempre claro'}
              </Text>
            </View>
            <View style={styles.darkPill}>
              <Text style={styles.darkPillText}>{darkMode === 'system' ? 'auto' : darkMode === 'dark' ? 'on' : 'off'}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.row} onPress={() => setSoundEnabled(!soundEnabled)}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,160,76,0.15)' }]}>
              <Ionicons name="water-outline" size={18} color={colors.mangaDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Som de confirmação</Text>
              <Text style={styles.rowSub}>Gota d'água ao marcar visita</Text>
            </View>
            <View style={[styles.toggle, soundEnabled && styles.toggleOn]}>
              <View style={[styles.toggleKnob, soundEnabled && styles.toggleKnobOn]} />
            </View>
          </Pressable>
        </View>

        <Pressable
          style={[styles.row, { marginTop: 12 }]}
          onPress={() => {
            const r = runDateTests();
            Alert.alert(
              r.failed === 0 ? '✓ Tests passaram' : '✗ Falha em tests',
              `${r.passed} OK · ${r.failed} falhou${r.errors.length > 0 ? '\n\n' + r.errors.join('\n') : ''}`
            );
          }}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(26,58,46,0.08)' }]}>
            <Ionicons name="bug-outline" size={18} color={colors.mata} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Validar virada de ano</Text>
            <Text style={styles.rowSub}>Testes ISO weeks 31/12 → 01/01</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
        </Pressable>

        <Pressable style={styles.logout} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>

        <Text style={styles.version}>
          Leonardo Mudas · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>

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
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
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
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
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
  darkPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(26,58,46,0.08)',
    borderRadius: 999,
  },
  darkPillText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: colors.ink2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, padding: 14,
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius: 18,
  },
  logoutText: { color: colors.danger, fontFamily: fonts.uiSemibold, fontSize: 14 },
  version: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.ink4,
  },
});
