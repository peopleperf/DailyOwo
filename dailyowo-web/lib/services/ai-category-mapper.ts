import { TransactionCategory } from '@/lib/constants/transaction-categories';

/**
 * Maps AI-detected merchant categories to transaction category IDs
 */
export class AICategoryMapper {
  private static categoryMappings: Record<string, string> = {
    // Dining & Food
    'restaurant': 'dining-out',
    'fast food': 'dining-out',
    'cafe': 'dining-out',
    'coffee shop': 'dining-out',
    'bakery': 'dining-out',
    'bar': 'dining-out',
    'pub': 'dining-out',
    'food delivery': 'dining-out',
    
    // Groceries
    'grocery': 'groceries',
    'supermarket': 'groceries',
    'grocery store': 'groceries',
    'market': 'groceries',
    'convenience store': 'groceries',
    'butcher': 'groceries',
    'farmers market': 'groceries',
    
    // Transportation
    'gas station': 'fuel',
    'petrol station': 'fuel',
    'fuel': 'fuel',
    'parking': 'parking',
    'public transport': 'public-transport',
    'taxi': 'taxi-rideshare',
    'rideshare': 'taxi-rideshare',
    'uber': 'taxi-rideshare',
    'lyft': 'taxi-rideshare',
    'car rental': 'car-rental',
    'auto repair': 'maintenance-repairs',
    'car wash': 'maintenance-repairs',
    
    // Shopping
    'clothing': 'clothing',
    'apparel': 'clothing',
    'fashion': 'clothing',
    'electronics': 'other-shopping',
    'department store': 'other-shopping',
    'retail': 'other-shopping',
    'online shopping': 'online-shopping',
    'e-commerce': 'online-shopping',
    
    // Health & Medical
    'pharmacy': 'medications',
    'drugstore': 'medications',
    'hospital': 'medical-visits',
    'clinic': 'medical-visits',
    'doctor': 'medical-visits',
    'dentist': 'medical-visits',
    'health': 'medical-visits',
    'medical': 'medical-visits',
    'veterinary': 'pet-vet',
    
    // Entertainment
    'cinema': 'entertainment',
    'movie theater': 'entertainment',
    'theater': 'entertainment',
    'concert': 'entertainment',
    'sports': 'sports',
    'gym': 'gym-membership',
    'fitness': 'gym-membership',
    
    // Bills & Utilities
    'utility': 'utilities',
    'electricity': 'utilities',
    'water': 'utilities',
    'gas': 'utilities',
    'internet': 'internet-phone',
    'phone': 'internet-phone',
    'mobile': 'internet-phone',
    'insurance': 'insurance',
    
    // Home
    'furniture': 'furniture',
    'home improvement': 'maintenance',
    'hardware store': 'maintenance',
    'cleaning service': 'maintenance',
    
    // Education
    'school': 'courses-training',
    'university': 'courses-training',
    'college': 'courses-training',
    'bookstore': 'books-resources',
    'stationery': 'supplies',
    
    // Personal Care
    'salon': 'haircuts-beauty',
    'barber': 'haircuts-beauty',
    'spa': 'personal-care',
    'beauty': 'haircuts-beauty',
  };

  /**
   * Map AI-detected merchant category to transaction category ID
   */
  static mapMerchantCategory(aiCategory: string | undefined): string {
    if (!aiCategory) return 'other-expense';
    
    const normalizedCategory = aiCategory.toLowerCase().trim();
    
    // Direct mapping
    if (this.categoryMappings[normalizedCategory]) {
      return this.categoryMappings[normalizedCategory];
    }
    
    // Fuzzy matching - check if AI category contains any of our mapping keys
    for (const [key, value] of Object.entries(this.categoryMappings)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return value;
      }
    }
    
