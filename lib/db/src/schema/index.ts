// Telephony schema (core call lifecycle, contacts, routing rules)
export * from './telephony';
export * from './profiles';

// Phase 3: Voice Screening schema (AI screening sessions, transcripts, safety events)
export {
  // Tables
  voiceScreeningSessions,
  callTranscripts as voiceCallTranscripts,
  safetyEvents,
  // Types
  type VoiceScreeningSession,
  type InsertVoiceScreeningSession,
  type InsertCallTranscript,
  type InsertSafetyEvent,
  type CallTranscript as VoiceCallTranscript,
  type SafetyEvent,
  // Schemas
  insertVoiceScreeningSessionSchema,
  insertCallTranscriptSchema,
  insertSafetyEventSchema,
  // Validation
  VALID_INTENTS,
  VALID_DISPOSITIONS,
  VALID_SAFETY_EVENTS,
  VALID_SEVERITIES,
  VALID_SESSION_STATUSES,
  intentSchema,
  dispositionSchema,
  safetyEventTypeSchema,
  severitySchema,
  sessionStatusSchema,
  createVoiceSessionSchema,
  updateVoiceSessionSchema,
  createTranscriptSchema,
  createSafetyEventSchema,
  type CreateVoiceSessionInput,
  type UpdateVoiceSessionInput,
  type CreateTranscriptInput,
  type CreateSafetyEventInput,
} from './voiceScreening';

// Namespace export for grouped access
export * as voiceScreening from './voiceScreening';