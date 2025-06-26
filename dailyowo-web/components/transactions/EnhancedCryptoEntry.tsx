'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash, DollarSign, Calendar, TrendingUp, X, Check } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { cryptoService, type CryptoCoin } from '@/lib/services/crypto-service';
import { currencyService } from '@/lib/services/currency-service';
import { useAuth } from '@/lib/firebase/auth-context';

export interface CryptoTransactionData {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: Date;
  totalValue: number;
  notes?: string;
}

interface EnhancedCryptoEntryProps {
  onCryptoDataChange: (data: CryptoTransactionData | null) => void;
  initialData?: Partial<CryptoTransactionData>;
  transactionDate?: string; // YYYY-MM-DD format
}

export function EnhancedCryptoEntry({ 
  onCryptoDataChange, 
  initialData,
  transactionDate 
}: EnhancedCryptoEntryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CryptoCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    purchasePrice: '',
    purchaseDate: transactionDate || new Date().toISOString().split('T')[0],
    notes: '',
    totalValue: ''
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
          return currencyService.convertCurrency(1, 'USD', preferences.currency);
        })
        .then(rate => setExchangeRate(rate))
        .catch(error => console.error('Failed to load currency preferences:', error));
    }
  }, [user?.uid]);

  // Initialize with existing data
  useEffect(() => {
    if (initialData && initialData.symbol) {
      // Create a mock coin object for display
      setSelectedCoin({
        id: initialData.coinId || initialData.symbol.toLowerCase(),
        symbol: initialData.symbol,
        name: initialData.name || initialData.symbol.toUpperCase(),
        current_price: initialData.purchasePrice || 0,
        market_cap: 0,
        price_change_percentage_24h: 0,
        price_change_percentage_7d: 0,
        market_cap_rank: 0,
        total_volume: 0,
        image: ''
      });
      
      setFormData({
        amount: initialData.amount?.toString() || '',
        purchasePrice: (initialData.purchasePrice || 0).toString(),
        purchaseDate: initialData.purchaseDate?.toISOString().split('T')[0] || formData.purchaseDate,
        notes: initialData.notes || '',
        totalValue: (initialData.totalValue || 0).toString()
      });
    }
  }, [initialData]);

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

  // Update parent component when data changes
  useEffect(() => {
    if (selectedCoin && formData.amount && formData.purchasePrice) {
      const cryptoData: CryptoTransactionData = {
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        amount: parseFloat(formData.amount),
        purchasePrice: parseFloat(formData.purchasePrice) / exchangeRate, // Convert to USD
        purchaseDate: new Date(formData.purchaseDate),
        totalValue: parseFloat(formData.totalValue || '0'),
        notes: formData.notes.trim() || undefined
      };
      onCryptoDataChange(cryptoData);
    } else {
      onCryptoDataChange(null);
    }
  }, [selectedCoin, formData, exchangeRate, onCryptoDataChange]);

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
      const totalValue = parseFloat(formData.amount) * parseFloat(formData.purchasePrice);
      setFormData(prev => ({ ...prev, totalValue: totalValue.toFixed(2) }));
    } else if (mode === 'quantity' && formData.totalValue && formData.purchasePrice) {
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

  const handleClear = () => {
    setSelectedCoin(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      amount: '',
      purchasePrice: '',
      purchaseDate: transactionDate || new Date().toISOString().split('T')[0],
      notes: '',
      totalValue: ''
    });
    setInputMode('quantity');
    setErrors({});
    onCryptoDataChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
            Enhanced Crypto Entry
          </label>
          <p className="text-xs text-primary/60">
            Search and select cryptocurrency with detailed tracking
          </p>
        </div>
        {selectedCoin && (
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Clear crypto selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coin Selection */}
      {!selectedCoin && (
        <div>
          <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
            Select Cryptocurrency
          </label>
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
      )}

      {/* Selected Coin Display */}
      {selectedCoin && (
        <>
          <div>
            <label className="block text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
              Selected Cryptocurrency
            </label>
            <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 rounded-xl">
              {selectedCoin.image && (
                <img 
                  src={selectedCoin.image} 
                  alt={selectedCoin.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="font-light text-primary">{selectedCoin.name}</p>
                <p className="text-sm font-light text-primary/60">{selectedCoin.symbol.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-light text-primary">
                  {userCurrency === 'USD' ? '$' : userCurrency + ' '}
                  {(selectedCoin.current_price * exchangeRate).toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">Selected</span>
                </div>
              </div>
            </div>
          </div>

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
              rows={2}
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}