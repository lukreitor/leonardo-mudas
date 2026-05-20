import * as FileSystem from 'expo-file-system';
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

    const exportDir = `${FileSystem.cacheDirectory}export-${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(`${exportDir}media`, { intermediates: true });

    const dbCopy = `${exportDir}leonardo-mudas.db`;
    await FileSystem.copyAsync({ from: SQLITE_PATH, to: dbCopy });

    const cacheMedia = `${FileSystem.cacheDirectory}`;
    const cacheList = await FileSystem.readDirectoryAsync(cacheMedia).catch(() => [] as string[]);
    let copied = 0;
    for (const file of cacheList) {
      if (file.match(/\.(m4a|mp4|jpg|jpeg|png|wav)$/i)) {
        try {
          await FileSystem.copyAsync({
            from: `${cacheMedia}${file}`,
            to: `${exportDir}media/${file}`,
          });
          copied++;
        } catch {
          // skip individual file errors
        }
      }
    }

    const manifest = {
      app: 'Leonardo Mudas',
      exportedAt: new Date().toISOString(),
      database: 'leonardo-mudas.db',
      mediaFilesCopied: copied,
    };
    await FileSystem.writeAsStringAsync(`${exportDir}manifest.json`, JSON.stringify(manifest, null, 2));

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(dbCopy, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: `Backup Leonardo Mudas (DB + ${copied} mídias)`,
      });
    }
  },

  async listBackups(): Promise<string[]> {
    await this.ensureBackupDir();
    return FileSystem.readDirectoryAsync(BACKUP_DIR);
  },
};
