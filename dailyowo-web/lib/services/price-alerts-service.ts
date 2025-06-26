/**
 * 🔔 Price Alerts Service - Real-time crypto price monitoring and notifications
 * 
 * Manages price alerts for cryptocurrencies with Firebase storage and real-time monitoring
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { cryptoService } from './crypto-service';

export interface PriceAlert {
  id: string;
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  lastChecked?: Date;
}

interface CreatePriceAlert {
  coinId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'above' | 'below';
}

interface PriceAlertDoc {
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Timestamp;
  triggeredAt?: Timestamp;
  lastChecked?: Timestamp;
}

class PriceAlertsService {
  private readonly COLLECTION_NAME = 'priceAlerts';
  private monitoringInterval: NodeJS.Timeout | null = null;
  private notificationCallbacks: Set<(alert: PriceAlert) => void> = new Set();

  /**
   * Create a new price alert
   */
  async createAlert(userId: string, alertData: CreatePriceAlert): Promise<string> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const now = serverTimestamp();
      
      const docData: Omit<PriceAlertDoc, 'id'> = {
        userId,
        coinId: alertData.coinId,
        symbol: alertData.symbol.toUpperCase(),
        name: alertData.name,
        targetPrice: alertData.targetPrice,
        currentPrice: alertData.currentPrice,
        condition: alertData.condition,
        isActive: true,
        isTriggered: false,
        createdAt: now as Timestamp,
        lastChecked: now as Timestamp
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), docData);
      
      // Start monitoring if this is the first alert
      this.startPriceMonitoring();
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating price alert:', error);
      throw new Error('Failed to create price alert');
    }
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      // Use simple query without orderBy to avoid index requirement
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const alerts: PriceAlert[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PriceAlertDoc;
        alerts.push(this.convertToAlert(doc.id, data));
      });

      // Sort alerts on the client side by creation date (newest first)
      alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return alerts;
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      throw new Error('Failed to fetch price alerts');
    }
  }

  /**
   * Subscribe to real-time updates of user alerts
   */
  subscribeToUserAlerts(
    userId: string, 
    callback: (alerts: PriceAlert[]) => void
  ): () => void {
    if (!db) {
      console.error('Firestore not initialized');
      return () => {};
    }

    // Use simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const alerts: PriceAlert[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PriceAlertDoc;
        alerts.push(this.convertToAlert(doc.id, data));
      });

      // Sort alerts on the client side by creation date (newest first)
      alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      callback(alerts);
    }, (error) => {
      console.error('Error in alerts subscription:', error);
    });
  }

  /**
   * Delete a price alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const alertRef = doc(db, this.COLLECTION_NAME, alertId);
      await deleteDoc(alertRef);
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw new Error('Failed to delete price alert');
    }
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId: string, isActive: boolean): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const alertRef = doc(db, this.COLLECTION_NAME, alertId);
      await updateDoc(alertRef, {
        isActive,
        lastChecked: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
      throw new Error('Failed to update alert');
    }
  }

  /**
   * Register a callback for price alert notifications
   */
  onAlertTriggered(callback: (alert: PriceAlert) => void): () => void {
    this.notificationCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  /**
   * Start monitoring prices for active alerts
   */
  private async startPriceMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log('Starting price monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllAlerts();
      } catch (error) {
        console.error('Error in price monitoring:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop price monitoring
   */
  stopPriceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Price monitoring stopped');
    }
  }

  /**
   * Check all active alerts against current prices
   */
  private async checkAllAlerts(): Promise<void> {
    if (!db) return;

    try {
      // Get all active alerts
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        where('isTriggered', '==', false)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.stopPriceMonitoring(); // No active alerts, stop monitoring
        return;
      }

      // Group alerts by symbol to minimize API calls
      const alertsBySymbol = new Map<string, Array<{ id: string; data: PriceAlertDoc }>>();
      
      snapshot.forEach((doc) => {
        const data = doc.data() as PriceAlertDoc;
        const alerts = alertsBySymbol.get(data.symbol) || [];
        alerts.push({ id: doc.id, data });
        alertsBySymbol.set(data.symbol, alerts);
      });

      // Check prices for each unique symbol
      for (const [symbol, alerts] of alertsBySymbol) {
        try {
          // Get current price for this symbol
          const coinData = await cryptoService.searchCoins(symbol);
          const coin = coinData.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
          
          if (!coin) {
            console.warn(`Could not find price data for ${symbol}`);
            continue;
          }

          const currentPrice = coin.current_price;

          // Check each alert for this symbol
          for (const { id, data } of alerts) {
            const shouldTrigger = this.shouldTriggerAlert(data, currentPrice);
            
            if (shouldTrigger) {
              await this.triggerAlert(id, data, currentPrice);
            } else {
              // Update current price even if not triggered
              await this.updateAlertPrice(id, currentPrice);
            }
          }
        } catch (error) {
          console.error(`Error checking price for ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Check if an alert should be triggered
   */
  private shouldTriggerAlert(alert: PriceAlertDoc, currentPrice: number): boolean {
    if (alert.condition === 'above') {
      return currentPrice >= alert.targetPrice;
    } else {
      return currentPrice <= alert.targetPrice;
    }
  }

  /**
   * Trigger an alert and send notification
   */
  private async triggerAlert(alertId: string, alertData: PriceAlertDoc, currentPrice: number): Promise<void> {
    try {
      // Update alert in database
      const alertRef = doc(db!, this.COLLECTION_NAME, alertId);
      await updateDoc(alertRef, {
        isTriggered: true,
        triggeredAt: serverTimestamp(),
        currentPrice,
        lastChecked: serverTimestamp()
      });

      // Create alert object for notification
      const triggeredAlert: PriceAlert = {
        id: alertId,
        userId: alertData.userId,
        coinId: alertData.coinId,
        symbol: alertData.symbol,
        name: alertData.name,
        targetPrice: alertData.targetPrice,
        currentPrice,
        condition: alertData.condition,
        isActive: alertData.isActive,
        isTriggered: true,
        createdAt: alertData.createdAt.toDate(),
        triggeredAt: new Date()
      };

      // Send notifications to all registered callbacks
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(triggeredAlert);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });

      console.log(`Alert triggered: ${alertData.name} ${alertData.condition} $${alertData.targetPrice}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Update alert's current price
   */
  private async updateAlertPrice(alertId: string, currentPrice: number): Promise<void> {
    try {
      const alertRef = doc(db!, this.COLLECTION_NAME, alertId);
      await updateDoc(alertRef, {
        currentPrice,
        lastChecked: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating alert price:', error);
    }
  }

  /**
   * Convert Firestore document to PriceAlert
   */
  private convertToAlert(docId: string, data: PriceAlertDoc): PriceAlert {
    return {
      id: docId,
      userId: data.userId,
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      targetPrice: data.targetPrice,
      currentPrice: data.currentPrice,
      condition: data.condition,
      isActive: data.isActive,
      isTriggered: data.isTriggered,
      createdAt: data.createdAt?.toDate() || new Date(),
      triggeredAt: data.triggeredAt?.toDate() || undefined,
      lastChecked: data.lastChecked?.toDate() || undefined
    };
  }
}

// Export singleton instance
export const priceAlertsService = new PriceAlertsService();

// Auto-start monitoring when service is imported (if there are alerts)
if (typeof window !== 'undefined') {
  // Only start in browser environment - no need to bind since method is called internally
}