import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

const SQLITE_PATH = `${FileSystem.documentDirectory}SQLite/leonardo-mudas.db`;
const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const AUTO_PREFIX = 'auto-monthly-';

export type AutoBackupInfo = {
  path: string;
  ym: string;
  createdAt: string;
  sizeBytes: number;
};

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

  async buildBackupZipBase64(): Promise<{ base64: string; mediaCount: number }> {
    const dbInfo = await FileSystem.getInfoAsync(SQLITE_PATH);
    if (!dbInfo.exists) throw new Error('Banco não encontrado');

    const zip = new JSZip();

    const dbBase64 = await FileSystem.readAsStringAsync(SQLITE_PATH, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file('leonardo-mudas.db', dbBase64, { base64: true });

    const mediaInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
    let mediaCount = 0;
    if (mediaInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(MEDIA_DIR);
      const mediaFolder = zip.folder('media');
      if (mediaFolder) {
        for (const fname of files) {
          try {
            const b64 = await FileSystem.readAsStringAsync(`${MEDIA_DIR}${fname}`, {
              encoding: FileSystem.EncodingType.Base64,
            });
            mediaFolder.file(fname, b64, { base64: true });
            mediaCount++;
          } catch {
            // skip
          }
        }
      }
    }

    const manifest = {
      app: 'Leonardo Consultoria',
      exportedAt: new Date().toISOString(),
      database: 'leonardo-mudas.db',
      mediaFilesCount: mediaCount,
      version: '1.0.0',
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
    return { base64, mediaCount };
  },

  async exportFullBackup(): Promise<void> {
    const { base64, mediaCount } = await this.buildBackupZipBase64();
    const stamp = new Date().toISOString().slice(0, 10);
    const zipPath = `${FileSystem.cacheDirectory}leonardo-mudas-backup-${stamp}.zip`;
    await FileSystem.writeAsStringAsync(zipPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: `Backup Leonardo Consultoria (${mediaCount} mídias)`,
      });
    }
  },

  async runMonthlyAutoBackupIfNeeded(): Promise<{ created?: AutoBackupInfo; replacedYm?: string }> {
    await this.ensureBackupDir();
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetPath = `${BACKUP_DIR}${AUTO_PREFIX}${currentYm}.zip`;
    const targetInfo = await FileSystem.getInfoAsync(targetPath);
    if (targetInfo.exists) return {};

    const { base64 } = await this.buildBackupZipBase64();
    await FileSystem.writeAsStringAsync(targetPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let replacedYm: string | undefined;
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    for (const f of files) {
      if (f.startsWith(AUTO_PREFIX) && f !== `${AUTO_PREFIX}${currentYm}.zip`) {
        try {
          await FileSystem.deleteAsync(`${BACKUP_DIR}${f}`, { idempotent: true });
          replacedYm = f.replace(AUTO_PREFIX, '').replace('.zip', '');
        } catch {
          // skip
        }
      }
    }

    const finalInfo = await FileSystem.getInfoAsync(targetPath);
    return {
      created: {
        path: targetPath,
        ym: currentYm,
        createdAt: new Date().toISOString(),
        sizeBytes: (finalInfo as any).size ?? 0,
      },
      replacedYm,
    };
  },

  async latestAutoMonthly(): Promise<AutoBackupInfo | null> {
    await this.ensureBackupDir();
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const auto = files.filter((f) => f.startsWith(AUTO_PREFIX) && f.endsWith('.zip')).sort();
    if (auto.length === 0) return null;
    const latest = auto[auto.length - 1];
    const path = `${BACKUP_DIR}${latest}`;
    const info = await FileSystem.getInfoAsync(path);
    return {
      path,
      ym: latest.replace(AUTO_PREFIX, '').replace('.zip', ''),
      createdAt: new Date(((info as any).modificationTime ?? 0) * 1000).toISOString(),
      sizeBytes: (info as any).size ?? 0,
    };
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

    const isZip = sourceUri.toLowerCase().endsWith('.zip');
    if (isZip) {
      const zipBase64 = await FileSystem.readAsStringAsync(sourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const zip = await JSZip.loadAsync(zipBase64, { base64: true });

      const dbEntry = zip.file('leonardo-mudas.db');
      if (!dbEntry) throw new Error('ZIP inválido: leonardo-mudas.db ausente');
      const dbContentB64 = await dbEntry.async('base64');
      await FileSystem.writeAsStringAsync(SQLITE_PATH, dbContentB64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const mediaFolder = zip.folder('media');
      if (mediaFolder) {
        const mediaInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
        if (!mediaInfo.exists) {
          await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
        }
        const filenames: string[] = [];
        mediaFolder.forEach((relativePath) => {
          if (!relativePath.endsWith('/')) filenames.push(relativePath);
        });
        for (const fname of filenames) {
          try {
            const entry = mediaFolder.file(fname);
            if (!entry) continue;
            const fb64 = await entry.async('base64');
            await FileSystem.writeAsStringAsync(`${MEDIA_DIR}${fname}`, fb64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch {
            // continue
          }
        }
      }
    } else {
      await FileSystem.copyAsync({ from: sourceUri, to: SQLITE_PATH });
    }
  },

  async listBackups(): Promise<string[]> {
    await this.ensureBackupDir();
    return FileSystem.readDirectoryAsync(BACKUP_DIR);
  },
};
