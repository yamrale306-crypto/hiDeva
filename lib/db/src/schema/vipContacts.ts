import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * VIP / Priority contacts
 * Contacts that should always ring through, skip screening, or get special handling
 */

export const priorityLevelEnum = ['high', 'medium', 'low'] as const;

export const vipContacts = pgTable('vip_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Phone number or pattern
  phonePattern: varchar('phone_pattern', { length: 20 }).notNull(),
  
  // Contact name / label
  name: varchar('name', { length: 255 }).notNull(),
  
  // Priority tier: how to treat this contact
  priority: varchar('priority', { length: 50 }).default('medium'),
  
  // Optional relationship or context
  relationship: text('relationship'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertVipContactSchema = createInsertSchema(vipContacts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertVipContact = z.infer<typeof insertVipContactSchema>;
export type VipContact = typeof vipContacts.$inferSelect;
