// OwoAIModal.tsx
// Floating Owo AI modal with premium gating, two tabs, and glassy branding
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { GlassContainer } from '../ui/GlassContainer';
import { GlassButton } from '../ui/GlassButton';
import { Icon } from '../ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface OwoAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  userName?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface FinancialInsight {
  id: string;
  type: 'advice' | 'warning' | 'opportunity' | 'achievement' | 'trend';
  category: 'spending' | 'saving' | 'investing' | 'budget' | 'goals' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  confidence: number;
  generatedAt: Date;
}

export function OwoAIModal({ isOpen, onClose, isPremium, userName }: OwoAIModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'insight' | 'guide'>('insight');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsSummary, setInsightsSummary] = useState<string>('');
  const [insightsData, setInsightsData] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Format message content to handle markdown-like formatting
  const formatMessage = (content: string) => {
    // Simple formatting for bullet points and basic styling
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-gold mt-1">•</span>
            <span className="flex-1">{line.replace(/^[•\-]\s*/, '')}</span>
          </div>
        );
      }
      
      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
          <div key={index} className={index < lines.length - 1 ? 'mb-2' : ''}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex} className="font-semibold text-navy">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </div>
        );
      }
      
      // Regular lines
      return line.trim() ? (
        <div key={index} className={index < lines.length - 1 ? 'mb-2' : ''}>{line}</div>
      ) : (
        <div key={index} className="h-2"></div>
      );
    });
  };

  // Fetch AI insights
  const fetchInsights = async () => {
    if (!user) return;
    
    setInsightsLoading(true);
    try {
      const token = await user.getIdToken();
      console.log('🔍 [AI Modal] Making insights API call with token length:', token.length);
      
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🔍 [AI Modal] Insights API response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      console.log('🎨 [AI Modal] Insights response received:', {
        success: data.success,
        hasInsights: !!data.insights,
        insightsCount: data.insights?.insights?.length || 0,
        summary: data.insights?.summary?.substring(0, 100) + '...',
        contextSource: data.contextSource,
        financialSummary: data.financialSummary
      });
      
      if (data.success && data.insights) {
        setInsights(data.insights.insights || []);
        setInsightsSummary(data.insights.summary || '');
        // Store the full insights data for explanations
        setInsightsData(data.insights);
      } else {
        console.log('🎨 [AI Modal] ⚠️ No insights in response or failed request');
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      setInsightsSummary('Unable to generate insights at this time. Please try again later.');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Fetch insights when switching to insight tab
  useEffect(() => {
    if (activeTab === 'insight' && isOpen && user && insights.length === 0) {
      fetchInsights();
    }
  }, [activeTab, isOpen, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const token = await user.getIdToken();
      console.log('Token:', token);
      console.log('Token starts with eyJ:', token.startsWith('eyJ'));
      console.log('Token length:', token.length);
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input, conversationHistory: messages, context: { userName } }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      console.log('🎨 [AI Modal] Chat response received:', {
        hasContent: !!data.content,
        contentLength: data.content?.length || 0,
        contentPreview: data.content?.substring(0, 100) + '...' || 'No content'
      });
      
      // The response from the API is a stringified JSON object
      // that contains the assistant's message in a `content` field.
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.content || 'Sorry, I could not process your request.',
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white rounded-l-2xl shadow-2xl w-full max-w-md md:max-w-lg h-[90vh] max-h-[90vh] flex flex-col relative mr-0 md:mr-8"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gold"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
          <div className="flex items-center gap-3 p-6 border-b">
            <Icon name="ai" size={28} className="text-gold" />
            <h2 className="text-xl font-bold text-navy">Owo AI</h2>
          </div>
          <div className="flex gap-2 px-6 pt-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'insight' ? 'bg-gold/10 text-gold' : 'text-gray-500 hover:text-gold'}`}
              onClick={() => setActiveTab('insight')}
            >
              General Insight
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'guide' ? 'bg-gold/10 text-gold' : 'text-gray-500 hover:text-gold'}`}
              onClick={() => setActiveTab('guide')}
            >
              Financial Guide
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Friendly greeting and example questions for new users */}
            {activeTab === 'insight' ? (
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-navy">Your Financial Insights</h3>
                  <button
                    onClick={fetchInsights}
                    disabled={insightsLoading}
                    className="text-sm text-gold hover:text-gold/80 disabled:opacity-50"
                  >
                    <Icon name="refresh" size={16} className="inline mr-1" />
                    Refresh
                  </button>
                </div>

                {insightsLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  </div>
                ) : (
                  <>
                    {insightsSummary && (
                      <div className="bg-navy/5 border border-navy/10 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-navy mb-2">Financial Overview</h4>
                        <p className="text-sm text-gray-700">{insightsSummary}</p>
                      </div>
                    )}

                    {insights.length > 0 ? (
                      <div className="space-y-3">
                        {insights.map((insight) => (
                          <div
                            key={insight.id}
                            className={`p-4 rounded-lg border ${
                              insight.type === 'warning' 
                                ? 'bg-red-50 border-red-200' 
                                : insight.type === 'opportunity'
                                ? 'bg-green-50 border-green-200'
                                : insight.type === 'achievement'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-navy text-sm">{insight.title}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                insight.impact === 'high' 
                                  ? 'bg-red-100 text-red-700'
                                  : insight.impact === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {insight.impact} impact
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                            
                            {/* Additional description if detailed */}
                            {insight.description.length > 100 && (
                              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-3">
                                <div className="flex items-start gap-2">
                                  <Icon name="lightbulb" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-blue-800 mb-1">Additional details:</p>
                                    <p className="text-xs text-blue-700">{insight.description.substring(100)}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Metrics with explanations */}
                            {insight.metrics && insight.metrics.length > 0 && (
                              <div className="mb-3">
                                <h6 className="text-xs font-medium text-gray-700 mb-2">Key Numbers:</h6>
                                <div className="grid grid-cols-1 gap-2">
                                  {insight.metrics.map((metric, idx) => (
                                    <div key={idx} className="bg-white/80 rounded-lg p-2 border border-gray-100">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs font-bold text-navy">{metric.value}</span>
                                          {metric.trend && (
                                            <Icon 
                                              name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus'} 
                                              size={12} 
                                              className={
                                                metric.trend === 'up' ? 'text-green-600' : 
                                                metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                                              } 
                                            />
                                          )}
                                        </div>
                                      </div>
                                      {/* No explanation field in metric type */}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{insight.category}</span>
                              <span className="text-xs text-gray-400">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Overall metrics explanations */}
                        {insightsData?.explanations && (
                          <div className="mt-4 p-4 bg-gold/5 border border-gold/20 rounded-lg">
                            <h6 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
                              <Icon name="info" size={16} className="text-gold" />
                              Understanding Your Numbers
                            </h6>
                            <div className="space-y-2">
                              {Object.entries(insightsData.explanations).map(([key, explanation]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-gray-600 ml-1">{String(explanation)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Icon name="ai" size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Loading your insights...</p>
                        <p className="text-sm text-gray-400">I'm analyzing your financial data</p>
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 min-h-0" ref={chatContainerRef}>
                  <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md p-4 rounded-2xl shadow-sm break-words ${
                        msg.role === 'user' 
                          ? 'bg-gold text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name="ai" size={16} className="text-gold" />
                            <span className="text-xs font-medium text-gold">Owo AI</span>
                          </div>
                        )}
                        <div className={`${msg.role === 'assistant' ? 'prose prose-sm max-w-none break-words' : 'break-words'}`}>
                          {formatMessage(msg.content)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                <div className="border-t bg-white p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 p-3 border rounded-l-lg focus:ring-gold focus:border-gold"
                    disabled={isLoading}
                  />
                  <button type="submit" className="bg-gold text-white p-3 rounded-r-lg disabled:bg-gold/50" disabled={isLoading || !input.trim()}>
                    <Icon name="send" size={20} />
                  </button>
                  </form>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 pb-4 text-xs text-gray-400 text-center">
            Owo AI provides guidance based on your data. You are responsible for your financial decisions.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
