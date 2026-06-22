// Telephony schema (core call lifecycle, contacts, routing rules)
export * from './telephony';
export * from './profiles';

// Phase 3: Voice Screening schema (AI screening sessions, transcripts, safety events)
// Export as a namespace to avoid symbol collisions with legacy telephony exports
export * as voiceScreening from './voiceScreening';

// Legacy schemas (deprecated, use telephony.ts instead)
// export * from './calls';
// export * from './callTranscripts';
// export * from './userRules';
// export * from './blockList';
// export * from './vipContacts';