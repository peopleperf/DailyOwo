import { getFirebaseDb } from '@/lib/firebase/config';
import { v4 as uuidv4 } from 'uuid';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ChatSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  context: Record<string, any>;
}

export class ChatSessionService {
  private db: Firestore | null = null;

  constructor() {
    getFirebaseDb().then(db => {
      if (db) this.db = db;
    });
  }

  private async ensureDb(maxRetries = 3, retryDelay = 1000): Promise<Firestore> {
    if (this.db) return this.db;
    
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ChatSession] Initializing Firestore (attempt ${attempt}/${maxRetries})`);
        const db = await getFirebaseDb();
        if (db) {
          this.db = db;
          console.log('[ChatSession] Firestore initialized successfully');
          return db;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ChatSession] Firestore init attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError || new Error('Firestore database not initialized after multiple attempts');
  }

  async createSession(userId: string, initialContext?: Record<string, any>): Promise<string> {
    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      context: initialContext || {}
    };

    const db = await this.ensureDb();
    await setDoc(doc(db, 'chatSessions', sessionId), session);
    return sessionId;
  }

  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    const messageWithMetadata: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };

    const db = await this.ensureDb();
    await updateDoc(doc(db, 'chatSessions', sessionId), {
      messages: arrayUnion(messageWithMetadata),
      updatedAt: new Date()
    });
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const db = await this.ensureDb();
    const docSnap = await getDoc(doc(db, 'chatSessions', sessionId));
    return docSnap.exists() ? docSnap.data() as ChatSession : null;
  }

  async getRecentSessions(userId: string, limit = 5): Promise<ChatSession[]> {
    const db = await this.ensureDb();
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      firestoreLimit(limit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as ChatSession);
  }
}