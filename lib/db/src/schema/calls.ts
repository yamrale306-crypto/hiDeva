import { pgTable, uuid, text, timestamp, varchar, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Call status lifecycle:
 * initiated → screening → (forwarded | blocked) | completed
 */
export const callStatusEnum = pgEnum('call_status', [
  'initiated',   // Call ringing or hitting the proxy
  'screening',   // Deva is interacting with the caller
  'forwarded',   // Call redirected to the user's live device
  'completed',   // Call ended normally
  'blocked',     // Identified as spam and dropped
]);

/**
 * Call disposition after screening — what Deva decided to do
 */
export const callDispositionEnum = pgEnum('call_disposition', [
  'pending',     // Still being screened
  'forwarded',   // User will receive the call
  'blocked',     // Call was blocked (spam/DND)
  'recorded',    // Caller left a message
  'voicemail',   // Forwarded to voicemail
]);

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // Links to user profiles table
  
  // Telephony provider reference
  telephonyCallSid: varchar('telephony_call_sid', { length: 255 }).notNull().unique(),
  
  // Call metadata
  callerNumber: varchar('caller_number', { length: 20 }).notNull(),
  callerName: varchar('caller_name', { length: 255 }),
  
  // Call state
  status: callStatusEnum('status').default('initiated').notNull(),
  disposition: callDispositionEnum('disposition').default('pending').notNull(),
  
  // Language & AI metadata
  detectedLanguage: varchar('detected_language', { length: 10 }).default('en'), // hi, mr, gu, ta, te, kn, ml
  callerIntent: text('caller_intent'), // What the caller said they wanted (e.g., "order food")
  
  // Call outcomes
  callSummary: text('call_summary'), // AI-generated summary post-call
  recordingUrl: text('recording_url'), // Link to audio payload
  recordingDurationSeconds: integer('recording_duration_seconds'),
  
  // Timestamps
  callStartedAt: timestamp('call_started_at'),
  callEndedAt: timestamp('call_ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCallSchema = createInsertSchema(calls)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
