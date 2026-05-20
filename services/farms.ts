import { eq, inArray, and, gte, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { visits, notes as notesTable, media as mediaTable, weeks } from '../db/schema';
import { visitsRepo } from '../repositories/visits';
import { farmsRepo } from '../repositories/farms';
import { paymentsRepo } from '../repositories/payments';

export type FarmCounts = {
  visits: number;
  notes: number;
  photos: number;
  videos: number;
  audios: number;
};

export type WeekStat = {
  weekId: number;
  year: number;
  week: number;
  start: string;
  end: string;
  noteCount: number;
  audioCount: number;
  photoCount: number;
  videoCount: number;
  hasVisit: boolean;
};

export const farmsService = {
  async countContent(farmId: number): Promise<FarmCounts> {
    const visitsList = await visitsRepo.listByFarm(farmId);
    if (visitsList.length === 0) {
      return { visits: 0, notes: 0, photos: 0, videos: 0, audios: 0 };
    }
    const visitIds = visitsList.map((v) => v.id);
    const noteRows = await db.select().from(notesTable).where(inArray(notesTable.visitId, visitIds));
    if (noteRows.length === 0) {
      return { visits: visitsList.length, notes: 0, photos: 0, videos: 0, audios: 0 };
    }
    const noteIds = noteRows.map((n) => n.id);
    const mediaRows = await db.select().from(mediaTable).where(inArray(mediaTable.noteId, noteIds));
    return {
      visits: visitsList.length,
      notes: noteRows.length,
      photos: mediaRows.filter((m) => m.type === 'photo').length,
      videos: mediaRows.filter((m) => m.type === 'video').length,
      audios: mediaRows.filter((m) => m.type === 'audio').length,
    };
  },

  async getWeekStats(farmId: number, year: number): Promise<Map<number, WeekStat>> {
    const visitsList = await visitsRepo.listByFarm(farmId);
    const weekIds = visitsList.map((v) => v.weekId);
    if (weekIds.length === 0) return new Map();

    const weekRows = await db
      .select()
      .from(weeks)
      .where(and(eq(weeks.year, year), inArray(weeks.id, weekIds)));

    const visitsByWeek = new Map(visitsList.map((v) => [v.weekId, v]));
    const result = new Map<number, WeekStat>();

    for (const w of weekRows) {
      const visit = visitsByWeek.get(w.id);
      if (!visit) continue;

      const noteRows = await db.select().from(notesTable).where(eq(notesTable.visitId, visit.id));
      const noteIds = noteRows.map((n) => n.id);
      const mediaRows = noteIds.length > 0
        ? await db.select().from(mediaTable).where(inArray(mediaTable.noteId, noteIds))
        : [];

      result.set(w.weekNumber, {
        weekId: w.id,
        year: w.year,
        week: w.weekNumber,
        start: w.startDate,
        end: w.endDate,
        noteCount: noteRows.length,
        audioCount: mediaRows.filter((m) => m.type === 'audio').length,
        photoCount: mediaRows.filter((m) => m.type === 'photo').length,
        videoCount: mediaRows.filter((m) => m.type === 'video').length,
        hasVisit: true,
      });
    }
    return result;
  },

  async hardDeleteWithCascade(farmId: number): Promise<void> {
    const visitsList = await visitsRepo.listByFarm(farmId);
    if (visitsList.length > 0) {
      const visitIds = visitsList.map((v) => v.id);
      const noteRows = await db.select().from(notesTable).where(inArray(notesTable.visitId, visitIds));
      if (noteRows.length > 0) {
        const noteIds = noteRows.map((n) => n.id);
        await db.delete(mediaTable).where(inArray(mediaTable.noteId, noteIds));
        await db.delete(notesTable).where(inArray(notesTable.visitId, visitIds));
      }
      await db.delete(visits).where(eq(visits.farmId, farmId));
    }
    await farmsRepo.hardDelete(farmId);
  },

  async moveToTrashWithGrace(farmId: number): Promise<void> {
    await farmsRepo.moveToTrash(farmId);
  },

  async purgeExpiredTrash(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ids = await farmsRepo.purgeExpiredTrash(cutoff);
    for (const id of ids) {
      await this.hardDeleteWithCascade(id);
    }
    return ids.length;
  },
};
