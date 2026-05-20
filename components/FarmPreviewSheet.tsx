import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  farm: { id: number; name: string; ownerName: string | null; ownerPhone: string | null; colorToken: string | null } | null;
  lastVisit?: string;
  notesCount?: number;
  paymentSummary?: string;
};

export function FarmPreviewSheet({ visible, onDismiss, farm, lastVisit, notesCount, paymentSummary }: Props) {
  if (!farm) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.sheet}>
          <View style={[styles.avatar, { backgroundColor: farm.colorToken ?? colors.broto }]}>
            <Text style={styles.avatarText}>{initialsOf(farm.name)}</Text>
          </View>
          <Text style={styles.name}>{farm.name}</Text>
          {farm.ownerName ? <Text style={styles.owner}>{farm.ownerName}</Text> : null}

          <View style={styles.row}>
            <Ionicons name="time-outline" size={14} color={colors.ink3} />
            <Text style={styles.rowText}>{lastVisit ?? 'sem visita registrada'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="document-text-outline" size={14} color={colors.ink3} />
            <Text style={styles.rowText}>{notesCount ?? 0} anotações</Text>
          </View>
          {paymentSummary ? (
            <View style={styles.row}>
              <Ionicons name="cash-outline" size={14} color={colors.ink3} />
              <Text style={styles.rowText}>{paymentSummary}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  sheet: {
    backgroundColor: colors.papel,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 48,
    elevation: 18,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 26 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.mata, letterSpacing: -0.3 },
  owner: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.ink3, marginTop: 2, marginBottom: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: colors.neblina,
    borderRadius: 12,
    width: '100%',
    marginBottom: 8,
  },
  rowText: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink1 },
});
