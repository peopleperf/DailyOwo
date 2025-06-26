'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Calendar, DollarSign, Hash } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { cryptoService, type CryptoCoin } from '@/lib/services/crypto-service';
import { type CreateCryptoHolding } from '@/lib/firebase/crypto-holdings-service';
import { currencyService } from '@/lib/services/currency-service';
import { useAuth } from '@/lib/firebase/auth-context';

interface AddCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holding: CreateCryptoHolding) => Promise<void>;
  editHolding?: CreateCryptoHolding & { id: string };
  preSelectedCoin?: CryptoCoin;
}

export function AddCryptoModal({ isOpen, onClose, onAdd, editHolding, preSelectedCoin }: AddCryptoModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    notes: '',
    totalValue: '' // For currency value input mode
  });
  
  // Input mode: 'quantity' or 'value'
  const [inputMode, setInputMode] = useState<'quantity' | 'value'>('quantity');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user's currency preferences
  useEffect(() => {
    if (user?.uid) {
      currencyService.getUserCurrencyPreferences(user.uid)
        .then(preferences => {
          setUserCurrency(preferences.currency);
          // Get exchange rate from USD to user currency
          return currencyService.convertCurrency(1, 'USD', preferences.currency);
        })
        .then(rate => setExchangeRate(rate))
        .catch(error => console.error('Failed to load currency preferences:', error));
    }
  }, [user?.uid]);

  // Initialize form with edit data or pre-selected coin
  useEffect(() => {
    if (editHolding) {
      setSelectedCoin({
        id: editHolding.coinId,
        symbol: editHolding.symbol,
        name: editHolding.name,
        current_price: editHolding.purchasePrice,
        market_cap: 0,
        price_change_percentage_24h: 0,
        price_change_percentage_7d: 0,
        market_cap_rank: 0,
        total_volume: 0,
        image: ''
      });
      const totalValue = editHolding.amount * editHolding.purchasePrice * exchangeRate;
      setFormData({
        amount: editHolding.amount.toString(),
        purchasePrice: (editHolding.purchasePrice * exchangeRate).toString(),
        purchaseDate: editHolding.purchaseDate.toISOString().split('T')[0],
        notes: editHolding.notes || '',
        totalValue: totalValue.toFixed(2)
      });
    } else if (preSelectedCoin && !selectedCoin) {
      // Pre-select coin when opening for new holding
      setSelectedCoin(preSelectedCoin);
      const convertedPrice = preSelectedCoin.current_price * exchangeRate;
      setFormData(prev => ({
        ...prev,
        purchasePrice: convertedPrice.toFixed(2)
      }));
    }
  }, [editHolding, preSelectedCoin, selectedCoin, exchangeRate]);

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
        setSearchResults(results.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleCoinSelect = (coin: CryptoCoin) => {
    setSelectedCoin(coin);
    setSearchQuery('');
    setSearchResults([]);
    
    // Auto-fill current price as purchase price (converted to user currency)
    const convertedPrice = coin.current_price * exchangeRate;
    setFormData(prev => ({
      ...prev,
      purchasePrice: convertedPrice.toFixed(2)
    }));
  };

  // Handle input mode change and recalculate values
  const handleInputModeChange = (mode: 'quantity' | 'value') => {
    setInputMode(mode);
    
    if (mode === 'value' && formData.amount && formData.purchasePrice) {
      // Calculate total value when switching to value mode
      const totalValue = parseFloat(formData.amount) * parseFloat(formData.purchasePrice);
      setFormData(prev => ({ ...prev, totalValue: totalValue.toFixed(2) }));
    } else if (mode === 'quantity' && formData.totalValue && formData.purchasePrice) {
      // Calculate quantity when switching to quantity mode
      const amount = parseFloat(formData.totalValue) / parseFloat(formData.purchasePrice);
      setFormData(prev => ({ ...prev, amount: amount.toString() }));
    }
  };

  // Handle total value change (recalculate quantity)
  const handleTotalValueChange = (value: string) => {
    setFormData(prev => ({ ...prev, totalValue: value }));
    
    if (value && formData.purchasePrice) {
      const purchasePrice = parseFloat(formData.purchasePrice);
      if (purchasePrice > 0) {
        const calculatedAmount = parseFloat(value) / purchasePrice;
        setFormData(prev => ({ ...prev, amount: calculatedAmount.toString() }));
      }
    }
  };

  // Handle amount change (recalculate total value)
  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
    
    if (value && formData.purchasePrice) {
      const purchasePrice = parseFloat(formData.purchasePrice);
      const amount = parseFloat(value);
      if (purchasePrice > 0 && amount > 0) {
        const calculatedTotal = amount * purchasePrice;
        setFormData(prev => ({ ...prev, totalValue: calculatedTotal.toFixed(2) }));
      }
    }
  };

  // Handle price change (recalculate based on current mode)
  const handlePriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, purchasePrice: value }));
    
    const price = parseFloat(value);
    if (price > 0) {
      if (inputMode === 'quantity' && formData.amount) {
        const amount = parseFloat(formData.amount);
        const calculatedTotal = amount * price;
        setFormData(prev => ({ ...prev, totalValue: calculatedTotal.toFixed(2) }));
      } else if (inputMode === 'value' && formData.totalValue) {
        const totalValue = parseFloat(formData.totalValue);
        const calculatedAmount = totalValue / price;
        setFormData(prev => ({ ...prev, amount: calculatedAmount.toString() }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCoin) {
      newErrors.coin = 'Please select a cryptocurrency';
    }

    if (inputMode === 'quantity') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    } else {
      if (!formData.totalValue || parseFloat(formData.totalValue) <= 0) {
        newErrors.totalValue = 'Please enter a valid total value';
      }
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Please enter a valid purchase price';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Please select a purchase date';
    }

    const purchaseDate = new Date(formData.purchaseDate);
    const today = new Date();
    if (purchaseDate > today) {
      newErrors.purchaseDate = 'Purchase date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedCoin) return;

    setIsSubmitting(true);
    try {
      // Convert price back to USD for storage (prices are stored in USD)
      const priceInUSD = parseFloat(formData.purchasePrice) / exchangeRate;
      
      // Calculate final amount based on input mode
      let finalAmount: number;
      if (inputMode === 'quantity') {
        finalAmount = parseFloat(formData.amount);
      } else {
        // Calculate amount from total value
        finalAmount = parseFloat(formData.totalValue) / parseFloat(formData.purchasePrice);
      }
      
      const holding: CreateCryptoHolding = {
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        amount: finalAmount,
        purchasePrice: priceInUSD,
        purchaseDate: new Date(formData.purchaseDate),
        notes: formData.notes.trim() || undefined
      };

      await onAdd(holding);
      handleClose();
    } catch (error) {
      console.error('Failed to add holding:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCoin(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      amount: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      totalValue: ''
    });
    setInputMode('quantity');
    setErrors({});
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
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <GlassContainer className="p-6 md:p-8" goldBorder>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-primary mb-1">
                  {editHolding ? 'Edit' : 'Add'} Crypto Holding
                </h2>
                <p className="text-sm font-light text-primary/60">
                  {editHolding ? 'Update your' : 'Add a new'} cryptocurrency to your portfolio
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>

            {/* Coin Selection */}
            {!editHolding && !selectedCoin && (
              <div className="mb-6">
                <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                  Select Cryptocurrency
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cryptocurrencies..."
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {(isSearching || searchResults.length > 0) && (
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      <GlassContainer className="p-0">
                        {isSearching ? (
                          <div className="p-4 text-center">
                            <div className="w-5 h-5 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto"></div>
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-sm font-light text-primary/60">No cryptocurrencies found</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {searchResults.map((coin) => (
                              <button
                                key={coin.id}
                                onClick={() => handleCoinSelect(coin)}
                                className="w-full p-3 text-left hover:bg-white/50 transition-colors flex items-center gap-3"
                              >
                                {coin.image && (
                                  <img 
                                    src={coin.image} 
                                    alt={coin.name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-light text-primary text-sm">{coin.name}</p>
                                  <p className="text-xs text-primary/60">{coin.symbol.toUpperCase()}</p>
                                </div>
                                <p className="text-sm font-light text-primary">
                                  {userCurrency === 'USD' ? '$' : userCurrency + ' '}
                                  {(coin.current_price * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </GlassContainer>
                    </div>
                  )}
                </div>
                {errors.coin && (
                  <p className="text-red-600 text-xs font-light mt-1">{errors.coin}</p>
                )}
              </div>
            )}

            {/* Selected Coin Display */}
            {selectedCoin && (
              <div className="mb-6">
                <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                  Selected Cryptocurrency
                </label>
                <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 rounded-xl">
                  {selectedCoin.image && (
                    <img 
                      src={selectedCoin.image} 
                      alt={selectedCoin.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-light text-primary">{selectedCoin.name}</p>
                    <p className="text-sm font-light text-primary/60">{selectedCoin.symbol.toUpperCase()}</p>
                  </div>
                  {!editHolding && (
                    <button
                      onClick={() => setSelectedCoin(null)}
                      className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <X className="w-4 h-4 text-primary/60" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields */}
            {selectedCoin && (
              <div className="space-y-4">
                {/* Input Mode Toggle */}
                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                    Input Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputModeChange('quantity')}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        inputMode === 'quantity' 
                          ? 'bg-gold/10 border-gold/30 text-primary' 
                          : 'bg-white/50 border-gray-200 text-primary/60 hover:bg-white/80'
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                      Quantity
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputModeChange('value')}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        inputMode === 'value' 
                          ? 'bg-gold/10 border-gold/30 text-primary' 
                          : 'bg-white/50 border-gray-200 text-primary/60 hover:bg-white/80'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Total Value
                    </button>
                  </div>
                  <p className="text-xs text-primary/60 mt-1">
                    {inputMode === 'quantity' 
                      ? 'Enter the number of coins you purchased' 
                      : 'Enter the total amount you spent in your currency'
                    }
                  </p>
                </div>

                {/* Amount or Total Value */}
                {inputMode === 'quantity' ? (
                  <div>
                    <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                      Quantity ({selectedCoin.symbol.toUpperCase()})
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <input
                        type="number"
                        step="any"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-600 text-xs font-light mt-1">{errors.amount}</p>
                    )}
                    {formData.totalValue && (
                      <p className="text-xs text-primary/60 mt-1">
                        Total value: {userCurrency === 'USD' ? '$' : userCurrency + ' '}{parseFloat(formData.totalValue).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                      Total Value ({userCurrency})
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <input
                        type="number"
                        step="any"
                        value={formData.totalValue}
                        onChange={(e) => handleTotalValueChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                      />
                    </div>
                    {errors.totalValue && (
                      <p className="text-red-600 text-xs font-light mt-1">{errors.totalValue}</p>
                    )}
                    {formData.amount && (
                      <p className="text-xs text-primary/60 mt-1">
                        Quantity: {parseFloat(formData.amount).toLocaleString()} {selectedCoin.symbol.toUpperCase()}
                      </p>
                    )}
                  </div>
                )}

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                    Purchase Price ({userCurrency})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <input
                      type="number"
                      step="any"
                      value={formData.purchasePrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    />
                  </div>
                  {errors.purchasePrice && (
                    <p className="text-red-600 text-xs font-light mt-1">{errors.purchasePrice}</p>
                  )}
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                    Purchase Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                    />
                  </div>
                  {errors.purchaseDate && (
                    <p className="text-red-600 text-xs font-light mt-1">{errors.purchaseDate}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this purchase..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light resize-none"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedCoin && (
              <div className="flex gap-3 mt-8">
                <GlassButton
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1 min-h-[44px]"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  goldBorder
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {editHolding ? 'Update' : 'Add'} Holding
                </GlassButton>
              </div>
            )}
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}