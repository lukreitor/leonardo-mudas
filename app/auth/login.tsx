import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
import { showDialog } from '@/stores/dialog';

type Mode = 'login' | 'unlock' | 'register' | 'reset';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setBioVerified = useAuthStore((s) => s.setBioVerified);
  const existingSession = useAuthStore((s) => s.session);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryBiometricUnlock = useCallback(async () => {
    const session = await authService.loginViaBiometric();
    if (session) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSession(session);
      setBioVerified(true);
      router.replace('/(tabs)' as any);
      return true;
    }
    return false;
  }, [router, setSession, setBioVerified]);

  useEffect(() => {
    (async () => {
      const has = await authService.hasAnyUser();
      const bio = await authService.isBiometricSupported();
      const bioEnabled = await authService.getBiometricEnabled();
      const canUseBio = bio && bioEnabled && has;
      setBioAvailable(canUseBio);

      if (!has) {
        setMode('register');
      } else if (canUseBio) {
        setMode('unlock');
        await tryBiometricUnlock();
      } else {
        setMode('login');
      }
      setBootChecked(true);
    })();
  }, [tryBiometricUnlock]);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = mode === 'register'
        ? await authService.register(email.trim(), password)
        : await authService.login(email.trim(), password);
      if (!session) {
        setError('E-mail ou senha incorretos');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (mode === 'register') {
        const bioOk = await authService.isBiometricSupported();
        if (bioOk) {
          const confirmed = await authService.promptBiometric('Ative a biometria para entrar mais rápido');
          if (confirmed) {
            await authService.setBiometricEnabled(true);
            setBioVerified(true);
          }
        }
      } else {
        setBioVerified(true);
      }

      setSession(session);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }, [email, password, mode, router, setSession, setBioVerified]);

  const onBiometric = useCallback(async () => {
    const ok = await tryBiometricUnlock();
    if (!ok) {
      setError('Não foi possível autenticar com biometria. Use sua senha.');
    }
  }, [tryBiometricUnlock]);

  const onForgotPassword = useCallback(async () => {
    const bio = await authService.isBiometricSupported();
    if (!bio) {
      showDialog({
        icon: 'info',
        title: 'Sem biometria cadastrada',
        body: 'Pra recuperar a senha você precisa ter Face ID ou digital cadastrada no celular. Configure nas configurações do Android/iOS e tente de novo.',
      });
      return;
    }
    const ok = await authService.promptBiometric('Confirme com biometria para redefinir a senha');
    if (!ok) return;
    setMode('reset');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }, []);

  const onResetSubmit = useCallback(async () => {
    if (newPassword.length < 4) {
      setError('Senha precisa ter pelo menos 4 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      const ok = await authService.resetPasswordViaBiometric(newPassword);
      if (!ok) {
        setError('Não foi possível redefinir');
        return;
      }
      const session = await authService.getSession();
      if (session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSession(session);
        setBioVerified(true);
        router.replace('/(tabs)' as any);
      }
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, router, setSession, setBioVerified]);

  if (!bootChecked) {
    return (
      <LinearGradient colors={['#F8F2E5', '#EFE5D0']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.broto} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F8F2E5', '#EFE5D0']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.logoWrap}>
              <Svg width={120} height={120} viewBox="0 0 88 88">
                <Ellipse cx={44} cy={68} rx={22} ry={8} fill="#8B6F47" opacity={0.85} />
                <Ellipse cx={44} cy={66} rx={20} ry={6} fill="#6B5435" />
                <Path d="M44 64 L44 38" stroke="#4A7C59" strokeWidth={3} strokeLinecap="round" />
                <Path d="M44 48 Q30 44 22 32 Q28 26 38 30 Q44 36 44 48 Z" fill="#4A7C59" />
                <Path d="M44 44 Q58 40 66 28 Q60 22 50 26 Q44 32 44 44 Z" fill="#7BA05B" />
                <Circle cx={44} cy={36} r={3} fill="#E8A04C" />
              </Svg>
              <Text style={styles.title}>Leonardo Consultoria</Text>
              <Text style={styles.tagline}>cuidando do que vai crescer</Text>
            </View>

            {mode === 'register' ? (
              <View style={styles.firstUserHint}>
                <Ionicons name="sparkles" size={14} color={colors.mangaDeep} />
                <Text style={styles.firstUserText}>Primeira vez. Defina suas credenciais.</Text>
              </View>
            ) : null}

            {mode === 'unlock' ? (
              <View style={styles.unlockWrap}>
                <Pressable style={styles.unlockBtn} onPress={onBiometric}>
                  <Ionicons name="finger-print" size={28} color={colors.broto} />
                  <Text style={styles.unlockBtnText}>Desbloquear com biometria</Text>
                </Pressable>
                <Pressable onPress={() => setMode('login')} style={styles.useSenha}>
                  <Text style={styles.useSenhaText}>Usar senha</Text>
                </Pressable>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>
            ) : mode === 'reset' ? (
              <>
                <View style={styles.resetHint}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.broto} />
                  <Text style={styles.resetHintText}>Biometria confirmada. Crie uma nova senha.</Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nova senha</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="mínimo 4 caracteres"
                    placeholderTextColor={colors.ink4}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirme</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="repita a nova senha"
                    placeholderTextColor={colors.ink4}
                  />
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={onResetSubmit} disabled={loading}>
                  <LinearGradient colors={[colors.manga, colors.mangaDeep]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Salvar nova senha</Text>}
                </Pressable>
                <Pressable onPress={() => { setMode('login'); setError(null); }} style={styles.useSenha}>
                  <Text style={styles.useSenhaText}>Cancelar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>E-mail</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="leonardo@email.com.br"
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
                    <Text style={styles.btnText}>{mode === 'register' ? 'Criar conta' : 'Entrar'}</Text>
                  )}
                </Pressable>

                {mode === 'login' ? (
                  <Pressable onPress={onForgotPassword} style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Esqueci minha senha</Text>
                  </Pressable>
                ) : null}

                {bioAvailable && mode === 'login' ? (
                  <>
                    <View style={styles.divider}>
                      <Text style={styles.dividerText}>ou</Text>
                    </View>
                    <Pressable style={styles.btnBio} onPress={onBiometric}>
                      <Ionicons name="finger-print" size={20} color={colors.broto} />
                      <Text style={styles.btnBioText}>Entrar com biometria</Text>
                    </Pressable>
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 36, paddingVertical: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.mata,
    letterSpacing: -0.6,
    marginTop: 20,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.broto,
    marginTop: 4,
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
    alignSelf: 'center',
  },
  firstUserText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.mangaDeep },
  resetHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,124,89,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  resetHintText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.broto },
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
  forgotBtn: { marginTop: 14, alignItems: 'center', padding: 8 },
  forgotText: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.broto },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 4,
    justifyContent: 'center',
  },
  dividerText: {
    fontFamily: fonts.uiSemibold,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btnBio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(74,124,89,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.2)',
  },
  btnBioText: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.broto },
  unlockWrap: { alignItems: 'center', marginTop: 14 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: 'rgba(74,124,89,0.1)',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(74,124,89,0.25)',
    shadowColor: colors.broto,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  unlockBtnText: { fontFamily: fonts.uiSemibold, fontSize: 16, color: colors.mata },
  useSenha: { marginTop: 16, padding: 10, alignItems: 'center' },
  useSenhaText: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.ink3 },
});
