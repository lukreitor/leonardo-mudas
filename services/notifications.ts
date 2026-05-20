import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { paymentsService } from './payments';
import { visitsService } from './visits';
import { currentWeek } from '../lib/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsService = {
  async ensurePermissions(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const ask = await Notifications.requestPermissionsAsync();
    return ask.granted;
  },

  async scheduleDailySummary(): Promise<void> {
    if (Platform.OS === 'web') return;
    const granted = await this.ensurePermissions();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Bom dia, Leonardo',
        body: 'Vamos ver quais fazendas visitar hoje.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async fireOverdueAlerts(): Promise<void> {
    if (Platform.OS === 'web') return;
    const granted = await this.ensurePermissions();
    if (!granted) return;

    const now = new Date();
    const summary = await paymentsService.monthlySummary(now.getFullYear(), now.getMonth() + 1);
    const overdueFarms = summary.byFarm.filter((b) => b.status === 'overdue');
    if (overdueFarms.length === 0) return;

    for (const r of overdueFarms.slice(0, 3)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Pagamento atrasado',
          body: `${r.farm.name} · ${r.nextDueLabel ?? 'verificar'}`,
          sound: 'default',
        },
        trigger: null,
      });
    }
  },

  async fireWeeklyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    const granted = await this.ensurePermissions();
    if (!granted) return;
    const ref = currentWeek();
    const result = await visitsService.getFarmsForWeek(ref);
    if (result.counts.pending === 0) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Fazendas pendentes',
        body: `${result.counts.pending} fazendas pra visitar essa semana.`,
        sound: 'default',
      },
      trigger: null,
    });
  },
};
