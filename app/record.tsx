import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { notesService } from '@/services/notes';

type Mode = 'audio' | 'photo' | 'video' | 'text';

export default function RecordScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const farmIdNum = Number(farmId);

  const [mode, setMode] = useState<Mode>('audio');
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [textNote, setTextNote] = useState('');
  const [title, setTitle] = useState('');

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulse = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permissão negada', 'Habilite o microfone nas configurações para gravar áudio.');
      }
    })();
    pulse.value = withRepeat(withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: isRecording ? pulse.value : 1 }] }));

  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setElapsed(0);
      tickerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível gravar');
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      if (tickerRef.current) clearInterval(tickerRef.current);
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      if (!uri) return;

      const note = await notesService.createNote(farmIdNum, { title: title || 'Áudio', kind: 'talk' });
      await notesService.addMedia(note.id, { type: 'audio', filePath: uri, durationSec: elapsed });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Erro ao salvar áudio');
      setIsRecording(false);
    }
  }, [audioRecorder, elapsed, farmIdNum, isRecording, router, title]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Habilite a câmera para tirar fotos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;

    const note = await notesService.createNote(farmIdNum, { title: title || 'Foto', kind: 'growth' });
    await notesService.addMedia(note.id, { type: 'photo', filePath: result.assets[0].uri });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [farmIdNum, router, title]);

  const recordVideo = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Habilite a câmera para gravar vídeo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;

    const note = await notesService.createNote(farmIdNum, { title: title || 'Vídeo', kind: 'growth' });
    await notesService.addMedia(note.id, {
      type: 'video',
      filePath: result.assets[0].uri,
      durationSec: (result.assets[0].duration ?? 0) / 1000,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [farmIdNum, router, title]);

  const saveText = useCallback(async () => {
    if (!textNote.trim()) {
      Alert.alert('Texto vazio', 'Escreva alguma coisa antes de salvar.');
      return;
    }
    await notesService.createNote(farmIdNum, {
      title: title || 'Anotação',
      kind: 'other',
      noteText: textNote.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [farmIdNum, router, textNote, title]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={[colors.mata, colors.noite]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <View style={styles.farmChip}>
              <Ionicons name="leaf" size={14} color={colors.mangaSoft} />
              <Text style={styles.farmChipText}>Fazenda #{farmId ?? '?'}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.titleWrap}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="título opcional (ex: 'brotos do leste')"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.titleInput}
              />
            </View>

            <View style={styles.center}>
              {mode === 'audio' ? (
                <>
                  <Text style={styles.timer}>{formatTime(elapsed)}</Text>
                  <Text style={styles.hint}>
                    {isRecording ? 'gravando · toque para parar' : 'toque para gravar áudio'}
                  </Text>
                </>
              ) : mode === 'text' ? (
                <View style={styles.textWrap}>
                  <TextInput
                    value={textNote}
                    onChangeText={setTextNote}
                    multiline
                    placeholder="escreva sua observação..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.textArea}
                  />
                </View>
              ) : (
                <View style={styles.captureHint}>
                  <Ionicons
                    name={mode === 'photo' ? 'camera-outline' : 'videocam-outline'}
                    size={56}
                    color={colors.mangaSoft}
                  />
                  <Text style={styles.hint}>
                    {mode === 'photo' ? 'toque para tirar foto' : 'toque para gravar vídeo'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.bottom}>
              <Animated.View style={pulseStyle}>
                <Pressable
                  style={styles.recordBtn}
                  onPress={
                    mode === 'audio'
                      ? isRecording
                        ? stopRecording
                        : startRecording
                      : mode === 'photo'
                        ? takePhoto
                        : mode === 'video'
                          ? recordVideo
                          : saveText
                  }>
                  {mode === 'audio' ? (
                    isRecording ? (
                      <View style={styles.recordSquare} />
                    ) : (
                      <View style={styles.recordInner} />
                    )
                  ) : mode === 'text' ? (
                    <Ionicons name="checkmark" size={36} color="white" />
                  ) : (
                    <Ionicons name={mode === 'photo' ? 'camera' : 'videocam'} size={32} color="white" />
                  )}
                </Pressable>
              </Animated.View>

              <View style={styles.modes}>
                {(['audio', 'photo', 'video', 'text'] as Mode[]).map((m) => (
                  <Pressable key={m} onPress={() => setMode(m)} style={[styles.mode, mode === m && styles.modeActive]}>
                    <Text style={[styles.modeText, mode === m && styles.modeActiveText]}>
                      {m === 'audio' ? 'Áudio' : m === 'photo' ? 'Foto' : m === 'video' ? 'Vídeo' : 'Nota'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  titleWrap: { paddingHorizontal: 32, paddingTop: 32 },
  titleInput: {
    color: 'white',
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, minHeight: 280 },
  timer: { color: 'white', fontFamily: fonts.display, fontSize: 72, letterSpacing: -2.6 },
  hint: { color: colors.mangaSoft, fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 15, marginTop: 6 },
  captureHint: { alignItems: 'center', gap: 12 },
  textWrap: { width: '100%' },
  textArea: {
    color: 'white',
    fontFamily: fonts.ui,
    fontSize: 17,
    lineHeight: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  bottom: { alignItems: 'center', gap: 22, paddingBottom: 20, paddingTop: 12 },
  recordBtn: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.manga,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mangaDeep, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 48, elevation: 12,
  },
  recordInner: { width: 32, height: 32, backgroundColor: 'white', borderRadius: 8 },
  recordSquare: { width: 24, height: 24, backgroundColor: 'white', borderRadius: 4 },
  modes: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 4, borderRadius: 999,
  },
  mode: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  modeActive: { backgroundColor: 'white' },
  modeText: {
    color: 'rgba(255,255,255,0.5)', fontFamily: fonts.uiSemibold, fontSize: 11,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  modeActiveText: { color: colors.mata },
});
