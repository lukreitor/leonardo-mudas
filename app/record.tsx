import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export default function RecordScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

  return (
    <LinearGradient colors={[colors.mata, colors.noite]} style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <View style={styles.farmChip}>
            <Ionicons name="leaf" size={14} color={colors.mangaSoft} />
            <Text style={styles.farmChipText}>Fazenda {farmId ?? '?'}</Text>
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.timer}>00:00</Text>
          <Text style={styles.hint}>segure o botão para gravar áudio</Text>
        </View>

        <View style={styles.bottom}>
          <Pressable style={styles.recordBtn}>
            <View style={styles.recordInner} />
          </Pressable>

          <View style={styles.modes}>
            {['Áudio', 'Foto', 'Vídeo', 'Nota'].map((m, i) => (
              <Pressable key={m} style={[styles.mode, i === 0 && styles.modeActive]}>
                <Text style={[styles.modeText, i === 0 && styles.modeActiveText]}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 12,
  },
  cancel: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  cancelText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.uiMedium, fontSize: 14 },
  farmChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  farmChipText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timer: { color: 'white', fontFamily: fonts.display, fontSize: 72, letterSpacing: -2.6 },
  hint: { color: colors.mangaSoft, fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 15, marginTop: 6 },
  bottom: { alignItems: 'center', gap: 22, paddingBottom: 20 },
  recordBtn: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.manga,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mangaDeep, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 48, elevation: 12,
  },
  recordInner: { width: 32, height: 32, backgroundColor: 'white', borderRadius: 8 },
  modes: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 4, borderRadius: 999,
  },
  mode: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
  modeActive: { backgroundColor: 'white' },
  modeText: {
    color: 'rgba(255,255,255,0.5)', fontFamily: fonts.uiSemibold, fontSize: 12,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  modeActiveText: { color: colors.mata },
});
