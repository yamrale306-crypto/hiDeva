import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * User-defined screening rules: if/then logic for incoming calls
 * Example: if caller is in VIP list → always ring
 *          if caller is known spam → auto-block
 */

export const ruleActionEnum = ['forward', 'block', 'record', 'voicemail'] as const;

export const userRules = pgTable('user_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Human-readable name
  name: varchar('name', { length: 255 }).notNull(),
  
  // Match condition: phone pattern, contact list, keyword, etc.
  // For MVP: simple patterns like "+919876*", "known_contacts", "spam_keyword"
  matchCondition: varchar('match_condition', { length: 255 }).notNull(),
  
  // What to do if matched
  action: varchar('action', { length: 50 }).notNull(),
  
  // Optional: description
  description: text('description'),
  
  // Is this rule active?
  isActive: boolean('is_active').default(true).notNull(),
  
  // Priority: higher number = checked first
  priority: varchar('priority', { length: 50 }).default('medium'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserRuleSchema = createInsertSchema(userRules)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUserRule = z.infer<typeof insertUserRuleSchema>;
export type UserRule = typeof userRules.$inferSelect;
