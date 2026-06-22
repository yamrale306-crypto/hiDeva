/**
 * Phase 3: Voice Screening Schema
 *
 * Tables for AI voice screening pipeline:
 * - voice_screening_sessions: Tracks each voice screening conversation
 * - call_transcripts: Word-by-word transcript with sentiment/entities
 * - safety_events: Logs of detected safety issues (jailbreak, PII, injection, etc.)
 *
 * Designed for:
 * - Fast lookups by call_id or session_id
 * - Audit trail compliance (immutable records)
 * - ML training data (transcripts + classifications)
 * - Real-time monitoring (safety events)
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { calls } from './telephony';

/**
 * Voice Screening Sessions
 *
 * Tracks each voice conversation with an AI screening agent.
 * One session per call when decision == 'screen'.
 *
 * Fields:
 * - intent_detected: What we think the caller wants (legitimate_business, spam, scam, etc.)
 * - legitimacy_score: 0-100 (0=definite spam, 100=definite legitimate)
 * - harmlessness_score: 0-100 (0=harmful, 100=safe)
 * - ai_disposition: Final routing decision (connect, reject, escalate)
 */
export const voiceScreeningSessions = pgTable(
  'voice_screening_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign key to calls table
    callId: uuid('call_id')
      .references(() => calls.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').notNull(),

    // WebSocket connection tracking
    websocketSessionId: varchar('websocket_session_id', { length: 255 }).unique(),

    // Session lifecycle
    status: varchar('status', { length: 50 }).default('initiated').notNull(),
    // initiated → in_progress → completed → failed

    // Caller interaction flags
    callerSpoke: boolean('caller_spoke').default(false).notNull(),
    callerUtterance: text('caller_utterance'), // Full text of what caller said

    // Intent classification (AI judgment)
    intentDetected: varchar('intent_detected', { length: 100 }),
    // legitimate_business | legitimate_personal | spam_sales | scam_attempt | unclear
    intentConfidence: numeric('intent_confidence', { precision: 5, scale: 2 }), // 0.0-100.0

    // Scoring (overall assessment)
    legitimacyScore: numeric('legitimacy_score', { precision: 5, scale: 2 }), // 0-100
    harmlessScore: numeric('harmlessness_score', { precision: 5, scale: 2 }), // 0-100

    // Final routing decision
    aiDisposition: varchar('ai_disposition', { length: 50 }),
    // connect | reject | escalate_to_user
    dispositionReason: text('disposition_reason'), // Why this decision was made

    // Voice artifacts (URLs pointing to S3/GCS)
    transcriptUrl: varchar('transcript_url', { length: 500 }), // Full transcript stored in S3
    audioUrl: varchar('audio_url', { length: 500 }), // Audio recording (with user consent)

    // Performance metrics (for monitoring)
    durationMs: integer('duration_ms'), // Total session duration
    responseTimeMs: integer('response_time_ms'), // AI response latency
    turnsCount: integer('turns_count').default(0).notNull(), // Number of speaker turns

    // Lifecycle timestamps
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Performance indices
    callIdIdx: index('voice_sessions_call_id_idx').on(table.callId),
    userIdIdx: index('voice_sessions_user_id_idx').on(table.userId),
    statusIdx: index('voice_sessions_status_idx').on(table.status),
    intentIdx: index('voice_sessions_intent_idx').on(table.intentDetected),
    dispositionIdx: index('voice_sessions_disposition_idx').on(
      table.aiDisposition
    ),
    completedAtIdx: index('voice_sessions_completed_at_idx').on(
      table.completedAt
    ),
  })
);

export const insertVoiceScreeningSessionSchema = createInsertSchema(
  voiceScreeningSessions
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VoiceScreeningSession =
  typeof voiceScreeningSessions.$inferSelect;
export type InsertVoiceScreeningSession = z.infer<
  typeof insertVoiceScreeningSessionSchema
>;

/**
 * Call Transcripts
 *
 * Word-by-word transcript of the voice screening conversation.
 * Each turn (caller or deva) is a separate record for fine-grained analysis.
 *
 * Used for:
 * - Audit trail (what was said, in what order)
 * - ML training (intent classification, sentiment)
 * - Entity extraction (names, numbers, dates mentioned)
 * - Compliance logging (PII detection)
 */
export const callTranscripts = pgTable(
  'call_transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Association to voice screening session
    voiceSessionId: uuid('voice_session_id')
      .references(() => voiceScreeningSessions.id, { onDelete: 'cascade' })
      .notNull(),

    // Speaker and content
    speaker: varchar('speaker', { length: 50 }).notNull(), // 'caller' | 'deva'
    text: text('text').notNull(), // What was said (transcript or TTS output)

    // Timing within the session
    startTimeMs: integer('start_time_ms'), // When this turn started (milliseconds into session)
    endTimeMs: integer('end_time_ms'), // When this turn ended

    // Analysis (added by AI/ML pipeline)
    sentiment: varchar('sentiment', { length: 20 }), // positive | neutral | negative | aggressive
    entities: text('entities'), // JSON: [{ type: 'name', value: '...' }, { type: 'phone', value: '...' }]
    isPII: boolean('is_pii').default(false).notNull(), // Flagged if PII detected

    // Speech-to-text confidence
    confidence: numeric('confidence', { precision: 5, scale: 2 }), // 0.0-100.0 (STT confidence)

    // Metadata
    language: varchar('language', { length: 10 }).default('en').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Lookup indices
    sessionIdx: index('transcripts_session_idx').on(table.voiceSessionId),
    speakerIdx: index('transcripts_speaker_idx').on(table.speaker),
    piiIdx: index('transcripts_pii_idx').on(table.isPII),
    timeIdx: index('transcripts_time_idx').on(table.startTimeMs),
  })
);

