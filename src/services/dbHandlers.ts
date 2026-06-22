/*
 * Minimal dbHandlers adapter
 * - insertTurnLog(sessionId, payload)
 * - insertSafetyEvent(sessionId, payload)
 *
 * Delegates to VoiceScreeningService where possible; otherwise logs.
 */

import VoiceScreeningService from "../../artifacts/api-server/src/services/voiceScreeningService";
import { logger } from "../../artifacts/api-server/src/lib/logger";

export const dbHandlers = {
  insertTurnLog: async (sessionId: string, payload: any) => {
    try {
      // If payload is a simple transcript/meta, log as transcript
      if (payload?.type === 'audio-chunk') {
        // store a placeholder transcript entry indicating an audio chunk was received
        await VoiceScreeningService.logTranscript(sessionId, 'caller', '[binary-audio-chunk]', Date.now(), Date.now());
      } else if (payload?.type === 'meta') {
        const text = JSON.stringify(payload.payload ?? payload);
        await VoiceScreeningService.logTranscript(sessionId, 'caller', text);
      } else if (payload?.type === 'session-end') {
        await VoiceScreeningService.logTranscript(sessionId, 'deva', 'session-end');
      } else {
        // Generic fallback
        await VoiceScreeningService.logTranscript(sessionId, 'caller', JSON.stringify(payload));
      }
    } catch (err) {
      logger?.warn?.({ err }, 'dbHandlers.insertTurnLog fallback');
    }
  },

  insertSafetyEvent: async (sessionId: string, payload: any) => {
    try {
      const eventType = payload?.type || 'error';
      const severity = payload?.severity || 'low';
      const description = payload?.details ? JSON.stringify(payload.details) : JSON.stringify(payload);
      const actionTaken = payload?.actionTaken || 'logged';

      // Map generic payloads into the service method signature; use safe defaults
      await VoiceScreeningService.logSafetyEvent(
        sessionId,
        eventType === 'pii' ? 'pii_leak' : (eventType as any) || 'error',
        (severity as any) || 'low',
        description,
        (actionTaken as any) || 'logged'
      );
    } catch (err) {
      logger?.warn?.({ err }, 'dbHandlers.insertSafetyEvent fallback');
    }
  },
};

export default dbHandlers;
