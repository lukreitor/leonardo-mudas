import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { useOnboarding } from '@/stores/onboarding';

const { width: W } = Dimensions.get('window');

type Slide = {
  title: string;
  body: string;
  illustration: 'broto' | 'tap' | 'mic';
};

const SLIDES: Slide[] = [
  {
    title: 'Suas fazendas, organizadas',
    body: 'Veja todas as visitas da semana num só lugar. Toque pra marcar uma fazenda como visitada — segura pra pular essa semana.',
    illustration: 'tap',
  },
  {
    title: 'Anotações com voz, foto e vídeo',
    body: 'Em cada visita você grava áudio, tira fotos e escreve observações. Tudo organizado por semana, pra mostrar pro dono quando quiser.',
    illustration: 'mic',
  },
  {
    title: 'Cobrança no controle',
    body: 'Cadastra como ganha (visita, mensal, comissão). App lembra dos vencimentos, calcula o que entrou no mês e mostra atrasos.',
    illustration: 'broto',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const markDone = useOnboarding((s) => s.markDone);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await markDone();
    router.replace('/(tabs)' as any);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <LinearGradient colors={['#F8F2E5', '#EFE5D0']} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.top}>
          <View />
          <Pressable onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Pular</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.illustrationWrap}>
                <Illustration kind={item.illustration} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>

          <Pressable style={styles.cta} onPress={next}>
            <LinearGradient
              colors={[colors.manga, colors.mangaDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaText}>
              {index === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Illustration({ kind }: { kind: Slide['illustration'] }) {
  if (kind === 'broto') return <EmptyIllustration size={200} />;
  if (kind === 'tap') {
    return (
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <Circle cx={100} cy={100} r={70} fill="rgba(74,124,89,0.15)" />
        <Circle cx={100} cy={100} r={50} fill={colors.broto} />
        <Path d="M85 100 L95 110 L120 85" stroke="white" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={100} cy={100} r={90} stroke={colors.broto} strokeWidth={2} strokeDasharray="4 6" fill="none" opacity={0.4} />
      </Svg>
    );
  }
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={70} fill="rgba(232,160,76,0.15)" />
      <Circle cx={100} cy={100} r={50} fill={colors.manga} />
      <Path d="M100 80 L100 110 M90 110 L110 110 M95 100 Q100 105 105 100" stroke="white" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Ellipse cx={100} cy={100} rx={20} ry={28} stroke="white" strokeWidth={3} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skip: { fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.ink3 },
  slide: { width: W, alignItems: 'center', paddingHorizontal: 32, paddingTop: 24 },
  illustrationWrap: { marginBottom: 32 },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.mata,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 16,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },
  bottom: { paddingHorizontal: 32, paddingBottom: 32 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(26,58,46,0.2)' },
  dotActive: { width: 24, backgroundColor: colors.manga },
  cta: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 16, letterSpacing: 0.2 },
});
