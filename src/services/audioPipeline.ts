/*
 * Minimal audioPipeline adapter
 * - pushChunk(sessionId, Buffer)
 * - flush(sessionId)
 * - closeSession(sessionId)
 *
 * This is a safe stub that logs activity and buffers chunks in-memory briefly.
 * Replace with your real audio processing pipeline integration (FFmpeg/protobuf/TTS/STT) later.
 */

import { logger } from "../../artifacts/api-server/src/lib/logger";

const queues: Record<string, Buffer[]> = {};

export const audioPipeline = {
  pushChunk: async (sessionId: string, chunk: Buffer) => {
    queues[sessionId] = queues[sessionId] || [];
    queues[sessionId].push(chunk);
    logger.debug({ sessionId, size: chunk.length }, "audioPipeline: chunk queued");
    // In real impl: forward chunk to STT/encoder/streaming worker
    return Promise.resolve();
  },

  flush: (sessionId: string) => {
    const q = queues[sessionId] || [];
    logger.info({ sessionId, queuedChunks: q.length }, "audioPipeline: flush called");
    // In real impl: finalize/commit any buffered audio
    queues[sessionId] = [];
  },

  closeSession: async (sessionId: string) => {
    logger.info({ sessionId }, "audioPipeline: closing session");
    queues[sessionId] = [];
    return Promise.resolve();
  },
};

export default audioPipeline;
