import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { notesService } from '@/services/notes';
import { farmsRepo } from '@/repositories/farms';
import { initialsOf } from '@/lib/initials';
import { RecordWaveform } from '@/components/RecordWaveform';
import type { Farm } from '@/db/schema';

type Mode = 'audio' | 'photo' | 'video' | 'text';

export default function RecordScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const farmIdNum = Number(farmId);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [mode, setMode] = useState<Mode>('audio');
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [textNote, setTextNote] = useState('');
  const [title, setTitle] = useState('');

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recPulse = useSharedValue(1);
  const recDot = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permissão negada', 'Habilite o microfone nas configurações para gravar áudio.');
      }
      if (farmIdNum) {
        const f = await farmsRepo.getById(farmIdNum);
        setFarm(f);
      }
    })();
  }, [farmIdNum]);

  useEffect(() => {
    if (isRecording) {
      recPulse.value = withRepeat(
        withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      recDot.value = withRepeat(
        withSequence(withTiming(1, { duration: 600 }), withTiming(0.25, { duration: 600 })),
        -1,
        true
      );
    } else {
      recPulse.value = withTiming(1);
      recDot.value = withTiming(1);
    }
  }, [isRecording, recPulse, recDot]);

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: recPulse.value }] }));
  const recDotStyle = useAnimatedStyle(() => ({ opacity: recDot.value }));

  const startRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setElapsed(0);
      tickerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível gravar');
    }
  }, [audioRecorder]);

  const stopAndSave = useCallback(async () => {
    if (!isRecording) return;
    try {
      if (tickerRef.current) clearInterval(tickerRef.current);
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      if (!uri) {
        router.back();
        return;
      }
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

  const farmAvatarColor = farm?.colorToken ?? farmColors[(farmIdNum - 1) % farmColors.length];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.mata, colors.noite]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <View style={styles.farmChip}>
              <View style={[styles.farmAv, { backgroundColor: farmAvatarColor }]}>
                <Text style={styles.farmAvText}>{farm ? initialsOf(farm.name) : '?'}</Text>
              </View>
              <Text style={styles.farmChipText}>{farm?.name ?? 'Fazenda'}</Text>
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
                  <View style={styles.timerRow}>
                    {isRecording ? (
                      <Animated.View style={[styles.recDot, recDotStyle]} />
                    ) : null}
                    <Text style={styles.timer}>{formatTime(elapsed)}</Text>
                  </View>
                  <Text style={styles.hint}>
                    {isRecording ? 'gravando áudio · solte para finalizar' : 'segure o botão para gravar'}
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

            {mode === 'audio' ? (
              <View style={styles.wavefWrap}>
                <RecordWaveform active={isRecording} />
              </View>
            ) : null}

            <View style={styles.bottom}>
              <Animated.View style={pulseStyle}>
                {mode === 'audio' ? (
                  <Pressable
                    onPressIn={startRecording}
                    onPressOut={stopAndSave}
                    style={styles.recordBtn}>
                    <View style={styles.recordRingOuter} />
                    <View style={styles.recordRingMid} />
                    <View style={isRecording ? styles.recordSquare : styles.recordInner} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.recordBtn}
                    onPress={
                      mode === 'photo' ? takePhoto : mode === 'video' ? recordVideo : saveText
                    }>
                    {mode === 'text' ? (
                      <Ionicons name="checkmark" size={36} color="white" />
                    ) : (
                      <Ionicons name={mode === 'photo' ? 'camera' : 'videocam'} size={32} color="white" />
                    )}
                  </Pressable>
                )}
              </Animated.View>

              <View style={styles.modes}>
                {(['audio', 'photo', 'video', 'text'] as Mode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => !isRecording && setMode(m)}
                    style={[styles.mode, mode === m && styles.modeActive]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.noite },
  ambientTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 500,
    height: 400,
    borderRadius: 250,
    backgroundColor: 'rgba(232,160,76,0.12)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(74,124,89,0.18)',
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 12,
  },
  cancel: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  cancelText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.uiMedium, fontSize: 14 },
  farmChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  farmAv: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  farmAvText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 12 },
  farmChipText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 13 },
  titleWrap: { paddingHorizontal: 32, paddingTop: 24 },
  titleInput: {
    color: 'white',
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 32, minHeight: 200 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
  },
  timer: { color: 'white', fontFamily: fonts.display, fontSize: 72, letterSpacing: -2.6 },
  hint: { color: colors.mangaSoft, fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 15, marginTop: 8, textAlign: 'center' },
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
  wavefWrap: { marginTop: 28 },
  bottom: { alignItems: 'center', gap: 22, paddingBottom: 20, paddingTop: 24 },
  recordBtn: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.manga,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mangaDeep, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 48, elevation: 12,
    position: 'relative',
  },
  recordRingOuter: {
    position: 'absolute',
    top: -22, left: -22, right: -22, bottom: -22,
    borderRadius: 72,
    backgroundColor: 'rgba(232,160,76,0.08)',
  },
  recordRingMid: {
    position: 'absolute',
    top: -10, left: -10, right: -10, bottom: -10,
    borderRadius: 60,
    backgroundColor: 'rgba(232,160,76,0.15)',
  },
  recordInner: { width: 32, height: 32, backgroundColor: 'white', borderRadius: 16 },
  recordSquare: { width: 28, height: 28, backgroundColor: 'white', borderRadius: 4 },
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
