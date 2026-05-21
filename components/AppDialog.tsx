import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useDialog, type DialogIcon } from '@/stores/dialog';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const ICONS: Record<DialogIcon, { name: string; color: string; bg: string }> = {
  warning: { name: 'warning', color: '#E8A04C', bg: 'rgba(232,160,76,0.15)' },
  check: { name: 'checkmark-circle', color: colors.broto, bg: 'rgba(74,124,89,0.15)' },
  info: { name: 'information-circle', color: colors.mata, bg: 'rgba(26,58,46,0.1)' },
  trash: { name: 'trash', color: colors.danger, bg: 'rgba(220,53,69,0.15)' },
  save: { name: 'save', color: colors.broto, bg: 'rgba(74,124,89,0.15)' },
  error: { name: 'close-circle', color: colors.danger, bg: 'rgba(220,53,69,0.15)' },
  leaf: { name: 'leaf', color: colors.broto, bg: 'rgba(74,124,89,0.15)' },
};

export function AppDialog() {
  const current = useDialog((s) => s.current);
  const hide = useDialog((s) => s.hide);

  if (!current) return null;

  const buttons = current.buttons ?? [{ label: 'Ok', style: 'primary' }];
  const icon = current.icon ? ICONS[current.icon] : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={hide}>
      <View style={styles.root}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={hide} />

        <View style={styles.sheet}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
              <Ionicons name={icon.name as any} size={28} color={icon.color} />
            </View>
          ) : null}

          <Text style={styles.title}>{current.title}</Text>
          {current.body ? <Text style={styles.body}>{current.body}</Text> : null}

          <View style={styles.buttons}>
            {buttons.map((btn, i) => {
              const style = btn.style ?? 'default';
              return (
                <Pressable
                  key={`${btn.label}-${i}`}
                  onPress={() => {
                    hide();
                    setTimeout(() => btn.onPress?.(), 50);
                  }}
                  style={[
                    styles.btn,
                    style === 'primary' && styles.btnPrimary,
                    style === 'destructive' && styles.btnDestructive,
                    style === 'cancel' && styles.btnCancel,
                    style === 'default' && styles.btnDefault,
                  ]}>
                  <Text
                    style={[
                      styles.btnText,
                      style === 'primary' && styles.btnTextLight,
                      style === 'destructive' && styles.btnTextLight,
                      style === 'cancel' && styles.btnTextDim,
                      style === 'default' && styles.btnTextDark,
                    ]}>
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(14,27,20,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.papel,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 48,
    elevation: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.mata,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  body: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    marginTop: 2,
  },
  buttons: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.mata },
  btnDestructive: { backgroundColor: colors.danger },
  btnDefault: { backgroundColor: 'rgba(74,124,89,0.1)' },
  btnCancel: { backgroundColor: 'rgba(26,58,46,0.05)' },
  btnText: { fontFamily: fonts.uiSemibold, fontSize: 15, letterSpacing: -0.1 },
  btnTextLight: { color: 'white' },
  btnTextDark: { color: colors.mata },
  btnTextDim: { color: colors.ink2 },
});
