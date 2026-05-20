import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { db } from '../db/client';
import { farms as farmsTable, visits as visitsTable, notes as notesTable, media as mediaTable, weeks as weeksTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

type ExportOptions = {
  weekId?: number;
  farmId?: number;
  includeText: boolean;
  includeAudio: boolean;
  includePhoto: boolean;
  includeVideo: boolean;
};

export const exportService = {
  async buildSummaryText(opts: ExportOptions): Promise<string> {
    const farmRows = opts.farmId
      ? await db.select().from(farmsTable).where(eq(farmsTable.id, opts.farmId))
      : await db.select().from(farmsTable);

    const lines: string[] = [];
    lines.push('🌱 Leonardo Mudas — Resumo da semana');
    lines.push('');

    for (const farm of farmRows) {
      const visitRows = opts.weekId
        ? await db.select().from(visitsTable).where(eq(visitsTable.farmId, farm.id))
        : await db.select().from(visitsTable).where(eq(visitsTable.farmId, farm.id));
      const filteredVisits = opts.weekId ? visitRows.filter((v) => v.weekId === opts.weekId) : visitRows;
      if (filteredVisits.length === 0) continue;

      lines.push(`━━━━━━━━━━━━━━`);
      lines.push(`📍 ${farm.name}`);
      if (farm.ownerName) lines.push(`   ${farm.ownerName}`);

      for (const v of filteredVisits) {
        const noteRows = await db.select().from(notesTable).where(eq(notesTable.visitId, v.id));
        for (const n of noteRows) {
          lines.push('');
          lines.push(`▸ ${n.title ?? 'Anotação'}`);
          if (opts.includeText && n.noteText) lines.push(`   "${n.noteText}"`);
          const mediaRows = await db.select().from(mediaTable).where(eq(mediaTable.noteId, n.id));
          const counts = {
            photo: mediaRows.filter((m) => m.type === 'photo').length,
            video: mediaRows.filter((m) => m.type === 'video').length,
            audio: mediaRows.filter((m) => m.type === 'audio').length,
          };
          const parts: string[] = [];
          if (opts.includePhoto && counts.photo > 0) parts.push(`${counts.photo} foto${counts.photo > 1 ? 's' : ''}`);
          if (opts.includeVideo && counts.video > 0) parts.push(`${counts.video} vídeo${counts.video > 1 ? 's' : ''}`);
          if (opts.includeAudio && counts.audio > 0) parts.push(`${counts.audio} áudio${counts.audio > 1 ? 's' : ''}`);
          if (parts.length > 0) lines.push(`   📎 ${parts.join(' · ')}`);
        }
      }
      lines.push('');
    }
    lines.push('━━━━━━━━━━━━━━');
    lines.push(`Gerado em ${new Date().toLocaleString('pt-BR')}`);
    return lines.join('\n');
  },

  async shareWeekSummary(opts: ExportOptions): Promise<void> {
    const text = await this.buildSummaryText(opts);
    const dir = `${FileSystem.cacheDirectory}export-${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const txtPath = `${dir}resumo.txt`;
    await FileSystem.writeAsStringAsync(txtPath, text);

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error('Compartilhamento indisponível neste aparelho');
    }
    await Sharing.shareAsync(txtPath, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartilhar resumo',
    });
  },

  async backupAll(): Promise<string> {
    const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
    const target = `${FileSystem.cacheDirectory}backup-${Date.now()}.sqlite`;
    const dbFile = `${sqliteDir}leonardo-mudas.db`;
    const info = await FileSystem.getInfoAsync(dbFile);
    if (!info.exists) {
      throw new Error('Banco de dados não encontrado');
    }
    await FileSystem.copyAsync({ from: dbFile, to: target });
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(target, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Salvar backup',
      });
    }
    return target;
  },
};
