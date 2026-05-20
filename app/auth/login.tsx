import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const has = await authService.hasAnyUser();
      setIsFirstUser(!has);
      const bio = await authService.isBiometricSupported();
      const bioEnabled = await authService.getBiometricEnabled();
      setBioAvailable(bio && bioEnabled && has);
      if (bio && bioEnabled && has) {
        const ok = await authService.promptBiometric();
        if (ok) {
          const session = await authService.getSession();
          if (session) {
            setSession(session);
            router.replace('/(tabs)' as any);
          }
        }
      }
    })();
  }, [router, setSession]);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = isFirstUser
        ? await authService.register(email.trim(), password)
        : await authService.login(email.trim(), password);
      if (!session) {
        setError('E-mail ou senha incorretos');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSession(session);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }, [email, password, isFirstUser, router, setSession]);

  const onBiometric = useCallback(async () => {
    const ok = await authService.promptBiometric();
    if (!ok) return;
    const session = await authService.getSession();
    if (session) {
      setSession(session);
      router.replace('/(tabs)' as any);
    }
  }, [router, setSession]);

  if (isFirstUser === null) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.broto} />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F8F2E5', '#EFE5D0']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.logoWrap}>
            <Svg width={88} height={88} viewBox="0 0 88 88">
              <Ellipse cx={44} cy={68} rx={22} ry={8} fill="#8B6F47" opacity={0.85} />
              <Ellipse cx={44} cy={66} rx={20} ry={6} fill="#6B5435" />
              <Path d="M44 64 L44 38" stroke="#4A7C59" strokeWidth={3} strokeLinecap="round" />
              <Path d="M44 48 Q30 44 22 32 Q28 26 38 30 Q44 36 44 48 Z" fill="#4A7C59" />
              <Path d="M44 44 Q58 40 66 28 Q60 22 50 26 Q44 32 44 44 Z" fill="#7BA05B" />
              <Circle cx={44} cy={36} r={3} fill="#E8A04C" />
            </Svg>
            <Text style={styles.title}>Leonardo Mudas</Text>
            <Text style={styles.tagline}>cuidando do que vai crescer</Text>
          </View>

          {isFirstUser ? (
            <View style={styles.firstUserHint}>
              <Ionicons name="sparkles" size={14} color={colors.mangaDeep} />
              <Text style={styles.firstUserText}>Primeira vez. Defina suas credenciais.</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="leonardo@mudas.com.br"
              placeholderTextColor={colors.ink4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.ink4}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={onSubmit} disabled={loading}>
            <LinearGradient
              colors={[colors.manga, colors.mangaDeep]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>{isFirstUser ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>

          {bioAvailable ? (
            <Pressable style={styles.bioBtn} onPress={onBiometric}>
              <Ionicons name="finger-print" size={20} color={colors.broto} />
              <Text style={styles.bioText}>Entrar com biometria</Text>
            </Pressable>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 36, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 56 },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.mata,
    letterSpacing: -0.7,
    marginTop: 20,
  },
  tagline: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.broto,
    marginTop: 6,
  },
  firstUserHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(232,160,76,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  firstUserText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.mangaDeep },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontFamily: fonts.uiSemibold,
    fontSize: 12,
    color: colors.ink2,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    fontFamily: fonts.ui,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(74,124,89,0.15)',
    borderRadius: 18,
    color: colors.ink1,
  },
  error: { color: colors.danger, fontFamily: fonts.uiMedium, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  btn: {
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 20,
  },
  btnText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 17, letterSpacing: -0.2 },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    padding: 14,
  },
  bioText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.broto },
});
