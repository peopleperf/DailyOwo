import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  userAgent: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  sessionToken: string;
  createdAt: Date;
}

export interface LoginActivity {
  id: string;
  userId: string;
  device: string;
  location: string;
  ip: string;
  userAgent: string;
  loginTime: Date;
  loginMethod: 'email' | 'google' | 'apple';
  success: boolean;
  failureReason?: string;
}

class SessionService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private initializeDb() {
    if (typeof window === 'undefined') return;
    this.db = getFirebaseDb();
  }

  private getDb() {
    if (!this.db) {
      this.initializeDb();
    }
    return this.db;
  }

  // ============= SESSION MANAGEMENT =============

  async createSession(userId: string, sessionData: Partial<UserSession>): Promise<UserSession> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const deviceInfo = this.getDeviceInfo();
    const locationInfo = await this.getLocationInfo();

    const session: UserSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location: locationInfo.location,
      ip: locationInfo.ip,
      userAgent: navigator.userAgent,
      loginTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      sessionToken: this.generateSessionToken(),
      createdAt: new Date(),
      ...sessionData
    };

    const sessionDoc = {
      ...session,
      loginTime: Timestamp.fromDate(session.loginTime),
      lastActivity: Timestamp.fromDate(session.lastActivity),
      createdAt: Timestamp.fromDate(session.createdAt)
    };

    await setDoc(doc(db, 'users', userId, 'sessions', session.id), sessionDoc);

    // Also log the login activity
    await this.logLoginActivity(userId, {
      device: deviceInfo.device,
      location: locationInfo.location,
      ip: locationInfo.ip,
      userAgent: navigator.userAgent,
      loginMethod: 'email',
      success: true
    });

    return session;
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(
      sessionsRef,
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const sessions: UserSession[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        device: data.device,
        browser: data.browser,
        os: data.os,
        location: data.location,
        ip: data.ip,
        userAgent: data.userAgent,
        loginTime: data.loginTime.toDate(),
        lastActivity: data.lastActivity.toDate(),
        isActive: data.isActive,
        sessionToken: data.sessionToken,
        createdAt: data.createdAt.toDate()
      });
    });

    return sessions;
  }

  async updateSessionActivity(userId: string, sessionId: string): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    await updateDoc(doc(db, 'users', userId, 'sessions', sessionId), {
      lastActivity: Timestamp.fromDate(new Date())
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    await updateDoc(doc(db, 'users', userId, 'sessions', sessionId), {
      isActive: false
    });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const sessions = await this.getActiveSessions(userId);
    
    const revokePromises = sessions
      .filter(session => session.id !== exceptSessionId)
      .map(session => this.revokeSession(userId, session.id));

    await Promise.all(revokePromises);
  }

  // ============= LOGIN ACTIVITY TRACKING =============

  async logLoginActivity(userId: string, activityData: Partial<LoginActivity>): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const activity: LoginActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      device: 'Unknown',
      location: 'Unknown',
      ip: 'Unknown',
      userAgent: navigator.userAgent,
      loginTime: new Date(),
      loginMethod: 'email',
      success: true,
      ...activityData
    };

    const activityDoc = {
      ...activity,
      loginTime: Timestamp.fromDate(activity.loginTime)
    };

    await setDoc(doc(db, 'users', userId, 'loginActivities', activity.id), activityDoc);
  }

  async getRecentLoginActivities(userId: string, limitCount: number = 10): Promise<LoginActivity[]> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const activitiesRef = collection(db, 'users', userId, 'loginActivities');
    const q = query(
      activitiesRef,
      orderBy('loginTime', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const activities: LoginActivity[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        userId: data.userId,
        device: data.device,
        location: data.location,
        ip: data.ip,
        userAgent: data.userAgent,
        loginTime: data.loginTime.toDate(),
        loginMethod: data.loginMethod,
        success: data.success,
        failureReason: data.failureReason
      });
    });

    return activities;
  }

  // ============= HELPER FUNCTIONS =============

  private getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPad/.test(userAgent)) device = 'iPad';
      else if (/iPhone/.test(userAgent)) device = 'iPhone';
      else device = 'Mobile';
    } else if (/Macintosh/.test(userAgent)) {
      device = 'Mac';
    } else if (/Windows/.test(userAgent)) {
      device = 'Windows PC';
    }

    // Detect browser
    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (/Mac OS X/.test(userAgent)) os = 'macOS';
    else if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/iPhone/.test(userAgent)) os = 'iOS';
    else if (/Android/.test(userAgent)) os = 'Android';

    return { device, browser, os };
  }

  private async getLocationInfo(): Promise<{ location: string; ip: string }> {
    try {
      // In production, you'd use a real IP geolocation service
      // For now, we'll use a simple fallback
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      
      // Simplified location detection - in production use a proper geolocation service
      return {
        location: 'Unknown Location',
        ip: ip || 'Unknown IP'
      };
    } catch (error) {
      return {
        location: 'Unknown Location',
        ip: 'Unknown IP'
      };
    }
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
  }

  // ============= CLEANUP FUNCTIONS =============

  async cleanupOldSessions(userId: string, olderThanDays: number = 30): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(
      sessionsRef,
      where('lastActivity', '<', Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  }

  async cleanupOldLoginActivities(userId: string, olderThanDays: number = 90): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const activitiesRef = collection(db, 'users', userId, 'loginActivities');
    const q = query(
      activitiesRef,
      where('loginTime', '<', Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  }
}

export const sessionService = new SessionService(); 