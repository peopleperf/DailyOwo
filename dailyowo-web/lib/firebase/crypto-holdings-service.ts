/**
 * 🪙 Crypto Holdings Service - Firebase integration for user crypto portfolios
 * 
 * Manages user cryptocurrency holdings with real-time synchronization
 * and portfolio tracking capabilities.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { CryptoHolding } from '@/lib/services/crypto-service';
import { cryptoTransactionSyncService } from '@/lib/services/crypto-transaction-sync';

// Extended interface that includes Firebase-specific fields
export interface ExtendedCryptoHolding extends CryptoHolding {
  coinId: string;
}

// Firebase document structure
interface CryptoHoldingDoc {
  id?: string;
  userId: string;
  coinId: string; // CoinGecko ID (e.g., 'bitcoin', 'ethereum')
  symbol: string; // BTC, ETH, etc.
  name: string; // Bitcoin, Ethereum, etc.
  amount: number;
  purchasePrice: number;
  purchaseDate: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User-facing interface
export interface CreateCryptoHolding {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: Date;
  notes?: string;
}

export interface UpdateCryptoHolding {
  amount?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

class CryptoHoldingsService {
  private readonly COLLECTION_NAME = 'cryptoHoldings';

  /**
   * Add a new crypto holding for a user
   */
  async addHolding(userId: string, holding: CreateCryptoHolding): Promise<string> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const now = serverTimestamp();
      
      const docData: Omit<CryptoHoldingDoc, 'id'> = {
        userId,
        coinId: holding.coinId,
        symbol: holding.symbol.toUpperCase(),
        name: holding.name,
        amount: holding.amount,
        purchasePrice: holding.purchasePrice,
        purchaseDate: Timestamp.fromDate(holding.purchaseDate),
        notes: holding.notes || '',
        createdAt: now as Timestamp,
        updatedAt: now as Timestamp
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), docData);
      
      // Sync with transaction system
      try {
        await cryptoTransactionSyncService.createCryptoAssetTransaction(userId, holding, docRef.id);
      } catch (error) {
        console.error('Failed to sync crypto holding to transactions:', error);
        // Don't fail the holding creation if sync fails
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding crypto holding:', error);
      throw new Error('Failed to add crypto holding');
    }
  }

  /**
   * Update an existing crypto holding
   */
  async updateHolding(
    userId: string, 
    holdingId: string, 
    updates: UpdateCryptoHolding
  ): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const holdingRef = doc(db, this.COLLECTION_NAME, holdingId);
      
      const updateData: Partial<CryptoHoldingDoc> = {
        updatedAt: serverTimestamp() as Timestamp
      };

      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.purchasePrice !== undefined) updateData.purchasePrice = updates.purchasePrice;
      if (updates.purchaseDate !== undefined) {
        updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      await updateDoc(holdingRef, updateData);
      
      // Sync with transaction system
      try {
        // Get current holding to pass to sync service
        const holdingDoc = await getDoc(holdingRef);
        if (holdingDoc.exists()) {
          const currentData = holdingDoc.data() as CryptoHoldingDoc;
          const currentHolding = this.convertToHolding(holdingId, currentData);
          await cryptoTransactionSyncService.updateCryptoAssetTransaction(userId, holdingId, updates, currentHolding);
        }
      } catch (error) {
        console.error('Failed to sync crypto holding update to transactions:', error);
        // Don't fail the holding update if sync fails
      }
    } catch (error) {
      console.error('Error updating crypto holding:', error);
      throw new Error('Failed to update crypto holding');
    }
  }

  /**
   * Delete a crypto holding
   */
  async deleteHolding(userId: string, holdingId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const holdingRef = doc(db, this.COLLECTION_NAME, holdingId);
      await deleteDoc(holdingRef);
      
      // Sync with transaction system - get userId from context or pass it as parameter
      try {
        await cryptoTransactionSyncService.deleteCryptoAssetTransaction(userId, holdingId);
      } catch (error) {
        console.error('Failed to sync crypto holding deletion to transactions:', error);
        // Don't fail the holding deletion if sync fails
      }
    } catch (error) {
      console.error('Error deleting crypto holding:', error);
      throw new Error('Failed to delete crypto holding');
    }
  }

  /**
   * Get all holdings for a user
   */
  async getUserHoldings(userId: string): Promise<ExtendedCryptoHolding[]> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const holdings: ExtendedCryptoHolding[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as CryptoHoldingDoc;
        holdings.push(this.convertToHolding(doc.id, data));
      });

      return holdings;
    } catch (error) {
      console.error('Error fetching user holdings:', error);
      throw new Error('Failed to fetch crypto holdings');
    }
  }

  /**
   * Subscribe to real-time updates of user holdings
   */
  subscribeToUserHoldings(
    userId: string, 
    callback: (holdings: ExtendedCryptoHolding[]) => void
  ): () => void {
    if (!db) {
      console.error('Firestore not initialized');
      return () => {}; // Return empty unsubscribe function
    }

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const holdings: ExtendedCryptoHolding[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CryptoHoldingDoc;
        holdings.push(this.convertToHolding(doc.id, data));
      });

      callback(holdings);
    }, (error) => {
      console.error('Error in holdings subscription:', error);
    });
  }

  /**
   * Get holdings for a specific coin
   */
  async getHoldingsForCoin(userId: string, coinId: string): Promise<ExtendedCryptoHolding[]> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('coinId', '==', coinId),
        orderBy('purchaseDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const holdings: ExtendedCryptoHolding[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as CryptoHoldingDoc;
        holdings.push(this.convertToHolding(doc.id, data));
      });

      return holdings;
    } catch (error) {
      console.error('Error fetching coin holdings:', error);
      throw new Error('Failed to fetch coin holdings');
    }
  }

  /**
   * Calculate portfolio summary from Firebase holdings
   */
  async calculateUserPortfolioSummary(userId: string, currentPrices: Map<string, number>) {
    const holdings = await this.getUserHoldings(userId);
    
    let totalValue = 0;
    let totalCost = 0;
    
    const enrichedHoldings = holdings.map(holding => {
      const currentPrice = currentPrices.get(holding.symbol.toLowerCase()) || 0;
      const currentValue = holding.amount * currentPrice;
      const costBasis = holding.amount * holding.purchase_price;
      const pnl = currentValue - costBasis;
      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      
      totalValue += currentValue;
      totalCost += costBasis;
      
      return {
        ...holding,
        current_price: currentPrice,
        current_value: currentValue,
        pnl,
        pnl_percentage: pnlPercentage
      };
    });

    const totalPnl = totalValue - totalCost;
    const totalPnlPercentage = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      holdings: enrichedHoldings,
      summary: {
        total_value: totalValue,
        total_pnl: totalPnl,
        total_pnl_percentage: totalPnlPercentage,
        day_change: 0, // Would need historical data to calculate
        day_change_percentage: 0,
        holdings_count: holdings.length
      }
    };
  }

  /**
   * Convert Firestore document to CryptoHolding
   */
  private convertToHolding(docId: string, data: CryptoHoldingDoc): ExtendedCryptoHolding {
    return {
      id: docId,
      coinId: data.coinId, // Include coinId for editing
      symbol: data.symbol,
      name: data.name,
      amount: data.amount,
      purchase_price: data.purchasePrice,
      purchase_date: data.purchaseDate.toDate(),
      current_price: 0, // Will be updated with live prices
      current_value: 0, // Will be calculated with live prices
      pnl: 0, // Will be calculated with live prices
      pnl_percentage: 0 // Will be calculated with live prices
    };
  }

  /**
   * Bulk update holdings with current prices
   */
  async updateHoldingsWithCurrentPrices(
    holdings: ExtendedCryptoHolding[], 
    currentPrices: Map<string, number>
  ): Promise<ExtendedCryptoHolding[]> {
    return holdings.map(holding => {
      const currentPrice = currentPrices.get(holding.symbol.toLowerCase()) || 0;
      const currentValue = holding.amount * currentPrice;
      const costBasis = holding.amount * holding.purchase_price;
      const pnl = currentValue - costBasis;
      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        ...holding,
        current_price: currentPrice,
        current_value: currentValue,
        pnl,
        pnl_percentage: pnlPercentage
      };
    });
  }
}

// Export singleton instance
export const cryptoHoldingsService = new CryptoHoldingsService();

// Types are already exported above