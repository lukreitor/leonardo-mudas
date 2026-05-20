import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type Props = {
  visible: boolean;
  initialTitle?: string;
  initialText?: string;
  onDismiss: () => void;
  onSave: (title: string, text: string) => void;
};

export function EditNoteSheet({ visible, initialTitle, initialText, onDismiss, onSave }: Props) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [text, setText] = useState(initialText ?? '');

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle ?? '');
      setText(initialText ?? '');
    }
  }, [visible, initialTitle, initialText]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>Editar anotação</Text>
            <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.ink2} />
            </Pressable>
          </View>

          <Text style={styles.label}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="opcional"
            placeholderTextColor={colors.ink4}
            style={styles.input}
          />

          <Text style={styles.label}>Texto</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="escreva sua observação"
            placeholderTextColor={colors.ink4}
            style={[styles.input, styles.textArea]}
          />

          <Pressable
            style={styles.saveBtn}
            onPress={() => {
              onSave(title.trim(), text.trim());
              onDismiss();
            }}>
            <Ionicons name="checkmark" size={18} color="white" />
            <Text style={styles.saveText}>Salvar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(14,27,20,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.papel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.25,
    shadowRadius: 48,
    elevation: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(26,58,46,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.mata, letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(26,58,46,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    padding: 14,
    fontSize: 15,
    fontFamily: fonts.ui,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(26,58,46,0.06)',
    borderRadius: 12,
    color: colors.ink1,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.mata,
    borderRadius: 16,
    marginTop: 8,
  },
  saveText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 15 },
});
