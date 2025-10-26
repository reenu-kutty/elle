import { SessionData } from './types';

// In-memory store for session data
// Note: In production, this should be replaced with a proper database
const sessions = new Map<string, SessionData>();

export const sessionStore = {
  set: (sessionId: string, data: SessionData) => {
    sessions.set(sessionId, data);
  },

  get: (sessionId: string): SessionData | undefined => {
    return sessions.get(sessionId);
  },

  has: (sessionId: string): boolean => {
    return sessions.has(sessionId);
  },

  delete: (sessionId: string): boolean => {
    return sessions.delete(sessionId);
  },

  // Clean up old sessions (older than 1 hour)
  cleanup: () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [sessionId, data] of sessions.entries()) {
      if (data.createdAt < oneHourAgo) {
        sessions.delete(sessionId);
      }
    }
  },
};

// Run cleanup every 30 minutes
setInterval(() => {
  sessionStore.cleanup();
}, 30 * 60 * 1000);