    // Default fallback
    return 'other-expense';
  }

  /**
   * Map item-level categories to transaction categories
   */
  static mapItemCategory(itemCategory: string | undefined): string | undefined {
    if (!itemCategory) return undefined;
    
    const normalizedCategory = itemCategory.toLowerCase().trim();
    
    // Item-specific mappings
    const itemMappings: Record<string, string> = {
      'food': 'groceries',
      'beverage': 'groceries',
      'alcohol': 'dining-out',
      'household': 'household-items',
      'cleaning': 'household-items',
      'personal care': 'personal-care',
      'electronics': 'other-shopping',
      'clothing': 'clothing',
      'medicine': 'medications',
      'health': 'medications',
      'pet': 'pet-supplies',
    };
    
    // Direct mapping
    if (itemMappings[normalizedCategory]) {
      return itemMappings[normalizedCategory];
    }
    
    // Fuzzy matching
    for (const [key, value] of Object.entries(itemMappings)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return value;
      }
    }
    
    return undefined;
  }

  /**
   * Get confidence score for the mapping
   */
  static getMappingConfidence(aiCategory: string | undefined, mappedCategory: string): number {
    if (!aiCategory) return 0.5;
    
    const normalizedCategory = aiCategory.toLowerCase().trim();
    
    // Direct match = high confidence
    if (this.categoryMappings[normalizedCategory]) {
      return 0.95;
    }
    
    // Fuzzy match = medium confidence
    for (const key of Object.keys(this.categoryMappings)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return 0.75;
      }
    }
    
    // Default mapping = low confidence
    return 0.5;
  }

  /**
   * Suggest multiple categories based on AI insights and items
   */
  static suggestCategories(
    merchantCategory: string | undefined,
    items: Array<{ category?: string }>,
    merchantName: string
  ): Array<{ categoryId: string; confidence: number; reason: string }> {
    const suggestions: Array<{ categoryId: string; confidence: number; reason: string }> = [];
    
    // Primary suggestion from merchant category
    if (merchantCategory) {
      const primaryCategory = this.mapMerchantCategory(merchantCategory);
      const confidence = this.getMappingConfidence(merchantCategory, primaryCategory);
      suggestions.push({
        categoryId: primaryCategory,
        confidence,
        reason: `AI detected merchant type: ${merchantCategory}`
      });
    }
    
    // Additional suggestions from item categories
    const itemCategories = new Map<string, number>();
    items.forEach(item => {
      if (item.category) {
        const category = this.mapItemCategory(item.category);
        if (category) {
          itemCategories.set(category, (itemCategories.get(category) || 0) + 1);
        }
      }
    });
    
    // Add item-based suggestions
    itemCategories.forEach((count, categoryId) => {
      const confidence = Math.min(0.9, 0.5 + (count / items.length) * 0.4);
      suggestions.push({
        categoryId,
        confidence,
        reason: `${count} items detected in this category`
      });
    });
    
    // Name-based fallback
    if (suggestions.length === 0) {
      const nameBasedCategory = this.suggestCategoryFromName(merchantName);
      suggestions.push({
        categoryId: nameBasedCategory,
        confidence: 0.6,
        reason: 'Based on merchant name analysis'
      });
    }
    
    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Legacy method - suggest category based on merchant name
   */
  private static suggestCategoryFromName(merchantName: string): string {
    const nameLower = merchantName.toLowerCase();
    
    // Check against common patterns
    const patterns: Array<[RegExp, string]> = [
      [/restaurant|cafe|coffee|bistro|diner/i, 'dining-out'],
      [/grocery|market|supermarket|mart/i, 'groceries'],
      [/gas|fuel|petrol|shell|bp|exxon/i, 'fuel'],
      [/pharmacy|cvs|walgreens|boots/i, 'medications'],
      [/walmart|target|amazon/i, 'other-shopping'],
      [/uber|lyft|taxi|cab/i, 'taxi-rideshare'],
      [/gym|fitness|yoga/i, 'gym-membership'],
      [/netflix|spotify|hulu|disney/i, 'entertainment'],
    ];
    
    for (const [pattern, category] of patterns) {
      if (pattern.test(nameLower)) {
        return category;
      }
    }
    
    return 'other-expense';
  }
}

// Export wrapper functions that maintain the class context
export const mapAICategory = (aiCategory: string | undefined): string => {
  return AICategoryMapper.mapMerchantCategory(aiCategory);
};

export const suggestCategories = (
  merchantCategory: string | undefined,
  items: Array<{ category?: string }>,
  merchantName: string
): Array<{ categoryId: string; confidence: number; reason: string }> => {
  return AICategoryMapper.suggestCategories(merchantCategory, items, merchantName);
}; 