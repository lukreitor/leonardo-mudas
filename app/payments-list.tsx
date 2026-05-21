import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { paymentsService, type PaymentWithFarmAndMonth } from '@/services/payments';
import { paymentsRepo } from '@/repositories/payments';
import { showDialog } from '@/stores/dialog';
import { colors, farmColors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { initialsOf } from '@/lib/initials';

const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function PaymentsListScreen() {
  const insets = useSafeAreaInsets();
  const { filter } = useLocalSearchParams<{ filter: 'pending' | 'overdue' | 'paid' }>();
  const router = useRouter();
  const [rows, setRows] = useState<PaymentWithFarmAndMonth[]>([]);

  const status: 'pending' | 'overdue' | 'paid' = filter === 'overdue' ? 'overdue' : filter === 'paid' ? 'paid' : 'pending';
  const title = status === 'overdue' ? 'Atrasados' : status === 'paid' ? 'Histórico de pagamentos' : 'Pendentes';

  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const load = useCallback(async () => {
    const list = await paymentsService.listAllWithFarm(status);
    setRows(list);
  }, [status]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doMarkPaid = useCallback(
    async (paymentId: number, when: Date) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await paymentsRepo.markPaid(paymentId, when);
      load();
    },
    [load]
  );

  const handleMarkPaid = useCallback(
    (row: PaymentWithFarmAndMonth) => {
      const buttons: any[] = [
        { label: 'Hoje', style: 'primary', onPress: () => doMarkPaid(row.payment.id, new Date()) },
      ];
      if (row.payment.dueDate) {
        const dueDate = parseISO(row.payment.dueDate);
        buttons.push({
          label: `No vencimento (${format(dueDate, 'd/MM')})`,
          style: 'default',
          onPress: () => doMarkPaid(row.payment.id, dueDate),
        });
      }
      buttons.push({
        label: 'Outra data…',
        style: 'default',
        onPress: () => {
          setPickerDate(row.payment.dueDate ? parseISO(row.payment.dueDate) : new Date());
          setPickerOpenFor(row.payment.id);
        },
      });
      buttons.push({ label: 'Cancelar', style: 'cancel' });

      showDialog({
        icon: 'check',
        title: `Marcar ${row.farm.name} como pago`,
        body: 'Quando o pagamento foi recebido?',
        buttons,
      });
    },
    [doMarkPaid]
  );

  const handleCancel = useCallback(
    async (paymentId: number) => {
      showDialog({
        icon: 'warning',
        title: 'Cancelar pagamento?',
        body: 'Isso remove o pagamento da lista de pendentes.',
        buttons: [
          { label: 'Voltar', style: 'cancel' },
          {
            label: 'Cancelar pagamento',
            style: 'destructive',
            onPress: async () => {
              await paymentsRepo.cancel(paymentId);
              load();
            },
          },
        ],
      });
    },
    [load]
  );

  const groups = new Map<string, PaymentWithFarmAndMonth[]>();
  for (const row of rows) {
    if (!groups.has(row.ym)) groups.set(row.ym, []);
    groups.get(row.ym)!.push(row);
  }
  const sortedYms = Array.from(groups.keys()).sort().reverse();

  const grandTotal = rows.reduce((s, r) => s + r.payment.amount, 0);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.papel }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.mata} />
          </Pressable>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {rows.length} {rows.length === 1 ? 'pagamento' : 'pagamentos'} · total R$ {grandTotal.toFixed(0)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sortedYms.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={status === 'overdue' ? 'shield-checkmark-outline' : 'checkmark-circle-outline'}
              size={48}
              color={colors.broto}
            />
            <Text style={styles.emptyTitle}>
              {status === 'overdue' ? 'Nada atrasado' : 'Nenhum pendente'}
            </Text>
            <Text style={styles.emptySub}>
              Tudo em dia.
            </Text>
          </View>
        ) : (
          sortedYms.map((ym) => {
            const [y, m] = ym.split('-');
            const groupRows = groups.get(ym)!;
            const groupTotal = groupRows.reduce((s, r) => s + r.payment.amount, 0);
            return (
              <View key={ym} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupTitle}>
                    {MONTH_NAMES[Number(m) - 1]} · {y}
                  </Text>
                  <Text style={styles.groupTotal}>R$ {groupTotal.toFixed(0)}</Text>
                </View>
                {groupRows.map((r, i) => (
                  <View key={r.payment.id} style={styles.row}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: r.farm.colorToken ?? farmColors[i % farmColors.length] },
                      ]}>
                      <Text style={styles.avatarText}>{initialsOf(r.farm.name)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.farmName}>{r.farm.name}</Text>
                      <Text style={styles.kind}>
                        {r.payment.kind === 'monthly' ? 'mensal' : r.payment.kind === 'visit' ? 'visita' : 'comissão'}
                        {r.payment.dueDate ? ` · vence ${formatDate(r.payment.dueDate)}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.amount,
                          status === 'overdue' && { color: colors.danger },
                          status === 'paid' && { color: colors.broto },
                        ]}>
                        R$ {r.payment.amount.toFixed(0)}
                      </Text>
                      {status === 'paid' ? (
                        <View style={[styles.actions, { marginTop: 4 }]}>
                          <View style={[styles.payBtn, { backgroundColor: 'rgba(74,124,89,0.15)' }]}>
                            <Ionicons name="checkmark" size={10} color={colors.broto} />
                            <Text style={[styles.payText, { color: colors.broto }]}>Pago</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.actions}>
                          <Pressable
                            onPress={() => handleMarkPaid(r)}
                            style={styles.payBtn}
                            hitSlop={6}>
                            <Ionicons name="checkmark" size={12} color="white" />
                            <Text style={styles.payText}>Pago</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleCancel(r.payment.id)}
                            style={styles.cancelBtn}
                            hitSlop={6}>
                            <Ionicons name="close" size={14} color={colors.ink3} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
        <View style={{ height: 40 + insets.bottom }} />
      </ScrollView>

      {pickerOpenFor !== null ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selected) => {
            if (Platform.OS === 'android') {
              const id = pickerOpenFor;
              setPickerOpenFor(null);
              if (event.type === 'set' && selected && id) {
                doMarkPaid(id, selected);
              }
            } else {
              if (event.type === 'set' && selected) {
                const id = pickerOpenFor;
                setPickerOpenFor(null);
                if (id) doMarkPaid(id, selected);
              } else if (event.type === 'dismissed') {
                setPickerOpenFor(null);
              }
            }
          }}
        />
      ) : null}
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.papel },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  back: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.neblina,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.mata, letterSpacing: -0.4 },
  subtitle: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.ink3, marginTop: 2 },
  scroll: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', padding: 60, gap: 10 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.mata, marginTop: 8 },
  emptySub: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink3 },
  group: { marginBottom: 22 },
  groupHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 8, paddingHorizontal: 4,
  },
  groupTitle: {
    fontFamily: fonts.uiBold, fontSize: 11,
    letterSpacing: 0.8, textTransform: 'uppercase',
    color: colors.ink2,
  },
  groupTotal: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.mata, letterSpacing: -0.3 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12,
    backgroundColor: colors.neblina,
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(26,58,46,0.04)',
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 15, letterSpacing: -0.3 },
  farmName: { fontFamily: fonts.uiSemibold, fontSize: 14, color: colors.ink1 },
  kind: { fontFamily: fonts.ui, fontSize: 11, color: colors.ink3, marginTop: 2 },
  amount: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.mata, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: colors.broto,
    borderRadius: 999,
  },
  payText: { color: 'white', fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cancelBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(26,58,46,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
});
