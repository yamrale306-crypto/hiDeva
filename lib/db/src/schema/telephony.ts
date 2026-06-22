import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Core call record — minimal, fast queries
 * Stores every incoming call with decision outcome
 */
export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Exotel reference
  telephonyCallSid: varchar('telephony_call_sid', { length: 255 }).notNull().unique(),
  
  // Caller metadata
  callerNumber: varchar('caller_number', { length: 20 }).notNull(),
  
  // Decision outcome
  status: varchar('status', { length: 50 }).default('screening').notNull(), // connect, reject, screening
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('calls_user_id_idx').on(table.userId),
  callSidIdx: index('calls_call_sid_idx').on(table.telephonyCallSid),
}));

export const insertCallSchema = createInsertSchema(calls)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

/**
 * Contact directory — VIPs, known spammers, priority tiers
 * Fast lookup: userId + phoneNumber
 */
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Phone identifier
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  
  // Contact metadata
  name: varchar('name', { length: 255 }),
  priority: varchar('priority', { length: 50 }).default('medium'), // high, medium, low
  
  // Flags
  isSpamReported: boolean('is_spam_reported').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userPhoneIdx: index('contacts_user_phone_idx').on(table.userId, table.phoneNumber),
}));

export const insertContactSchema = createInsertSchema(contacts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

/**
 * Routing rules — custom user logic for call disposition
 * Evaluated in order of priority
 */
export const routingRules = pgTable('routing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Rule metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Trigger condition
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // unknown, keyword, pattern, time_based
  triggerValue: varchar('trigger_value', { length: 255 }), // e.g., "1800*", "business_hours"
  
  // Action to take
  action: varchar('action', { length: 50 }).notNull(), // block, screen, connect
  
  // Execution order
  priority: integer('priority').default(100).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('routing_rules_user_id_idx').on(table.userId),
  activeIdx: index('routing_rules_active_idx').on(table.isActive),
}));

export const insertRoutingRuleSchema = createInsertSchema(routingRules)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type RoutingRule = typeof routingRules.$inferSelect;

/**
 * Transcripts — captured during screening or call recording
 * Stored asynchronously (not part of 3s path)
 */
export const callTranscripts = pgTable('call_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id')
    .references(() => calls.id, { onDelete: 'cascade' })
    .notNull(),
  
  speaker: varchar('speaker', { length: 50 }).notNull(), // caller, deva
  text: text('text').notNull(),
  language: varchar('language', { length: 10 }).default('en'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertCallTranscriptSchema = createInsertSchema(callTranscripts)
  .omit({ id: true, createdAt: true });

export type InsertCallTranscript = z.infer<typeof insertCallTranscriptSchema>;
export type CallTranscript = typeof callTranscripts.$inferSelect;
