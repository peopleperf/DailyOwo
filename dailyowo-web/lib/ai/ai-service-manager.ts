/**
 * AI Service Manager
 * Centralizes AI provider management and module initialization
 */

import { AIProvider, AIModule } from './types';
import { GeminiProvider } from './providers/gemini';
import { FinancialInsightsModule } from './modules/financial-insights';
import { ReceiptAIModule } from './modules/receipt-ai';
import { BudgetAIModule } from './modules/budget-ai';
import { ChatAssistantModule } from './modules/chat-assistant';
import { AICache } from './cache';

export class AIServiceManager {
  private static instance: AIServiceManager;
  private providers: Map<string, AIProvider> = new Map();
  private modules: Map<string, any> = new Map();
  private cache: AICache = new AICache();
  private initialized = false;

  private constructor() {}

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * Initialize AI service with configuration
   */
  async initialize(config?: {
    defaultProvider?: string;
    providers?: Record<string, any>;
  }): Promise<void> {
    if (this.initialized) {
      console.log('[AI] Service already initialized');
      return;
    }

    console.log('[AI] Initializing AI Service Manager...');

    // Initialize providers
    if (config?.providers?.gemini) {
      const geminiProvider = new GeminiProvider(config.providers.gemini);
      await geminiProvider.initialize();
      this.providers.set('gemini', geminiProvider);
    }

    // Set default provider
    const defaultProvider = this.providers.get(config?.defaultProvider || 'gemini');
    
    if (defaultProvider) {
      // Initialize modules with default provider
      this.modules.set('insights', new FinancialInsightsModule(defaultProvider));
      this.modules.set('receipt', new ReceiptAIModule(defaultProvider));
      this.modules.set('budget', new BudgetAIModule(defaultProvider));
      this.modules.set('chat', new ChatAssistantModule(defaultProvider));

      // Initialize all modules
      for (const module of this.modules.values()) {
        if (module.initialize) {
          await module.initialize();
        }
      }
    }

    this.initialized = true;
    console.log('[AI] Service Manager initialized successfully');
  }

  /**
   * Get a specific provider
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): AIProvider | undefined {
    return this.providers.get('gemini') || this.providers.values().next().value;
  }

  /**
   * Get a specific module
   */
  getModule<T = any>(name: string): T | undefined {
    return this.modules.get(name);
  }

  /**
   * Get the cache instance
   */
  getCache(): AICache {
    return this.cache;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if AI features are enabled
   */
  isEnabled(): boolean {
    return process.env.NEXT_PUBLIC_AI_ENABLED === 'true' && this.initialized;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    for (const provider of this.providers.values()) {
      if (provider.cleanup) {
        await provider.cleanup();
      }
    }
    
    this.providers.clear();
    this.modules.clear();
    this.cache.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const aiServiceManager = AIServiceManager.getInstance(); 