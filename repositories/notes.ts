import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { notes, media, type Note, type Media } from '../db/schema';
import type { NoteKind, MediaType } from '../lib/contracts';

export const notesRepo = {
  async listByVisit(visitId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.visitId, visitId)).orderBy(desc(notes.createdAt));
  },

  async create(visitId: number, data: { title?: string; kind?: NoteKind; noteText?: string }): Promise<Note> {
    const [created] = await db
      .insert(notes)
      .values({
        visitId,
        title: data.title,
        kind: data.kind ?? 'other',
        noteText: data.noteText,
      })
      .returning();
    return created;
  },

  async update(id: number, patch: Partial<{ title: string; noteText: string; kind: NoteKind }>): Promise<void> {
    await db.update(notes).set(patch).where(eq(notes.id, id));
  },

  async delete(id: number): Promise<void> {
    await db.delete(media).where(eq(media.noteId, id));
    await db.delete(notes).where(eq(notes.id, id));
  },
};

export const mediaRepo = {
  async listByNote(noteId: number): Promise<Media[]> {
    return db.select().from(media).where(eq(media.noteId, noteId));
  },

  async create(data: { noteId: number; type: MediaType; filePath: string; durationSec?: number; transcript?: string }): Promise<Media> {
    const [created] = await db.insert(media).values(data).returning();
    return created;
  },

  async delete(id: number): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  },
};
