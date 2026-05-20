import { notesRepo, mediaRepo } from '../repositories/notes';
import { visitsRepo } from '../repositories/visits';
import { weeksRepo } from '../repositories/weeks';
import { currentWeek, type WeekRef } from '../lib/date';
import type { NoteKind, MediaType } from '../lib/contracts';
import type { Note, Media } from '../db/schema';

export type NoteWithMedia = Note & { media: Media[] };

export const notesService = {
  async listForFarmAndWeek(farmId: number, ref: WeekRef = currentWeek()): Promise<NoteWithMedia[]> {
    const week = await weeksRepo.findOrCreate(ref);
    const visit = await visitsRepo.getByFarmAndWeek(farmId, week.id);
    if (!visit) return [];
    const noteRows = await notesRepo.listByVisit(visit.id);
    const result: NoteWithMedia[] = [];
    for (const n of noteRows) {
      const m = await mediaRepo.listByNote(n.id);
      result.push({ ...n, media: m });
    }
    return result;
  },

  async createNote(
    farmId: number,
    data: { title?: string; kind?: NoteKind; noteText?: string },
    ref: WeekRef = currentWeek()
  ): Promise<NoteWithMedia> {
    const week = await weeksRepo.findOrCreate(ref);
    let visit = await visitsRepo.getByFarmAndWeek(farmId, week.id);
    if (!visit) {
      visit = await visitsRepo.mark(farmId, week.id);
    }
    const note = await notesRepo.create(visit.id, data);
    return { ...note, media: [] };
  },

  async addMedia(noteId: number, data: { type: MediaType; filePath: string; durationSec?: number }): Promise<Media> {
    return mediaRepo.create({ noteId, ...data });
  },

  async deleteNote(id: number): Promise<void> {
    return notesRepo.delete(id);
  },

  async deleteMedia(id: number): Promise<void> {
    return mediaRepo.delete(id);
  },
};
