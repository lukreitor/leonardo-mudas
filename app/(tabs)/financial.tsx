import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export default function FinancialScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <Text style={styles.title}>Financeiro</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.mata, '#234737', '#2D5A47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Text style={styles.heroLabel}>Recebido este mês</Text>
          <Text style={styles.heroAmount}>
            <Text style={styles.currency}>R$ </Text>0
            <Text style={styles.cents}>,00</Text>
          </Text>
          <Text style={styles.heroSub}>Em breve — Fase 3 do roadmap</Text>
        </LinearGradient>

        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Dashboard mensal completo + lista por fazenda + registro de pagamentos chegam na Fase 3.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.mata, letterSpacing: -0.6 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  hero: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.uiSemibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroAmount: { color: 'white', fontFamily: fonts.display, fontSize: 52, letterSpacing: -1.6 },
  currency: { fontSize: 22, opacity: 0.7 },
  cents: { fontSize: 24, opacity: 0.5 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 8 },
  placeholderBox: { marginTop: 20, padding: 20, backgroundColor: colors.neblina, borderRadius: 18 },
  placeholderText: { fontFamily: fonts.displayItalic, fontStyle: 'italic', color: colors.ink2, fontSize: 14, lineHeight: 22 },
});
