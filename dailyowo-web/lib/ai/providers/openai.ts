/**
 * OpenAI Provider (Placeholder)
 * To be implemented when OpenAI integration is needed
 */

import {
  AIProvider,
  AIGenerateOptions,
  AIImageAnalysisResult,
  AIError,
  AIErrorCode,
} from '../types';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('[AI] OpenAI provider initialized (placeholder)');
  }

  isAvailable(): boolean {
    return false; // Placeholder - not implemented yet
  }

  async generateText(prompt: string, options?: AIGenerateOptions): Promise<string> {
    throw new AIError(
      'OpenAI provider not yet implemented',
      AIErrorCode.PROVIDER_NOT_AVAILABLE,
      this.name
    );
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<AIImageAnalysisResult> {
    throw new AIError(
      'OpenAI provider not yet implemented',
      AIErrorCode.PROVIDER_NOT_AVAILABLE,
      this.name
    );
  }
}

export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
} 