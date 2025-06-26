'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Brain, BarChart3, Wallet, Target } from 'lucide-react';
import { CryptoPortfolioOverview } from '@/components/crypto/CryptoPortfolioOverview';
import { CryptoHoldingsList } from '@/components/crypto/CryptoHoldingsList';
import { AISignalsList } from '@/components/crypto/AISignalsList';
import { MarketOverview } from '@/components/crypto/MarketOverview';
import { AddCryptoModal } from '@/components/crypto/AddCryptoModal';
import { RebalanceModal } from '@/components/crypto/RebalanceModal';
import { PortfolioOptimizer } from '@/components/crypto/PortfolioOptimizer';
import { PriceAlertsTab } from '@/components/crypto/PriceAlertsTab';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/lib/firebase/auth-context';
import { 
  cryptoService, 
  type CryptoCoin, 
  type CryptoHolding, 
  type PortfolioSummary, 
  type AISignal,
  type MarketData 
} from '@/lib/services/crypto-service';
import { 
  cryptoHoldingsService,
  type CreateCryptoHolding,
  type UpdateCryptoHolding,
  type ExtendedCryptoHolding 
} from '@/lib/firebase/crypto-holdings-service';
import { 
  cryptoPortfolioOptimizer,
  type PortfolioOptimization 
} from '@/lib/services/crypto-portfolio-optimizer';
import { cryptoTransactionSyncService } from '@/lib/services/crypto-transaction-sync';

