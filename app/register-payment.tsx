import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { farmsRepo } from '@/repositories/farms';
import { paymentsService } from '@/services/payments';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';
import type { Farm } from '@/db/schema';
import type { PaymentKind } from '@/lib/contracts';

const KINDS: { value: PaymentKind; label: string; icon: string; description: string }[] = [
  { value: 'visit', label: 'Visita', icon: 'walk-outline', description: 'pagamento por visita realizada' },
  { value: 'monthly', label: 'Mensal', icon: 'calendar-outline', description: 'valor fixo do mês' },
  { value: 'commission', label: 'Comissão', icon: 'trending-up-outline', description: '% sobre venda da fazenda' },
];

export default function RegisterPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();

  const initialPaidDate = useMemo(() => {
    const y = params.year ? Number(params.year) : NaN;
    const m = params.month ? Number(params.month) : NaN;
    const now = new Date();
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      const sameMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
      if (!sameMonth) {
        return new Date(y, m, 0); // último dia do mês
      }
    }
    return now;
  }, [params.year, params.month]);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<number | null>(null);
  const [kind, setKind] = useState<PaymentKind>('visit');
  const [amount, setAmount] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [paidDate, setPaidDate] = useState<Date>(initialPaidDate);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await farmsRepo.listActive();
      setFarms(list);
    })();
  }, []);

  const selectedFarm = farms.find((f) => f.id === farmId);

  const calcCommission = useCallback(() => {
    if (!selectedFarm?.commissionPct) return null;
    const v = parseFloat(saleAmount.replace(',', '.'));
    if (isNaN(v)) return null;
    return v * (selectedFarm.commissionPct / 100);
  }, [selectedFarm, saleAmount]);

  const onSubmit = useCallback(async () => {
    if (!farmId) {
      Alert.alert('Falta fazenda', 'Selecione qual fazenda pagou.');
      return;
    }
    let value = parseFloat(amount.replace(',', '.'));
    if (kind === 'commission' && saleAmount && !amount) {
      const calc = calcCommission();
      if (calc) value = calc;
    }
    if (isNaN(value) || value <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    setSubmitting(true);
    try {
      await paymentsService.registerPayment({
        farmId,
        kind,
        amount: value,
        saleAmount: saleAmount ? parseFloat(saleAmount.replace(',', '.')) : undefined,
        pct: selectedFarm?.commissionPct ?? undefined,
        paidDate,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível registrar');
    } finally {
      setSubmitting(false);
    }
  }, [farmId, amount, kind, saleAmount, calcCommission, selectedFarm, paidDate, router]);

  const calculated = kind === 'commission' ? calcCommission() : null;

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Registrar recebimento</Text>
          <Text style={styles.subtitle}>Marca um pagamento que entrou no caixa</Text>

          <Text style={styles.sectionLabel}>Fazenda</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.farmRow}>
            {farms.map((f, i) => {
              const active = farmId === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFarmId(f.id)}
                  style={[styles.farmChip, active && styles.farmChipActive]}>
                  <View
                    style={[
                      styles.farmAv,
                      { backgroundColor: f.colorToken ?? farmColors[i % farmColors.length] },
                    ]}>
                    <Text style={styles.farmAvText}>{initialsOf(f.name)}</Text>
                  </View>
                  <Text style={[styles.farmChipText, active && styles.farmChipTextActive]} numberOfLines={1}>
                    {f.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Tipo</Text>
          <View style={styles.kindGrid}>
            {KINDS.map((k) => {
              const active = kind === k.value;
              return (
                <Pressable
                  key={k.value}
                  onPress={() => setKind(k.value)}
                  style={[styles.kindCard, active && styles.kindCardActive]}>
                  <View style={[styles.kindIcon, active && styles.kindIconActive]}>
                    <Ionicons name={k.icon as any} size={18} color={active ? 'white' : colors.broto} />
                  </View>
                  <Text style={[styles.kindLabel, active && styles.kindLabelActive]}>{k.label}</Text>
                  <Text style={[styles.kindDesc, active && styles.kindDescActive]}>{k.description}</Text>
                </Pressable>
              );
            })}
          </View>

          {kind === 'commission' ? (
            <>
              <Text style={styles.sectionLabel}>Valor da venda (R$)</Text>
              <TextInput
                style={styles.input}
                value={saleAmount}
                onChangeText={setSaleAmount}
                placeholder="0,00"
                placeholderTextColor={colors.ink4}
                keyboardType="decimal-pad"
              />
              {calculated !== null && selectedFarm?.commissionPct ? (
                <View style={styles.calcBox}>
                  <Ionicons name="calculator-outline" size={14} color={colors.broto} />
                  <Text style={styles.calcText}>
                    {selectedFarm.commissionPct}% de R$ {parseFloat(saleAmount.replace(',', '.')).toFixed(0)} = R$ {calculated.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          <Text style={styles.sectionLabel}>
            {kind === 'commission' ? 'Valor recebido (opcional, usa cálculo se vazio)' : 'Valor recebido (R$)'}
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder={calculated ? calculated.toFixed(2).replace('.', ',') : '0,00'}
            placeholderTextColor={colors.ink4}
            keyboardType="decimal-pad"
          />

          <Text style={styles.sectionLabel}>Data do pagamento</Text>
          <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={16} color={colors.broto} />
            <Text style={styles.dateText}>{format(paidDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.ink3} />
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={paidDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selected) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (event.type === 'set' && selected) {
                  setPaidDate(selected);
                  if (Platform.OS === 'ios') setShowPicker(false);
                } else if (event.type === 'dismissed') {
                  setShowPicker(false);
                }
              }}
            />
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [styles.submitBtn, (pressed || submitting) && { opacity: 0.85 }]}>
            <Text style={styles.submitText}>{submitting ? 'Salvando...' : 'Registrar pagamento'}</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(26,58,46,0.18)',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.mata, letterSpacing: -0.4 },
  subtitle: { fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 13, color: colors.ink3, marginTop: 4 },
  sectionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginTop: 20,
    marginBottom: 10,
  },
  farmRow: { gap: 8, paddingRight: 16 },
  farmChip: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    minWidth: 80,
    backgroundColor: colors.neblina,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  farmChipActive: { borderColor: colors.mata, backgroundColor: 'white' },
  farmAv: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  farmAvText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 14 },
  farmChipText: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.ink2, maxWidth: 70 },
  farmChipTextActive: { color: colors.mata, fontFamily: fonts.uiSemibold },
  kindGrid: { flexDirection: 'row', gap: 8 },
  kindCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.neblina,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26,58,46,0.06)',
  },
  kindCardActive: { borderColor: colors.broto, backgroundColor: 'rgba(74,124,89,0.05)' },
  kindIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(74,124,89,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  kindIconActive: { backgroundColor: colors.broto },
  kindLabel: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.ink1 },
  kindLabelActive: { color: colors.mata },
  kindDesc: { fontFamily: fonts.ui, fontSize: 10, color: colors.ink3, marginTop: 2, lineHeight: 14 },
  kindDescActive: { color: colors.ink2 },
  input: {
    padding: 16,
    fontSize: 18,
    fontFamily: fonts.display,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(26,58,46,0.08)',
    borderRadius: 14,
    color: colors.ink1,
    letterSpacing: -0.3,
  },
  calcBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(74,124,89,0.08)',
    borderRadius: 10,
  },
  calcText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.broto },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(74,124,89,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,124,89,0.2)',
  },
  dateText: { flex: 1, fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.mata, textTransform: 'capitalize' },
  submitBtn: {
    marginTop: 28,
    padding: 18,
    backgroundColor: colors.mata,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  submitText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 15 },
  cancel: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.ink2 },
});
