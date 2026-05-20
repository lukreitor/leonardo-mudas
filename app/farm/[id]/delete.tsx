import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_R = 18;
const RING_CIRC = 2 * Math.PI * RING_R;

import { farmsRepo } from '@/repositories/farms';
import { farmsService, type FarmCounts } from '@/services/farms';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Farm } from '@/db/schema';

const HOLD_MS = 3000;

export default function DeleteFarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmId = Number(id);
  const router = useRouter();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [counts, setCounts] = useState<FarmCounts | null>(null);
  const [stage, setStage] = useState<'choice' | 'confirm'>('choice');
  const [typed, setTyped] = useState('');
  const [holdDone, setHoldDone] = useState(false);

  const progress = useSharedValue(0);
  const holdingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const f = await farmsRepo.getById(farmId);
      const c = await farmsService.countContent(farmId);
      setFarm(f);
      setCounts(c);
    })();
  }, [farmId]);

  const deactivate = useCallback(async () => {
    await farmsRepo.softDelete(farmId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    router.back();
  }, [farmId, router]);

  const finalizeDelete = useCallback(async () => {
    holdingRef.current = false;
    setHoldDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await farmsService.hardDeleteWithCascade(farmId);
    router.back();
    router.back();
  }, [farmId, router]);

  const startHold = useCallback(() => {
    if (!farm || typed !== farm.name) return;
    holdingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    progress.value = 0;
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (finished) => {
      if (finished && holdingRef.current) {
        runOnJS(finalizeDelete)();
      }
    });
  }, [farm, typed, progress, finalizeDelete]);

  const stopHold = useCallback(() => {
    if (holdDone) return;
    holdingRef.current = false;
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 240 });
  }, [progress, holdDone]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRC * (1 - progress.value),
  }));

  if (!farm || !counts) return <View style={{ flex: 1, backgroundColor: 'rgba(14,27,20,0.55)' }} />;

  const nameMatches = typed === farm.name;

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {stage === 'choice' ? (
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{farm.name}</Text>
            <Text style={styles.subtitle}>O que você quer fazer?</Text>

            <Pressable style={[styles.option, styles.optionSafe]} onPress={deactivate}>
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(74,124,89,0.15)' }]}>
                <Ionicons name="moon-outline" size={20} color={colors.broto} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Desativar</Text>
                <Text style={styles.optionSub}>
                  Some da home e da lista. Histórico, mídias e anotações preservados. Pode reativar depois.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </Pressable>

            <Pressable style={[styles.option, styles.optionDanger]} onPress={() => setStage('confirm')}>
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(220,53,69,0.1)' }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </View>
              <View style={styles.optionBody}>
                <Text style={[styles.optionTitle, { color: colors.danger }]}>Excluir definitivamente</Text>
                <Text style={styles.optionSub}>
                  Apaga TUDO. Não tem volta. Requer 3 confirmações.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </Pressable>

            <Pressable style={styles.cancel} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.warnIcon}>
              <Ionicons name="warning" size={32} color={colors.danger} />
            </View>
            <Text style={styles.title}>Excluir definitivamente?</Text>
            <Text style={styles.subtitle}>{farm.name} · esta ação não tem volta</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentLabel}>Você vai apagar</Text>
              <View style={styles.contentItems}>
                <View style={styles.contentItem}>
                  <Text style={styles.contentNum}>{counts.notes}</Text>
                  <Text style={styles.contentText}>anotações</Text>
                </View>
                <View style={styles.contentItem}>
                  <Text style={styles.contentNum}>{counts.photos}</Text>
                  <Text style={styles.contentText}>fotos</Text>
                </View>
                <View style={styles.contentItem}>
                  <Text style={styles.contentNum}>{counts.audios}</Text>
                  <Text style={styles.contentText}>áudios</Text>
                </View>
                <View style={styles.contentItem}>
                  <Text style={styles.contentNum}>{counts.videos}</Text>
                  <Text style={styles.contentText}>vídeos</Text>
                </View>
              </View>
            </View>

            <Text style={styles.step}>
              Etapa <Text style={styles.stepStrong}>2 de 3</Text> · digite o nome
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                placeholder={`digite: ${farm.name}`}
                placeholderTextColor={colors.ink4}
                style={styles.input}
                autoCapitalize="none"
              />
              {nameMatches ? (
                <View style={styles.inputCheck}>
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              ) : null}
            </View>

            <Text style={styles.step}>
              Etapa <Text style={styles.stepStrong}>3 de 3</Text> · segure 3s
            </Text>

            <Pressable
              onPressIn={startHold}
              onPressOut={stopHold}
              disabled={!nameMatches}
              style={[styles.holdBtn, !nameMatches && styles.holdBtnDisabled]}>
              <View style={styles.holdContent}>
                <View style={styles.ringWrap}>
                  <Svg width={44} height={44} viewBox="0 0 44 44">
                    <Circle cx={22} cy={22} r={RING_R} stroke="rgba(255,255,255,0.18)" strokeWidth={3} fill="none" />
                    <AnimatedCircle
                      cx={22}
                      cy={22}
                      r={RING_R}
                      stroke="white"
                      strokeWidth={3}
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={RING_CIRC}
                      animatedProps={ringAnimatedProps}
                      transform="rotate(-90 22 22)"
                    />
                  </Svg>
                  <View style={styles.ringIcon}>
                    <Ionicons name="hand-left" size={16} color="white" />
                  </View>
                </View>
                <Text style={styles.holdText}>
                  {!nameMatches ? 'Digite o nome primeiro' : 'Mantenha pressionado 3s'}
                </Text>
              </View>
            </Pressable>

            <Text style={styles.hint}>Solte antes de 3s para cancelar</Text>

            <Pressable style={styles.cancel} onPress={() => setStage('choice')}>
              <Text style={styles.cancelText}>Voltar</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(14,27,20,0.55)' },
  backdrop: StyleSheet.absoluteFillObject,
  sheet: {
    marginTop: 'auto',
    backgroundColor: colors.papel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.25,
    shadowRadius: 48,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(26,58,46,0.18)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  warnIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFE6E6',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink1,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 22,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26,58,46,0.06)',
    marginBottom: 10,
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  optionSafe: { borderColor: 'rgba(74,124,89,0.18)' },
  optionDanger: { borderColor: 'rgba(220,53,69,0.2)' },
  optionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionBody: { flex: 1 },
  optionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink1,
    letterSpacing: -0.2,
  },
  optionSub: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 3,
    lineHeight: 17,
  },
  contentBox: {
    backgroundColor: 'rgba(220,53,69,0.05)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.12)',
  },
  contentLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.danger,
    marginBottom: 10,
  },
  contentItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contentItem: {
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
  },
  contentNum: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.danger },
  contentText: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.ink1 },
  step: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 8,
  },
  stepStrong: { color: colors.mangaDeep },
  inputWrap: { position: 'relative', marginBottom: 16 },
  input: {
    padding: 16,
    paddingRight: 44,
    fontSize: 16,
    fontFamily: fonts.ui,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(220,53,69,0.25)',
    borderRadius: 14,
    color: colors.ink1,
  },
  inputCheck: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -11 }],
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.broto,
    alignItems: 'center', justifyContent: 'center',
  },
  holdBtn: {
    position: 'relative',
    padding: 20,
    backgroundColor: colors.danger,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  holdBtnDisabled: { opacity: 0.4 },
  holdContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ringWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ringIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  holdText: { color: 'white', fontFamily: fonts.uiBold, fontSize: 14, letterSpacing: 0.3 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.ink3, marginBottom: 14 },
  cancel: { padding: 14, alignItems: 'center', backgroundColor: 'rgba(26,58,46,0.05)', borderRadius: 14 },
  cancelText: { fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.ink2 },
});
