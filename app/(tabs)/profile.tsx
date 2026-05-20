import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const ROWS = [
  { icon: 'finger-print', label: 'Autenticação biométrica', sub: 'Face ID / digital' },
  { icon: 'moon-outline', label: 'Modo escuro', sub: 'Automático' },
  { icon: 'volume-medium-outline', label: 'Som de confirmação', sub: 'Gota d’água ao marcar' },
  { icon: 'calendar-outline', label: 'Início da semana', sub: 'Segunda-feira' },
  { icon: 'share-outline', label: 'Exportar dados', sub: 'WhatsApp ou ZIP' },
  { icon: 'archive-outline', label: 'Backup completo', sub: '.sqlite + mídias' },
] as const;

export default function ProfileScreen() {
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
            <Text style={styles.avatarText}>L</Text>
          </View>
          <View>
            <Text style={styles.name}>Leonardo</Text>
            <Text style={styles.email}>consultor de mudas</Text>
          </View>
        </View>

        <View style={styles.list}>
          {ROWS.map((row) => (
            <Pressable key={row.label} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon as any} size={18} color={colors.broto} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowSub}>{row.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
            </Pressable>
          ))}
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.mata, letterSpacing: -0.3 },
  email: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink3, marginTop: 2 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
});
