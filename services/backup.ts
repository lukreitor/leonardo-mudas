import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const SQLITE_PATH = `${FileSystem.documentDirectory}SQLite/leonardo-mudas.db`;
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

export const backupService = {
  async ensureBackupDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }
  },

  async snapshotBeforeMigration(): Promise<string | null> {
    await this.ensureBackupDir();
    const dbInfo = await FileSystem.getInfoAsync(SQLITE_PATH);
    if (!dbInfo.exists) return null;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = `${BACKUP_DIR}pre-migration-${stamp}.sqlite`;
    await FileSystem.copyAsync({ from: SQLITE_PATH, to: target });
    return target;
  },

  async exportFullBackup(): Promise<void> {
    await this.ensureBackupDir();
    const dbInfo = await FileSystem.getInfoAsync(SQLITE_PATH);
    if (!dbInfo.exists) throw new Error('Banco não encontrado');

    const mediaDir = `${FileSystem.documentDirectory}media/`;
    const mediaInfo = await FileSystem.getInfoAsync(mediaDir);
    let mediaCount = 0;
    if (mediaInfo.exists) {
      const list = await FileSystem.readDirectoryAsync(mediaDir).catch(() => [] as string[]);
      mediaCount = list.length;
    }

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(SQLITE_PATH, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: `Backup Leonardo Mudas (DB · ${mediaCount} mídias em /media)`,
      });
    }
  },

  async restoreFromBackup(sourceUri: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(sourceUri);
    if (!info.exists) throw new Error('Arquivo não encontrado');

    await this.ensureBackupDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyBackup = `${BACKUP_DIR}before-restore-${stamp}.sqlite`;
    const dbInfo = await FileSystem.getInfoAsync(SQLITE_PATH);
    if (dbInfo.exists) {
      await FileSystem.copyAsync({ from: SQLITE_PATH, to: safetyBackup });
    }

    await FileSystem.copyAsync({ from: sourceUri, to: SQLITE_PATH });
  },

  async listBackups(): Promise<string[]> {
    await this.ensureBackupDir();
    return FileSystem.readDirectoryAsync(BACKUP_DIR);
  },
};