export function CryptoTab() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('portfolio');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<ExtendedCryptoHolding | null>(null);
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [rebalanceAllocations, setRebalanceAllocations] = useState<any[]>([]);
  const [preSelectedCoin, setPreSelectedCoin] = useState<CryptoCoin | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState<ExtendedCryptoHolding | null>(null);
  
  // State for real crypto data
  const [topCoins, setTopCoins] = useState<CryptoCoin[]>([]);
  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [marketData, setMarketData] = useState<MarketData | undefined>();
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | undefined>();
  const [holdings, setHoldings] = useState<ExtendedCryptoHolding[]>([]);
  const [portfolioOptimization, setPortfolioOptimization] = useState<PortfolioOptimization | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const subTabs = [
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'optimizer', label: 'Optimizer', icon: Target },
    { id: 'ai', label: 'AI Signals', icon: Brain },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'market', label: 'Market', icon: BarChart3 }
  ];

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    loadCryptoData();
    
    if (user?.uid) {
      // Subscribe to real-time holdings updates
      const unsubscribe = cryptoHoldingsService.subscribeToUserHoldings(
        user.uid,
        (userHoldings) => {
          updateHoldingsWithCurrentPrices(userHoldings);
        }
      );

      return unsubscribe;
    }
  }, [user?.uid]);

  // Update holdings with current prices when market data changes
  useEffect(() => {
    if (holdings.length > 0 && topCoins.length > 0) {
      updateHoldingsWithCurrentPrices(holdings);
    }
  }, [topCoins]);

  // Calculate portfolio summary and optimization when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      const summary = cryptoService.calculatePortfolioSummary(holdings);
      setPortfolioSummary(summary);
      loadPortfolioOptimization();
      
      // Sync holdings with transaction system (one-time sync for existing data)
      if (user?.uid) {
        cryptoTransactionSyncService.syncAllCryptoHoldings(user.uid, holdings)
          .catch(error => console.error('Failed to sync crypto holdings:', error));
      }
    } else {
      setPortfolioSummary(undefined);
      setPortfolioOptimization(undefined);
    }
  }, [holdings, topCoins, marketData, user?.uid]);

  const loadCryptoData = async () => {
    setIsLoading(true);
    try {
      const [coins, market, signals] = await Promise.all([
        cryptoService.getTopCoins(20),
        cryptoService.getMarketData(),
        cryptoService.generateAISignals(holdings)
      ]);
      
      setTopCoins(coins);
      setMarketData(market);
      setAiSignals(signals);
    } catch (error) {
      console.error('Failed to load crypto data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolioOptimization = async () => {
    if (holdings.length === 0 || !marketData || topCoins.length === 0) {
      setPortfolioOptimization(undefined);
      return;
    }

    try {
      const optimization = await cryptoPortfolioOptimizer.optimizePortfolio(
        holdings,
        marketData,
        topCoins,
        'moderate' // Default risk tolerance
      );
      setPortfolioOptimization(optimization);
    } catch (error) {
      console.error('Failed to load portfolio optimization:', error);
      setPortfolioOptimization(undefined);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    cryptoService.clearCache(); // Clear cache for fresh data
    await loadCryptoData();
    if (holdings.length > 0) {
      await loadPortfolioOptimization();
    }
    setIsRefreshing(false);
  };

  const handleToggleBalance = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  // Helper function to update holdings with current prices
  const updateHoldingsWithCurrentPrices = async (userHoldings: ExtendedCryptoHolding[]) => {
    try {
      // Create price map from current market data
      const priceMap = new Map<string, number>();
      topCoins.forEach(coin => {
        priceMap.set(coin.symbol.toLowerCase(), coin.current_price);
      });

      // Update holdings with current prices
      const updatedHoldings = await cryptoHoldingsService.updateHoldingsWithCurrentPrices(
        userHoldings,
        priceMap
      );

      setHoldings(updatedHoldings);
    } catch (error) {
      console.error('Failed to update holdings with current prices:', error);
      setHoldings(userHoldings); // Fallback to original holdings
    }
  };

  const handleAddHolding = () => {
    setShowAddModal(true);
  };

  const handleAddHoldingSubmit = async (holding: CreateCryptoHolding) => {
    if (!user?.uid) {
      console.error('User not authenticated');
      return;
    }

    try {
      if (editingHolding) {
        // Update existing holding
        await cryptoHoldingsService.updateHolding(user.uid, editingHolding.id, {
          amount: holding.amount,
          purchasePrice: holding.purchasePrice,
          purchaseDate: holding.purchaseDate,
          notes: holding.notes
        });
      } else {
        // Add new holding
        await cryptoHoldingsService.addHolding(user.uid, holding);
      }
      // Holdings will be updated via the subscription
    } catch (error) {
      console.error('Failed to save holding:', error);
      throw error; // Re-throw for modal to handle
    }
  };

  const handleEditHolding = (holding: ExtendedCryptoHolding) => {
    setEditingHolding(holding);
    setShowAddModal(true);
  };

  const handleDeleteHolding = (holding: ExtendedCryptoHolding) => {
    setHoldingToDelete(holding);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteHolding = async () => {
    if (!holdingToDelete || !user?.uid) {
      console.error('No holding to delete or user not authenticated');
      return;
    }

    try {
      await cryptoHoldingsService.deleteHolding(user.uid, holdingToDelete.id);
      // Holdings will be updated via the subscription
    } catch (error) {
      console.error('Failed to delete holding:', error);
      alert('Failed to delete holding. Please try again.');
    }
  };

  const handleCoinSelect = (coin: CryptoCoin) => {
    // Auto-fill add modal with selected coin
    setPreSelectedCoin(coin);
    setShowAddModal(true);
  };

  const handleRebalance = (allocations: any[]) => {
    setRebalanceAllocations(allocations);
    setShowRebalanceModal(true);
  };

  const handleRebalanceConfirm = async (allocations: any[]) => {
    try {
      // In a real implementation, this would:
      // 1. Calculate exact buy/sell amounts for each coin
      // 2. Show trading confirmations
      // 3. Execute trades through connected exchanges
      // 4. Update portfolio holdings
      
      console.log('Executing rebalancing:', allocations);
      
      // For now, we'll just show a success message
      // In practice, you'd integrate with trading APIs or show manual trading instructions
      alert('Rebalancing plan confirmed! In a real implementation, this would execute the trades or provide detailed trading instructions.');
      
      // Refresh data to reflect any changes
      await loadCryptoData();
      if (holdings.length > 0) {
        await loadPortfolioOptimization();
      }
    } catch (error) {
      console.error('Rebalancing failed:', error);
      throw error;
    }
  };


  return (
    <div className="space-y-6">
      {/* Crypto Sub-Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-light transition-all whitespace-nowrap flex-shrink-0 min-h-[44px]
                ${activeSubTab === tab.id 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                  : 'bg-white/50 text-primary/60 hover:bg-white/80 border border-gray-200/50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Portfolio Overview */}
            {portfolioSummary ? (
              <CryptoPortfolioOverview
                portfolio={portfolioSummary}
                isBalanceHidden={isBalanceHidden}
                isRefreshing={isRefreshing}
                onToggleBalance={handleToggleBalance}
                onRefresh={handleRefresh}
              />
            ) : holdings.length === 0 ? (
              // Show empty state when no holdings
              null
            ) : (
              // Show loading state when holdings exist but summary not calculated
              <div className="animate-pulse">
                <div className="h-32 bg-white/20 rounded-xl"></div>
              </div>
            )}

            {/* Holdings List */}
            <CryptoHoldingsList
              holdings={holdings}
              isBalanceHidden={isBalanceHidden}
              onAddHolding={handleAddHolding}
              onEditHolding={handleEditHolding}
              onDeleteHolding={handleDeleteHolding}
            />
          </motion.div>
        )}

        {activeSubTab === 'optimizer' && (
          <motion.div
            key="optimizer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PortfolioOptimizer
              optimization={portfolioOptimization}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onRebalance={handleRebalance}
            />
          </motion.div>
        )}

        {activeSubTab === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AISignalsList
              signals={aiSignals}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </motion.div>
        )}

        {activeSubTab === 'market' && (
          <motion.div
            key="market"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <MarketOverview
              marketData={marketData}
              topCoins={topCoins}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onCoinSelect={handleCoinSelect}
            />
          </motion.div>
        )}

        {activeSubTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PriceAlertsTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Crypto Modal */}
      <AddCryptoModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingHolding(null);
          setPreSelectedCoin(null);
        }}
        onAdd={handleAddHoldingSubmit}
        editHolding={editingHolding ? {
          id: editingHolding.id,
          coinId: editingHolding.coinId,
          symbol: editingHolding.symbol,
          name: editingHolding.name,
          amount: editingHolding.amount,
          purchasePrice: editingHolding.purchase_price,
          purchaseDate: editingHolding.purchase_date,
          notes: undefined // Notes not available in CryptoHolding type
        } : undefined}
        preSelectedCoin={preSelectedCoin || undefined}
      />

      {/* Rebalance Modal */}
      <RebalanceModal
        isOpen={showRebalanceModal}
        onClose={() => setShowRebalanceModal(false)}
        allocations={rebalanceAllocations}
        totalPortfolioValue={portfolioSummary?.total_value || 0}
        onConfirm={handleRebalanceConfirm}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setHoldingToDelete(null);
        }}
        onConfirm={confirmDeleteHolding}
        title="Delete Crypto Holding"
        message={`Are you sure you want to delete your ${holdingToDelete?.name} holding? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}