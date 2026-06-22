import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Block list / Do Not Disturb (DND) numbers
 * Store spam, telemarketer, or user-blocked numbers
 */

export const blockListReasonEnum = ['spam', 'telemarketer', 'scam', 'user_blocked', 'dnd'] as const;

export const blockList = pgTable('block_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Phone number pattern (e.g., "+919876543210", "1800*")
  phonePattern: varchar('phone_pattern', { length: 20 }).notNull(),
  
  // Why is this blocked?
  reason: varchar('reason', { length: 50 }).default('user_blocked'),
  
  // Optional note
  note: text('note'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertBlockListSchema = createInsertSchema(blockList)
  .omit({ id: true, createdAt: true });

export type InsertBlockList = z.infer<typeof insertBlockListSchema>;
export type BlockList = typeof blockList.$inferSelect;
