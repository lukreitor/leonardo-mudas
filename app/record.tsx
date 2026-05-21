import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';

import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { notesService } from '@/services/notes';
import { farmsRepo } from '@/repositories/farms';
import { showDialog } from '@/stores/dialog';
import { initialsOf } from '@/lib/initials';
import { RecordWaveform } from '@/components/RecordWaveform';
import type { Farm } from '@/db/schema';

type Mode = 'audio' | 'photo' | 'video' | 'text';
type Kind = 'growth' | 'water' | 'soil' | 'talk' | 'other';

const KIND_OPTIONS: { value: Kind; label: string; icon: string }[] = [
  { value: 'growth', label: 'Broto', icon: 'leaf-outline' },
  { value: 'water', label: 'Molhação', icon: 'water-outline' },
  { value: 'soil', label: 'Solo', icon: 'flower-outline' },
  { value: 'talk', label: 'Conversa', icon: 'mic-outline' },
  { value: 'other', label: 'Outro', icon: 'ellipse-outline' },
];

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
  const [kind, setKind] = useState<Kind>('growth');

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recPulse = useSharedValue(1);
  const recDot = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        showDialog({ icon: 'warning', title: 'Permissão negada', body: 'Habilite o microfone nas configurações para gravar áudio.' });
      }
      if (farmIdNum) {
        const f = await farmsRepo.getById(farmIdNum);
        setFarm(f);
      }
    })();
  }, [farmIdNum]);

  useEffect(() => {
    // Botão sempre pulsa (mock: pulse-record infinite). Mais intenso quando gravando.
    const peak = isRecording ? 1.12 : 1.05;
    const dur = isRecording ? 1000 : 1800;
    recPulse.value = withRepeat(
      withSequence(
        withTiming(peak, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (isRecording) {
      recDot.value = withRepeat(
        withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
        -1,
        false
      );
    } else {
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
      showDialog({ icon: 'error', title: 'Erro', body: err?.message ?? 'Não foi possível gravar' });
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
      const note = await notesService.createNote(farmIdNum, { title: title || 'Áudio', kind: kind === 'other' ? 'talk' : kind });
      await notesService.addMedia(note.id, { type: 'audio', filePath: uri, durationSec: elapsed });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      showDialog({ icon: 'error', title: 'Erro', body: err?.message ?? 'Erro ao salvar áudio' });
      setIsRecording(false);
    }
  }, [audioRecorder, elapsed, farmIdNum, isRecording, router, title]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showDialog({ icon: 'warning', title: 'Permissão negada', body: 'Habilite a câmera para tirar fotos.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;

    const note = await notesService.createNote(farmIdNum, { title: title || 'Foto', kind });
    await notesService.addMedia(note.id, { type: 'photo', filePath: result.assets[0].uri });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [farmIdNum, router, title]);

  const recordVideo = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showDialog({ icon: 'warning', title: 'Permissão negada', body: 'Habilite a câmera para gravar vídeo.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;

    const note = await notesService.createNote(farmIdNum, { title: title || 'Vídeo', kind });
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
      showDialog({ icon: 'warning', title: 'Texto vazio', body: 'Escreva alguma coisa antes de salvar.' });
      return;
    }
    await notesService.createNote(farmIdNum, {
      title: title || 'Anotação',
      kind,
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
      {/* Radial BG ellipse #1A3A2E at center -> #0E1B14 edges */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="50%" rx="65%" ry="65%">
            <Stop offset="0" stopColor="#1A3A2E" stopOpacity="1" />
            <Stop offset="1" stopColor="#0E1B14" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="amber" cx="50%" cy="30%" rx="55%" ry="40%">
            <Stop offset="0" stopColor="#E8A04C" stopOpacity="0.12" />
            <Stop offset="0.6" stopColor="#E8A04C" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="green" cx="50%" cy="70%" rx="40%" ry="40%">
            <Stop offset="0" stopColor="#4A7C59" stopOpacity="0.18" />
            <Stop offset="0.7" stopColor="#4A7C59" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
        <Rect width="100%" height="100%" fill="url(#amber)" />
        <Rect width="100%" height="100%" fill="url(#green)" />
      </Svg>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.cancelWrap}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <View style={styles.farmChipWrap}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.farmChip}>
              <View style={[styles.farmAv, { backgroundColor: farmAvatarColor }]}>
                <Text style={styles.farmAvText}>{farm ? initialsOf(farm.name) : '?'}</Text>
              </View>
              <Text style={styles.farmChipText}>{farm?.name ?? 'Fazenda'}</Text>
            </View>
          </View>
        </View>

        {/* Center: timer (audio mode) OR text editor OR camera hint */}
        <View pointerEvents="box-none" style={styles.center}>
          {mode === 'audio' ? (
            <>
              <View style={styles.timerRow}>
                {isRecording ? (
                  <Animated.View style={[styles.recDot, recDotStyle]} />
                ) : null}
                <Text style={styles.timer}>{formatTime(elapsed)}</Text>
              </View>
              <Text style={styles.label}>
                {isRecording ? 'gravando áudio · solte para finalizar' : 'segure o botão para gravar áudio'}
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
                size={64}
                color={colors.mangaSoft}
              />
              <Text style={styles.label}>
                {mode === 'photo' ? 'toque para tirar foto' : 'toque para gravar vídeo'}
              </Text>
            </View>
          )}
        </View>

        {/* Optional title field (very subtle, between center and waveform) */}
        <View style={styles.titleWrap}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="título opcional (ex: 'brotos do leste')"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.titleInput}
          />
          <View style={styles.kindRow}>
            {KIND_OPTIONS.map((k) => (
              <Pressable
                key={k.value}
                onPress={() => setKind(k.value)}
                style={[styles.kindChip, kind === k.value && styles.kindChipActive]}>
                <Ionicons name={k.icon as any} size={11} color={kind === k.value ? colors.mata : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.kindChipText, kind === k.value && styles.kindChipTextActive]}>{k.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Waveform absolute bottom 220 */}
        {mode === 'audio' ? (
          <View pointerEvents="none" style={styles.wavefAbs}>
            <RecordWaveform active={isRecording} />
          </View>
        ) : null}

        {/* Record button wrap absolute bottom 80 */}
        <View pointerEvents="box-none" style={styles.recordWrap}>
          <Animated.View style={pulseStyle}>
            {mode === 'audio' ? (
              <Pressable
                onPressIn={startRecording}
                onPressOut={stopAndSave}
                style={styles.recordBtnTouch}>
                <View style={styles.ringOuter} />
                <View style={styles.ringMid} />
                <LinearGradient
                  colors={[colors.manga, colors.mangaDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recordBtn}>
                  <View style={isRecording ? styles.recordSquare : styles.recordInner} />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                style={styles.recordBtnTouch}
                onPress={mode === 'photo' ? takePhoto : mode === 'video' ? recordVideo : saveText}>
                <View style={styles.ringOuter} />
                <View style={styles.ringMid} />
                <LinearGradient
                  colors={[colors.manga, colors.mangaDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recordBtn}>
                  {mode === 'text' ? (
                    <Ionicons name="checkmark" size={36} color="white" />
                  ) : (
                    <Ionicons name={mode === 'photo' ? 'camera' : 'videocam'} size={32} color="white" />
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>
          <Text style={styles.hint}>
            {mode === 'audio' ? (isRecording ? 'solte para finalizar' : 'segurando para gravar') : ''}
          </Text>
        </View>

        {/* Mode pills absolute bottom 24 */}
        <View style={styles.modesAbs}>
          <BlurView intensity={20} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1B14' },

  topRow: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  cancelWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.uiMedium, fontSize: 14 },
  farmChipWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  farmChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingLeft: 6, paddingRight: 14, paddingVertical: 6,
  },
  farmAv: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  farmAvText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 13 },
  farmChipText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 13 },

  center: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  timer: {
    color: 'white',
    fontFamily: fonts.display,
    fontSize: 72,
    letterSpacing: -2.6,
  },
  label: {
    color: colors.mangaSoft,
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },

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
    minHeight: 160,
    textAlignVertical: 'top',
  },

  titleWrap: {
    position: 'absolute',
    top: 130,
    left: 36,
    right: 36,
    zIndex: 5,
  },
  titleInput: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  kindChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
  },
  kindChipActive: { backgroundColor: 'white' },
  kindChipText: {
    fontFamily: fonts.uiSemibold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  kindChipTextActive: { color: '#1A3A2E' },

  wavefAbs: {
    position: 'absolute',
    bottom: 220,
    left: 24,
    right: 24,
    height: 80,
  },

  recordWrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
    zIndex: 5,
  },
  recordBtnTouch: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: 'rgba(232,160,76,0.08)',
  },
  ringMid: {
    position: 'absolute',
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(232,160,76,0.15)',
  },
  recordBtn: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 48,
    elevation: 12,
  },
  recordInner: { width: 32, height: 32, backgroundColor: 'white', borderRadius: 16 },
  recordSquare: { width: 28, height: 28, backgroundColor: 'white', borderRadius: 4 },
  hint: {
    fontSize: 13,
    fontFamily: fonts.uiMedium,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },

  modesAbs: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  modes: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mode: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  modeActive: { backgroundColor: 'white' },
  modeText: {
    color: 'rgba(255,255,255,0.5)', fontFamily: fonts.uiSemibold, fontSize: 11,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  modeActiveText: { color: colors.mata },
});
