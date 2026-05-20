import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { farmsRepo } from '@/repositories/farms';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Farm } from '@/db/schema';
import type { PaymentType, VisitFrequency } from '@/lib/contracts';

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'none', label: 'Sem cobrança' },
  { value: 'visit', label: 'Por visita' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'commission', label: 'Comissão' },
  { value: 'mixed', label: 'Misto' },
];

const FREQUENCIES: { value: VisitFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizada' },
];

export default function FarmEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id && id !== 'new';

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [sizeHa, setSizeHa] = useState('');
  const [notes, setNotes] = useState('');
  const [colorToken, setColorToken] = useState(farmColors[0]);
  const [paymentType, setPaymentType] = useState<PaymentType>('none');
  const [visitAmount, setVisitAmount] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [monthlyDueDay, setMonthlyDueDay] = useState('5');
  const [commissionPct, setCommissionPct] = useState('');
  const [visitFrequency, setVisitFrequency] = useState<VisitFrequency>('weekly');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      farmsRepo.getById(Number(id)).then((f) => {
        if (!f) return;
        setName(f.name);
        setOwnerName(f.ownerName ?? '');
        setOwnerPhone(f.ownerPhone ?? '');
        setAddress(f.address ?? '');
        setSizeHa(f.sizeHa ? String(f.sizeHa) : '');
        setNotes(f.notes ?? '');
        setColorToken(f.colorToken ?? farmColors[0]);
        setPaymentType((f.paymentType ?? 'none') as PaymentType);
        setVisitAmount(f.visitAmount ? String(f.visitAmount) : '');
        setMonthlyAmount(f.monthlyAmount ? String(f.monthlyAmount) : '');
        setMonthlyDueDay(f.monthlyDueDay ? String(f.monthlyDueDay) : '5');
        setCommissionPct(f.commissionPct ? String(f.commissionPct) : '');
        setVisitFrequency((f.visitFrequency ?? 'weekly') as VisitFrequency);
      });
    }
  }, [editing, id]);

  const showVisit = paymentType === 'visit' || paymentType === 'mixed';
  const showMonthly = paymentType === 'monthly' || paymentType === 'mixed';
  const showCommission = paymentType === 'commission' || paymentType === 'mixed';

  const onSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Falta o nome', 'Nome da fazenda é obrigatório.');
      return;
    }
    setSubmitting(true);
    try {
      const data: Partial<Farm> = {
        name: name.trim(),
        ownerName: ownerName.trim() || null,
        ownerPhone: ownerPhone.trim() || null,
        address: address.trim() || null,
        sizeHa: sizeHa ? parseFloat(sizeHa.replace(',', '.')) : null,
        notes: notes.trim() || null,
        colorToken,
        paymentType,
        visitAmount: showVisit && visitAmount ? parseFloat(visitAmount.replace(',', '.')) : null,
        monthlyAmount: showMonthly && monthlyAmount ? parseFloat(monthlyAmount.replace(',', '.')) : null,
        monthlyDueDay: showMonthly ? parseInt(monthlyDueDay, 10) : null,
        commissionPct: showCommission && commissionPct ? parseFloat(commissionPct.replace(',', '.')) : null,
        visitFrequency,
      };
      if (editing) {
        await farmsRepo.update(Number(id), data as any);
      } else {
        await farmsRepo.create(data as any);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar');
    } finally {
      setSubmitting(false);
    }
  }, [
    editing, id, name, ownerName, ownerPhone, address, sizeHa, notes, colorToken,
    paymentType, visitAmount, monthlyAmount, monthlyDueDay, commissionPct, visitFrequency,
    showVisit, showMonthly, showCommission, router,
  ]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.mata} />
          </Pressable>
          <Text style={styles.headerTitle}>{editing ? 'Editar fazenda' : 'Nova fazenda'}</Text>
          <View style={{ width: 26 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Section title="Identificação">
            <Field label="Nome *" value={name} onChangeText={setName} placeholder="ex: Marcos" />
            <View style={styles.colorWrap}>
              <Text style={styles.colorLabel}>Cor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                {farmColors.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColorToken(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      colorToken === c && styles.colorDotActive,
                    ]}
                  />
                ))}
              </ScrollView>
            </View>
          </Section>

          <Section title="Contato (opcional)">
            <Field label="Dono" value={ownerName} onChangeText={setOwnerName} placeholder="Nome do proprietário" />
            <Field label="Telefone" value={ownerPhone} onChangeText={setOwnerPhone} placeholder="(87) 9 9999-9999" keyboardType="phone-pad" />
            <Field label="Endereço" value={address} onChangeText={setAddress} placeholder="Localização" />
            <Field label="Tamanho (ha)" value={sizeHa} onChangeText={setSizeHa} placeholder="ex: 14" keyboardType="decimal-pad" />
          </Section>

          <Section title="Pagamento">
            <Text style={styles.fieldLabel}>Tipo de cobrança</Text>
            <View style={styles.chipsRow}>
              {PAYMENT_TYPES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPaymentType(p.value)}
                  style={[styles.chip, paymentType === p.value && styles.chipActive]}>
                  <Text style={[styles.chipText, paymentType === p.value && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {showVisit ? (
              <Field label="R$ por visita" value={visitAmount} onChangeText={setVisitAmount} placeholder="80,00" keyboardType="decimal-pad" />
            ) : null}
            {showMonthly ? (
              <>
                <Field label="R$ mensal fixo" value={monthlyAmount} onChangeText={setMonthlyAmount} placeholder="600,00" keyboardType="decimal-pad" />
                <Field label="Dia do vencimento (1-31)" value={monthlyDueDay} onChangeText={setMonthlyDueDay} placeholder="5" keyboardType="number-pad" />
              </>
            ) : null}
            {showCommission ? (
              <Field label="% comissão sobre vendas" value={commissionPct} onChangeText={setCommissionPct} placeholder="5" keyboardType="decimal-pad" />
            ) : null}
          </Section>

          <Section title="Frequência de visita">
            <View style={styles.chipsRow}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setVisitFrequency(f.value)}
                  style={[styles.chip, visitFrequency === f.value && styles.chipActive]}>
                  <Text style={[styles.chipText, visitFrequency === f.value && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Observações">
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Anotações gerais sobre a fazenda..."
              placeholderTextColor={colors.ink4}
            />
          </Section>

          <Pressable style={styles.saveBtn} onPress={onSave} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar fazenda'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string; value: string; onChangeText: (s: string) => void;
  placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink4}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(26,58,46,0.08)',
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.mata, letterSpacing: -0.2 },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: fonts.uiBold, fontSize: 11,
    letterSpacing: 0.8, textTransform: 'uppercase',
    color: colors.ink3, marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: fonts.uiSemibold, fontSize: 12,
    color: colors.ink2, marginBottom: 6,
  },
  input: {
    padding: 14, fontSize: 16, fontFamily: fonts.ui,
    backgroundColor: 'white',
    borderWidth: 1.5, borderColor: 'rgba(26,58,46,0.06)',
    borderRadius: 12, color: colors.ink1,
  },
  colorWrap: { marginTop: 4 },
  colorLabel: {
    fontFamily: fonts.uiSemibold, fontSize: 12,
    color: colors.ink2, marginBottom: 8,
  },
  colorRow: { gap: 8 },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: colors.mata, transform: [{ scale: 1.1 }] },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: colors.neblina,
    borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(26,58,46,0.06)',
  },
  chipActive: { borderColor: colors.mata, backgroundColor: 'white' },
  chipText: { fontFamily: fonts.uiSemibold, fontSize: 12, color: colors.ink2 },
  chipTextActive: { color: colors.mata },
  saveBtn: {
    padding: 18,
    backgroundColor: colors.manga,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  saveText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 16 },
});
