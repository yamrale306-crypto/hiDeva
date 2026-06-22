import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { calls } from './calls';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const callTranscripts = pgTable('call_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id')
    .references(() => calls.id, { onDelete: 'cascade' })
    .notNull(),
  
  // Who said this: 'caller' or 'deva'
  speaker: varchar('speaker', { length: 50 }).notNull(),
  
  // The actual transcript text
  text: text('text').notNull(),
  
  // Language the speaker was using (may differ per turn in multilingual calls)
  language: varchar('language', { length: 10 }).default('en'),
  
  // When in the call this was spoken (seconds from call start)
  offsetSeconds: timestamp('offset_seconds'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertCallTranscriptSchema = createInsertSchema(callTranscripts)
  .omit({ id: true, createdAt: true });

export type InsertCallTranscript = z.infer<typeof insertCallTranscriptSchema>;
export type CallTranscript = typeof callTranscripts.$inferSelect;
