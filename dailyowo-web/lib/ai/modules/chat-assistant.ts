/**
 * Chat Assistant AI Module
 * Provides conversational AI for financial queries and assistance
 */

import {
  AIModule,
  AIProvider,
  AIChatMessage,
  AIChatContext,
} from '../types';

export class ChatAssistantModule implements AIModule {
  id = 'chat';
  name = 'Chat Assistant Module';
  description = 'Provides conversational AI for financial queries and assistance';
  version = '1.0.0';
  
  constructor(public provider: AIProvider) {}

  async initialize(): Promise<void> {
    console.log('[AI] Initializing Chat Assistant Module...');
  }

  /**
   * Check if a feature is supported
   */
  supports(feature: string): boolean {
    const supportedFeatures = ['processMessage', 'chat', 'context', 'history'];
    return supportedFeatures.includes(feature) &&
           (feature !== 'processMessage' || !!this.provider.chat);
  }

  /**
   * Process a chat message and generate a response
   */
  async processMessage(
    message: string,
    context: AIChatContext,
    conversationHistory: AIChatMessage[] = []
  ): Promise<AIChatMessage> {

    if (!this.supports('chat')) {
      console.error('[AI] Chat capability check failed');
      return this.createErrorResponse(
        'Chat feature is not supported by the current configuration',
        'UNSUPPORTED_FEATURE'
      );
    }
    
    try {
      if (!this.provider.chat) {
        throw new Error('Provider chat method is undefined despite supports() check');
      }
      const richContext: AIChatContext = {
        ...context,
        messages: conversationHistory,
      };
      const responseContent = await this.provider.chat(message, richContext);
      return {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[AI] Error processing message:', error);
      return this.createErrorResponse(
        'Sorry, I encountered an error processing your request',
        'PROCESSING_ERROR',
        error
      );
    }
  }

  private createErrorResponse(
    message: string,
    code: string,
    error?: unknown
  ): AIChatMessage {
    if (error) {
      console.error(`[AI] Error details (${code}):`, error);
    }
    return {
      role: 'assistant',
      content: message,
      timestamp: new Date(),
      error: true,
      errorCode: code,
      ...(error instanceof Error ? { errorDetails: error.message } : {})
    };
  }
}

export function createChatAssistantModule(provider: AIProvider): ChatAssistantModule {
  return new ChatAssistantModule(provider);
} 