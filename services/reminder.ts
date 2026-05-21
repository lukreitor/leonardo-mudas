import * as SecureStore from 'expo-secure-store';
import { backupService } from './backup';
import { showDialog } from '../stores/dialog';

const LAST_EXPORT_KEY = 'lm.lastBackupExportAt';
const REMINDER_INTERVAL_MS = 60 * 24 * 60 * 60 * 1000; // 60 dias

export const reminderService = {
  async markExportedNow(): Promise<void> {
    await SecureStore.setItemAsync(LAST_EXPORT_KEY, new Date().toISOString());
  },

  async getLastExport(): Promise<Date | null> {
    const v = await SecureStore.getItemAsync(LAST_EXPORT_KEY);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  },

  async snoozeReminder(days = 7): Promise<void> {
    const pseudo = new Date(Date.now() - REMINDER_INTERVAL_MS + days * 24 * 60 * 60 * 1000);
    await SecureStore.setItemAsync(LAST_EXPORT_KEY, pseudo.toISOString());
  },

  async checkAndPromptExport(): Promise<void> {
    const last = await this.getLastExport();
    const overdue = !last || Date.now() - last.getTime() > REMINDER_INTERVAL_MS;
    if (!overdue) return;

    showDialog({
      icon: 'save',
      title: 'Hora de guardar uma cópia',
      body: 'Faz quase 2 meses desde o último backup. Exporte agora para salvar seus dados num lugar seguro do celular.',
      buttons: [
        {
          label: 'Exportar agora',
          style: 'primary',
          onPress: async () => {
            try {
              await backupService.exportFullBackup();
              await reminderService.markExportedNow();
            } catch {
              // share fechado pelo user, não marca como feito
            }
          },
        },
        {
          label: 'Já fiz isso recentemente',
          style: 'default',
          onPress: () => {
            reminderService.markExportedNow();
          },
        },
        {
          label: 'Lembrar daqui 7 dias',
          style: 'cancel',
          onPress: () => {
            reminderService.snoozeReminder(7);
          },
        },
      ],
    });
  },
};
