'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Search, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { cryptoService, type CryptoCoin } from '@/lib/services/crypto-service';
import { priceAlertsService, type PriceAlert } from '@/lib/services/price-alerts-service';
import { useAuth } from '@/lib/firebase/auth-context';


interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (alert: Omit<PriceAlert, 'id' | 'userId' | 'createdAt' | 'triggeredAt'>) => void;
}

function CreateAlertModal({ isOpen, onClose, onAdd }: CreateAlertModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [isSearching, setIsSearching] = useState(false);

  // Search coins with debouncing
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await cryptoService.searchCoins(searchQuery);
        setSearchResults(results.slice(0, 8));
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleSubmit = () => {
    if (!selectedCoin || !targetPrice) return;

    const alert: Omit<PriceAlert, 'id' | 'userId' | 'createdAt' | 'triggeredAt'> = {
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      targetPrice: parseFloat(targetPrice),
      currentPrice: selectedCoin.current_price,
      condition,
      isActive: true,
      isTriggered: false
    };

    onAdd(alert);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCoin(null);
    setSearchQuery('');
    setTargetPrice('');
    setCondition('above');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassContainer className="p-6" goldBorder>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-primary">Create Price Alert</h2>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>

            {/* Coin Selection */}
            {!selectedCoin && (
              <div className="mb-4">
                <label className="block text-xs font-light text-primary/60 mb-2">Select Cryptocurrency</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cryptocurrencies..."
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold transition-all"
                  />
                </div>
                
                {(isSearching || searchResults.length > 0) && (
                  <div className="mt-2 max-h-48 overflow-y-auto">
                    <GlassContainer className="p-0">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="w-5 h-5 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {searchResults.map((coin) => (
                            <button
                              key={coin.id}
                              onClick={() => setSelectedCoin(coin)}
                              className="w-full p-3 text-left hover:bg-white/50 transition-colors flex items-center gap-3"
                            >
                              <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                              <div className="flex-1">
                                <p className="font-light text-primary text-sm">{coin.name}</p>
                                <p className="text-xs text-primary/60">{coin.symbol.toUpperCase()}</p>
                              </div>
                              <p className="text-sm font-light text-primary">${coin.current_price.toLocaleString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </GlassContainer>
                  </div>
                )}
              </div>
            )}

            {/* Selected Coin */}
            {selectedCoin && (
              <div className="mb-4">
                <label className="block text-xs font-light text-primary/60 mb-2">Selected Cryptocurrency</label>
                <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 rounded-xl">
                  <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <p className="font-light text-primary">{selectedCoin.name}</p>
                    <p className="text-sm text-primary/60">{selectedCoin.symbol.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-light text-primary">${selectedCoin.current_price.toLocaleString()}</p>
                    <button
                      onClick={() => setSelectedCoin(null)}
                      className="text-xs text-primary/60 hover:text-primary"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Configuration */}
            {selectedCoin && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-light text-primary/60 mb-2">Alert Condition</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCondition('above')}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        condition === 'above' 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-white/50 border-gray-200 text-primary/60 hover:bg-white/80'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Above
                    </button>
                    <button
                      onClick={() => setCondition('below')}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        condition === 'below' 
                          ? 'bg-red-50 border-red-200 text-red-700' 
                          : 'bg-white/50 border-gray-200 text-primary/60 hover:bg-white/80'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Below
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-light text-primary/60 mb-2">Target Price (USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <GlassButton variant="ghost" onClick={handleClose} className="flex-1">
                    Cancel
                  </GlassButton>
                  <GlassButton 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={!targetPrice}
                    goldBorder
                    className="flex-1"
                  >
                    Create Alert
                  </GlassButton>
                </div>
              </>
            )}
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function PriceAlertsTab() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load user's alerts from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = priceAlertsService.subscribeToUserAlerts(user.uid, (userAlerts) => {
      setAlerts(userAlerts);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Set up notification listener
  useEffect(() => {
    const unsubscribe = priceAlertsService.onAlertTriggered((triggeredAlert) => {
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`Price Alert: ${triggeredAlert.name}`, {
          body: `${triggeredAlert.name} has ${triggeredAlert.condition === 'above' ? 'exceeded' : 'dropped below'} $${triggeredAlert.targetPrice.toLocaleString()}`,
          icon: '/favicon.ico',
          tag: `price-alert-${triggeredAlert.id}`
        });
      }
      
      // You could also show an in-app toast notification here
      console.log('Price alert triggered:', triggeredAlert);
    });

    return unsubscribe;
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAddAlert = async (alertData: Omit<PriceAlert, 'id' | 'userId' | 'createdAt' | 'triggeredAt'>) => {
    if (!user?.uid) {
      console.error('User not authenticated');
      return;
    }

    try {
      await priceAlertsService.createAlert(user.uid, {
        coinId: alertData.coinId,
        symbol: alertData.symbol,
        name: alertData.name,
        targetPrice: alertData.targetPrice,
        currentPrice: alertData.currentPrice,
        condition: alertData.condition
      });
      // Alert will be added via the subscription
    } catch (error) {
      console.error('Failed to create alert:', error);
      // Handle error (show toast notification)
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await priceAlertsService.deleteAlert(id);
      // Alert will be removed via the subscription
    } catch (error) {
      console.error('Failed to delete alert:', error);
      // Handle error (show toast notification)
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAlertStatus = (alert: PriceAlert) => {
    return alert.isTriggered ? 'triggered' : (alert.isActive ? 'active' : 'inactive');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-primary mb-1">Price Alerts</h2>
          <p className="text-sm font-light text-primary/60">
            Get notified when cryptocurrencies reach your target prices
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          goldBorder
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </GlassButton>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <GlassContainer className="p-8 text-center">
          <Bell className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <h3 className="text-lg font-light text-primary mb-2">No Price Alerts</h3>
          <p className="text-sm font-light text-primary/60 mb-6">
            Create your first price alert to get notified when cryptocurrencies reach your target prices
          </p>
          <GlassButton
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            goldBorder
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </GlassButton>
        </GlassContainer>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const status = getAlertStatus(alert);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/50 border border-gray-200/50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-light text-primary">{alert.name}</h3>
                      <p className="text-sm font-light text-primary/60">{alert.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-light ${
                      status === 'triggered' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {status === 'triggered' ? 'Triggered' : 'Active'}
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-light text-primary/40 mb-1">Current Price</p>
                    <p className="font-light text-primary">{formatCurrency(alert.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-light text-primary/40 mb-1">Target Price</p>
                    <p className="font-light text-primary">{formatCurrency(alert.targetPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-light text-primary/40 mb-1">Condition</p>
                    <div className="flex items-center gap-1">
                      {alert.condition === 'above' ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className="font-light text-primary capitalize">{alert.condition}</span>
                    </div>
                  </div>
                </div>

                {status === 'triggered' && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700">
                      🎉 Alert triggered! {alert.name} has {alert.condition === 'above' ? 'exceeded' : 'dropped below'} your target price.
                      {alert.triggeredAt && (
                        <span className="block mt-1 text-green-600">
                          Triggered at {alert.triggeredAt.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700">
          <strong>Real-time Monitoring:</strong> Alerts are checked every minute against live market prices. 
          You'll receive browser notifications when your target prices are reached. Make sure to allow notifications for the best experience.
        </p>
      </div>

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdd={handleAddAlert}
      />
    </div>
  );
}