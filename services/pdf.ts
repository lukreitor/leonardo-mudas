import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

import { db } from '../db/client';
import { farms as farmsTable, visits as visitsTable, notes as notesTable, media as mediaTable } from '../db/schema';
import { paymentsService, formatStructure } from './payments';
import { farmsRepo } from '../repositories/farms';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

async function imageToBase64(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

export const pdfService = {
  async generateMonthlyReport(year: number, month: number): Promise<void> {
    const allFarms = await farmsRepo.listActive();
    const summary = await paymentsService.monthlySummary(year, month);

    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

    const farmCards: string[] = [];

    for (const farm of allFarms) {
      const farmVisits = await db
        .select()
        .from(visitsTable)
        .where(
          and(
            eq(visitsTable.farmId, farm.id),
            gte(visitsTable.visitedDate, monthStart),
            lte(visitsTable.visitedDate, monthEnd)
          )
        );

      if (farmVisits.length === 0) continue;

      const visitIds = farmVisits.map((v) => v.id);
      const visitNotes = await db.select().from(notesTable).where(inArray(notesTable.visitId, visitIds));
      const noteIds = visitNotes.map((n) => n.id);
      const visitMedia = noteIds.length > 0
        ? await db.select().from(mediaTable).where(inArray(mediaTable.noteId, noteIds))
        : [];

      const finRow = summary.byFarm.find((r) => r.farm.id === farm.id);
      const photosByNote = new Map<number, typeof visitMedia>();
      for (const m of visitMedia) {
        if (m.type === 'photo') {
          const list = photosByNote.get(m.noteId) ?? [];
          list.push(m);
          photosByNote.set(m.noteId, list);
        }
      }

      const noteSections: string[] = [];
      for (const note of visitNotes) {
        const photos = photosByNote.get(note.id) ?? [];
        const photosHtml: string[] = [];
        for (const p of photos.slice(0, 4)) {
          const b64 = await imageToBase64(p.filePath);
          if (b64) photosHtml.push(`<img class="photo" src="${b64}" />`);
        }
        const audios = visitMedia.filter((m) => m.noteId === note.id && m.type === 'audio').length;
        const videos = visitMedia.filter((m) => m.noteId === note.id && m.type === 'video').length;

        noteSections.push(`
          <div class="note">
            <div class="note-head">
              <span class="note-title">${escapeHtml(note.title ?? 'Anotação')}</span>
              <span class="note-time">${formatDate(note.createdAt)}</span>
            </div>
            ${note.noteText ? `<p class="note-text">"${escapeHtml(note.noteText)}"</p>` : ''}
            ${photosHtml.length > 0 ? `<div class="photos">${photosHtml.join('')}</div>` : ''}
            ${(audios > 0 || videos > 0) ? `<p class="meta">${audios ? `🎙 ${audios} áudios ` : ''}${videos ? `📹 ${videos} vídeos` : ''}</p>` : ''}
          </div>
        `);
      }

      farmCards.push(`
        <section class="farm">
          <header class="farm-head">
            <div class="avatar" style="background:${farm.colorToken ?? '#4A7C59'}">${initials(farm.name)}</div>
            <div>
              <h2>${escapeHtml(farm.name)}</h2>
              <p>${farmVisits.length} ${farmVisits.length === 1 ? 'visita' : 'visitas'} este mês${farm.ownerName ? ` · ${escapeHtml(farm.ownerName)}` : ''}</p>
            </div>
          </header>
          ${finRow ? `<div class="payment">${escapeHtml(formatStructure(farm))} · recebido R$ ${finRow.receivedThisMonth.toFixed(0)} · <strong class="status-${finRow.status}">${labelStatus(finRow.status)}</strong></div>` : ''}
          <div class="notes">${noteSections.join('')}</div>
        </section>
      `);
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <style>
          @page { margin: 24mm 16mm; size: A4; }
          * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; }
          body { color: #1A1814; }
          .cover { padding: 40px 20px; text-align: center; border-bottom: 2px solid #4A7C59; margin-bottom: 32px; }
          .cover h1 { font-size: 32px; color: #1A3A2E; margin: 0; letter-spacing: -0.6px; }
          .cover .sub { font-style: italic; color: #4A7C59; margin-top: 6px; font-size: 14px; }
          .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .stat { padding: 14px; background: #F5F0E6; border-radius: 12px; }
          .stat .num { font-size: 24px; font-weight: 600; color: #1A3A2E; }
          .stat .label { font-size: 10px; color: #8A8580; text-transform: uppercase; letter-spacing: 1px; }
          .farm { margin-bottom: 28px; page-break-inside: avoid; }
          .farm-head { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(26,58,46,0.1); margin-bottom: 14px; }
          .avatar { width: 48px; height: 48px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; }
          .farm h2 { font-size: 18px; margin: 0; color: #1A3A2E; }
          .farm-head p { font-size: 11px; color: #8A8580; margin: 2px 0 0; }
          .payment { background: rgba(74,124,89,0.06); border-left: 3px solid #4A7C59; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #4A4640; margin-bottom: 14px; }
          .status-paid { color: #4A7C59; }
          .status-pending { color: #D4842B; }
          .status-overdue { color: #DC3545; }
          .note { background: #FAFAF7; border-left: 3px solid #7BA05B; padding: 12px 14px; border-radius: 8px; margin-bottom: 10px; }
          .note-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .note-title { font-weight: 600; font-size: 13px; color: #1A1814; }
          .note-time { font-size: 10px; color: #8A8580; }
          .note-text { font-style: italic; font-size: 12px; color: #4A4640; line-height: 1.5; margin: 4px 0 8px; }
          .photos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 8px 0; }
          .photo { width: 100%; height: 80px; object-fit: cover; border-radius: 8px; }
          .meta { font-size: 11px; color: #8A8580; margin: 6px 0 0; }
          footer { text-align: center; padding: 20px 0; color: #8A8580; font-size: 10px; border-top: 1px solid rgba(26,58,46,0.1); margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>${MONTHS[month - 1]} · ${year}</h1>
          <p class="sub">Leonardo Consultoria — relatório mensal de visitas</p>
        </div>

        <div class="summary">
          <div class="stat">
            <div class="num">${farmCards.length}</div>
            <div class="label">Fazendas visitadas</div>
          </div>
          <div class="stat">
            <div class="num">R$ ${summary.receivedTotal.toFixed(0)}</div>
            <div class="label">Recebido</div>
          </div>
          <div class="stat">
            <div class="num">R$ ${summary.pendingTotal.toFixed(0)}</div>
            <div class="label">Pendente</div>
          </div>
        </div>

        ${farmCards.length === 0 ? `<p style="text-align:center;color:#8A8580;padding:60px 20px">Nenhuma visita registrada neste mês.</p>` : farmCards.join('')}

        <footer>
          Gerado em ${new Date().toLocaleDateString('pt-BR')} — Leonardo Consultoria
        </footer>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Relatório ${MONTHS[month - 1]}/${year}`,
        UTI: 'com.adobe.pdf',
      });
    }
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function labelStatus(status: 'paid' | 'pending' | 'overdue' | 'none'): string {
  return status === 'paid' ? 'Pago' : status === 'pending' ? 'Pendente' : status === 'overdue' ? 'Atrasado' : 'Sem cobrança';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
