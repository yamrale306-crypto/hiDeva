/*
 * src/routes/stream.ts
 * WebSocket endpoint scaffolding for /api/telephony/stream
 * - Accepts WebSocket handshakes
 * - Calls voiceScreeningService.createSession() and sendGreeting()
 * - Handles binary audio chunks and forwards to audio pipeline
 * - Emits turn-based logs and safety events to DB handlers
 *
 * TODO: Replace placeholder imports with real implementations from your codebase.
 */

import http from 'http';
import { WebSocketServer, RawData } from 'ws';
import type { IncomingMessage } from 'http';

// Placeholder service imports - replace with your app's modules
import VoiceScreeningService from '../../artifacts/api-server/src/services/voiceScreeningService';
import { audioPipeline } from '../services/audioPipeline';
import { dbHandlers } from '../services/dbHandlers';
import { logger } from '../../artifacts/api-server/src/lib/logger';

const voiceScreeningService = VoiceScreeningService;

// Attach a WebSocket endpoint to an existing HTTP server.
// Call attachStreamEndpoint(server) from your app's server bootstrap.
export function attachStreamEndpoint(server: http.Server, path = '/api/telephony/stream') {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 * 5 }); // 5MB frame limit

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const { url } = request;
    if (!url || !url.startsWith(path)) return; // let other upgrades pass

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', async (ws, req: IncomingMessage) => {
    // Create a session using the voice screening service
    const remoteAddr = req.socket.remoteAddress || 'unknown';
    let session: any;
    try {
      session = await voiceScreeningService.createSession({ remoteAddr });
      await voiceScreeningService.sendGreeting(session);
      logger?.info?.('Session created', { sessionId: session.id, remoteAddr });
    } catch (err) {
      logger?.error?.('Failed to create/send greeting for session', err);
      ws.close(1011, 'session-init-failed');
      return;
    }

    // Helper: persist turn/safety events
    const emitEvent = async (type: 'turn' | 'safety', payload: any) => {
      try {
        if (type === 'turn') await dbHandlers.insertTurnLog(session.id, payload);
        if (type === 'safety') await dbHandlers.insertSafetyEvent(session.id, payload);
      } catch (e) {
        logger?.warn?.('DB handler failed', e);
      }
    };

    ws.on('message', (data: RawData, isBinary: boolean) => {
      try {
        if (isBinary) {
          // Forward binary audio chunk to audio pipeline
          audioPipeline.pushChunk(session.id, Buffer.from(data));

          // Optionally emit a lightweight turn log for chunk receipt
          emitEvent('turn', { type: 'audio-chunk', size: data.byteLength, timestamp: Date.now() });
        } else {
          // Parse control/meta messages (JSON expected)
          const text = data.toString();
          let msg: any;
          try { msg = JSON.parse(text); } catch { msg = { raw: text }; }

          // Handle expected control messages, e.g., 'end', 'meta', 'safety' flags
          if (msg.type === 'end') {
            audioPipeline.flush(session.id);
            emitEvent('turn', { type: 'session-end', timestamp: Date.now() });
          } else if (msg.type === 'safety') {
            emitEvent('safety', { level: msg.level || 'unknown', details: msg });
          } else {
            // Generic metadata log
            emitEvent('turn', { type: 'meta', payload: msg });
          }
        }
      } catch (err) {
        logger?.error?.('Error processing message', err);
      }
    });

    ws.on('close', (code, reason) => {
      logger?.info?.('WS closed', { sessionId: session.id, code, reason: reason?.toString() });
      // Finalize session and pipeline
      audioPipeline.closeSession?.(session.id).catch((e: any) => logger?.warn?.(e));
      emitEvent('turn', { type: 'ws-close', code, reason: reason?.toString(), timestamp: Date.now() });
    });

    ws.on('error', (err) => {
      logger?.error?.('WS error', err);
      emitEvent('safety', { type: 'ws-error', error: String(err), timestamp: Date.now() });
    });

    // Optionally send keepalive/ping messages or session metadata on connect
    ws.send(JSON.stringify({ type: 'session', sessionId: session.id, message: 'connected' }));
  });

  return wss; // return the server instance for testing or instrumentation
}

// Lightweight default export for convenience
export default attachStreamEndpoint;
