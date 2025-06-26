/**
 * 🔄 Crypto Transaction Sync Service
 * 
 * Synchronizes crypto holdings with the main transaction/asset system
 * ensuring crypto investments are tracked as part of the user's overall portfolio.
 */

import { 
  createSecureTransaction,
  updateSecureTransaction,
  deleteSecureTransaction,
  getSecureTransactions 
} from '@/lib/services/secure-transaction-service';
import { CreateTransactionData, Transaction } from '@/types/transaction';
import { ExtendedCryptoHolding, CreateCryptoHolding, UpdateCryptoHolding } from '@/lib/firebase/crypto-holdings-service';

class CryptoTransactionSyncService {
  private readonly TRANSACTION_TAG = 'crypto-holding';

  /**
   * Create a new transaction when a crypto holding is added
   */
  async createCryptoAssetTransaction(
    userId: string, 
    holding: CreateCryptoHolding, 
    holdingId: string
  ): Promise<string> {
    const totalValue = holding.amount * holding.purchasePrice;

    const transactionData: CreateTransactionData = {
      userId,
      type: 'asset',
      amount: totalValue,
      currency: 'USD', // Crypto holdings are stored in USD for consistency
      categoryId: 'cryptocurrency',
      categoryType: 'global',
      description: `${holding.name} (${holding.symbol.toUpperCase()}) - Initial Purchase`,
      date: holding.purchaseDate,
      isRecurring: false,
      tags: [this.TRANSACTION_TAG, `crypto-${holding.symbol.toLowerCase()}`, `holding-${holdingId}`],
      assetDetails: {
        symbol: holding.symbol.toUpperCase(),
        quantity: holding.amount,
        currentPrice: holding.purchasePrice,
        lastPriceUpdate: new Date(),
        exchange: 'External', // User-entered holding
      },
      merchant: `Crypto Purchase - ${holding.name}`,
      paymentMethod: 'other',
      attachments: {
        notes: holding.notes || `Initial purchase of ${holding.amount} ${holding.symbol.toUpperCase()}`
      },
      createdBy: userId
    };

    return await createSecureTransaction(userId, transactionData);
  }

  /**
   * Update the transaction when a crypto holding is modified
   */
  async updateCryptoAssetTransaction(
    userId: string,
    holdingId: string,
    updates: UpdateCryptoHolding,
    currentHolding: ExtendedCryptoHolding
  ): Promise<void> {
    // Find the existing transaction for this holding
    const transactions = await this.getCryptoHoldingTransactions(userId, holdingId);
    
    if (transactions.length === 0) {
      console.warn(`No transaction found for crypto holding ${holdingId}`);
      return;
    }

    const transaction = transactions[0]; // Should only be one transaction per holding
    
    // Calculate new values
    const newAmount = updates.amount ?? currentHolding.amount;
    const newPurchasePrice = updates.purchasePrice ?? currentHolding.purchase_price;
    const newTotalValue = newAmount * newPurchasePrice;
    const newPurchaseDate = updates.purchaseDate ?? currentHolding.purchase_date;

    const updateData = {
      amount: newTotalValue,
      description: `${currentHolding.name} (${currentHolding.symbol.toUpperCase()}) - Updated Purchase`,
      date: newPurchaseDate,
      assetDetails: {
        ...transaction.assetDetails,
        quantity: newAmount,
        currentPrice: newPurchasePrice,
        lastPriceUpdate: new Date(),
      },
      attachments: {
        ...transaction.attachments,
        notes: updates.notes || transaction.attachments?.notes || `Updated holding of ${newAmount} ${currentHolding.symbol.toUpperCase()}`
      }
    };

    await updateSecureTransaction(transaction.id, userId, updateData);
  }

  /**
   * Delete the transaction when a crypto holding is removed
   */
  async deleteCryptoAssetTransaction(userId: string, holdingId: string): Promise<void> {
    const transactions = await this.getCryptoHoldingTransactions(userId, holdingId);
    
    for (const transaction of transactions) {
      await deleteSecureTransaction(transaction.id, userId);
    }
  }

  /**
   * Update the current price and value of crypto asset transactions
   */
  async updateCryptoPrices(userId: string, holdings: ExtendedCryptoHolding[]): Promise<void> {
    for (const holding of holdings) {
      try {
        const transactions = await this.getCryptoHoldingTransactions(userId, holding.id);
        
        for (const transaction of transactions) {
          if (!transaction.assetDetails) continue;

          const newTotalValue = holding.amount * holding.current_price;
          
          const updateData = {
            amount: newTotalValue,
            assetDetails: {
              ...transaction.assetDetails,
              currentPrice: holding.current_price,
              lastPriceUpdate: new Date(),
            }
          };

          await updateSecureTransaction(transaction.id, userId, updateData);
        }
      } catch (error) {
        console.error(`Failed to update price for holding ${holding.id}:`, error);
      }
    }
  }

  /**
   * Get all transactions related to a specific crypto holding
   */
  private async getCryptoHoldingTransactions(userId: string, holdingId: string): Promise<Transaction[]> {
    try {
      const allTransactions = await getSecureTransactions(userId);
      
      return allTransactions.filter(transaction => 
        transaction.tags?.includes(`holding-${holdingId}`) &&
        transaction.tags?.includes(this.TRANSACTION_TAG) &&
        transaction.categoryId === 'cryptocurrency'
      );
    } catch (error) {
      console.error('Failed to get crypto holding transactions:', error);
      return [];
    }
  }

  /**
   * Get all crypto-related transactions for a user
   */
  async getAllCryptoTransactions(userId: string): Promise<Transaction[]> {
    try {
      const allTransactions = await getSecureTransactions(userId);
      
      return allTransactions.filter(transaction => 
        transaction.tags?.includes(this.TRANSACTION_TAG) &&
        transaction.categoryId === 'cryptocurrency'
      );
    } catch (error) {
      console.error('Failed to get crypto transactions:', error);
      return [];
    }
  }

  /**
   * Sync all existing crypto holdings to the transaction system
   * (Useful for migrating existing data)
   */
  async syncAllCryptoHoldings(userId: string, holdings: ExtendedCryptoHolding[]): Promise<void> {
    for (const holding of holdings) {
      try {
        // Check if transaction already exists
        const existingTransactions = await this.getCryptoHoldingTransactions(userId, holding.id);
        
        if (existingTransactions.length === 0) {
          // Create new transaction for this holding
          await this.createCryptoAssetTransaction(userId, {
            coinId: holding.coinId,
            symbol: holding.symbol,
            name: holding.name,
            amount: holding.amount,
            purchasePrice: holding.purchase_price,
            purchaseDate: holding.purchase_date,
            notes: undefined
          }, holding.id);
        }
      } catch (error) {
        console.error(`Failed to sync holding ${holding.id}:`, error);
      }
    }
  }
}

// Export singleton instance
export const cryptoTransactionSyncService = new CryptoTransactionSyncService();