export const insertCallTranscriptSchema = createInsertSchema(
  callTranscripts
).omit({
  id: true,
  createdAt: true,
});

export type CallTranscript = typeof callTranscripts.$inferSelect;
export type InsertCallTranscript = z.infer<typeof insertCallTranscriptSchema>;

/**
 * Safety Events
 *
 * Logs of detected safety issues or security concerns during voice screening.
 * Examples:
 * - Prompt injection attempts ("ignore previous instructions")
 * - Jailbreak attempts ("pretend you are...")
 * - Harmful content detection (threats, violence)
 * - PII leakage prevention (SSN, credit card numbers)
 * - Spam/scam patterns detected
 *
 * Used for:
 * - Audit trail (security compliance)
 * - Real-time monitoring & alerting
 * - ML training (improve detection)
 * - Incident response (what happened and when)
 */
export const safetyEvents = pgTable(
  'safety_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Association to voice screening session
    voiceSessionId: uuid('voice_session_id')
      .references(() => voiceScreeningSessions.id, { onDelete: 'cascade' })
      .notNull(),

    // Event classification
    eventType: varchar('event_type', { length: 100 }).notNull(),
    // prompt_injection_attempt | jailbreak_attempt | harmful_content | pii_leak |
    // spam_pattern | scam_pattern | rate_limit_exceeded | timeout | error

    // Severity level (guides alert routing)
    severity: varchar('severity', { length: 20 }).notNull(),
    // low | medium | high | critical

    // Detailed information
    description: text('description'), // Human-readable description
    context: text('context'), // JSON: { pattern: "...", matched: "...", raw_text: "..." }

    // Response to the event
    actionTaken: varchar('action_taken', { length: 100 }).notNull(),
    // blocked | logged | escalated | user_warned | session_terminated

    // Audit information
    detectionMethod: varchar('detection_method', { length: 100 }), // regex | ml_model | heuristic | manual
    confidence: numeric('confidence', { precision: 5, scale: 2 }), // 0-100, how sure we are

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Monitoring indices (for real-time alerting)
    sessionIdx: index('safety_events_session_idx').on(table.voiceSessionId),
    eventTypeIdx: index('safety_events_type_idx').on(table.eventType),
    severityIdx: index('safety_events_severity_idx').on(table.severity),
    actionIdx: index('safety_events_action_idx').on(table.actionTaken),
    createdAtIdx: index('safety_events_created_at_idx').on(table.createdAt),
  })
);

export const insertSafetyEventSchema = createInsertSchema(safetyEvents).omit({
  id: true,
  createdAt: true,
});

export type SafetyEvent = typeof safetyEvents.$inferSelect;
export type InsertSafetyEvent = z.infer<typeof insertSafetyEventSchema>;

/**
 * Validation Schemas
 *
 * Stricter validation for critical fields (used at API boundaries)
 */

// Intent classification must be one of these
export const VALID_INTENTS = [
  'legitimate_business',
  'legitimate_personal',
  'spam_sales',
  'scam_attempt',
  'unclear',
] as const;

export const intentSchema = z.enum(VALID_INTENTS);

// Disposition must be one of these
export const VALID_DISPOSITIONS = [
  'connect',
  'reject',
  'escalate_to_user',
] as const;

export const dispositionSchema = z.enum(VALID_DISPOSITIONS);

// Safety event types
export const VALID_SAFETY_EVENTS = [
  'prompt_injection_attempt',
  'jailbreak_attempt',
  'harmful_content',
  'pii_leak',
  'spam_pattern',
  'scam_pattern',
  'rate_limit_exceeded',
  'timeout',
  'error',
] as const;

export const safetyEventTypeSchema = z.enum(VALID_SAFETY_EVENTS);

// Severity levels
export const VALID_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const severitySchema = z.enum(VALID_SEVERITIES);

// Session status
export const VALID_SESSION_STATUSES = [
  'initiated',
  'in_progress',
  'completed',
  'failed',
] as const;

export const sessionStatusSchema = z.enum(VALID_SESSION_STATUSES);

/**
 * API Validation Schemas
 *
 * Use these at API boundaries to ensure data integrity
 */

export const createVoiceSessionSchema = z.object({
  callId: z.string().uuid('Invalid call ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const updateVoiceSessionSchema = z.object({
  status: sessionStatusSchema.optional(),
  intentDetected: intentSchema.optional(),
  intentConfidence: z.number().min(0).max(100).optional(),
  legitimacyScore: z.number().min(0).max(100).optional(),
  harmlessScore: z.number().min(0).max(100).optional(),
  aiDisposition: dispositionSchema.optional(),
  dispositionReason: z.string().optional(),
});

export const createTranscriptSchema = z.object({
  voiceSessionId: z.string().uuid('Invalid session ID'),
  speaker: z.enum(['caller', 'deva']),
  text: z.string().min(1).max(5000),
  startTimeMs: z.number().int().min(0).optional(),
  endTimeMs: z.number().int().min(0).optional(),
});

export const createSafetyEventSchema = z.object({
  voiceSessionId: z.string().uuid('Invalid session ID'),
  eventType: safetyEventTypeSchema,
  severity: severitySchema,
  description: z.string().optional(),
  actionTaken: z.enum([
    'blocked',
    'logged',
    'escalated',
    'user_warned',
    'session_terminated',
  ]),
});

export type CreateVoiceSessionInput = z.infer<typeof createVoiceSessionSchema>;
export type UpdateVoiceSessionInput = z.infer<typeof updateVoiceSessionSchema>;
export type CreateTranscriptInput = z.infer<typeof createTranscriptSchema>;
export type CreateSafetyEventInput = z.infer<typeof createSafetyEventSchema>;
