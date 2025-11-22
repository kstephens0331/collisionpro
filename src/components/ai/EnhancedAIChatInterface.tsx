'use client';

/**
 * Enhanced AI Chat Interface
 *
 * Professional chat UI with streaming, better UX, and rich features
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: any[];
  feedback?: 'thumbs_up' | 'thumbs_down';
  error?: boolean;
}

interface AIChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: (id: string) => void;
  enableStreaming?: boolean;
}

export default function EnhancedAIChatInterface({
  conversationId,
  onNewConversation,
  enableStreaming = true,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory(conversationId);
    }
  }, [conversationId]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadConversationHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            toolCalls: msg.toolCalls,
            feedback: msg.feedback,
          }))
        );
        setCurrentConversationId(id);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation history');
    }
  };

  const handleStreamingResponse = async (userMessageContent: string) => {
    const tempId = `stream-${Date.now()}`;

    // Add streaming message placeholder
    const streamingMessage: Message = {
      id: tempId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          conversationId: currentConversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Streaming request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullContent += data.chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempId ? { ...msg, content: fullContent } : msg
                )
              );
            }

            if (data.done) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempId
                    ? { ...msg, isStreaming: false, id: `msg-${Date.now()}` }
                    : msg
                )
              );

              if (data.conversationId && !currentConversationId) {
                setCurrentConversationId(data.conversationId);
                onNewConversation?.(data.conversationId);
              }
            }

            if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Streaming aborted');
      } else {
        console.error('Streaming error:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  content: 'Sorry, I encountered an error. Please try again.',
                  isStreaming: false,
                  error: true,
                }
              : msg
          )
        );
        setError(error.message);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (enableStreaming) {
        await handleStreamingResponse(messageContent);
      } else {
        // Fallback to non-streaming
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageContent,
            conversationId: currentConversationId,
          }),
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = await response.json();

        if (!currentConversationId && data.conversationId) {
          setCurrentConversationId(data.conversationId);
          onNewConversation?.(data.conversationId);
        }

        const assistantMessage: Message = {
          id: data.messageId || `msg-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          toolCalls: data.toolCalls,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    try {
      await fetch(`/api/ai/messages/${messageId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg))
      );
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleClearConversation = () => {
    if (confirm('Clear this conversation? This cannot be undone.')) {
      setMessages([]);
      setCurrentConversationId(undefined);
      setInput('');
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const renderToolCalls = (toolCalls?: any[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {toolCalls.map((tool, idx) => (
          <div
            key={idx}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full inline-flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {tool.name.replace(/_/g, ' ')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          {enableStreaming && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearConversation}
            className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              How can I help you today?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              I can help you with parts search, estimates, analytics, and more.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {[
                'Search for a 2022 Honda Accord front bumper',
                "Show me this month's revenue",
                'Create a new estimate',
                'Help me with tax deductions',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-50 border border-red-200 text-red-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                )}
              </div>

              {message.role === 'assistant' && renderToolCalls(message.toolCalls)}

              {message.role === 'assistant' && !message.isStreaming && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleFeedback(message.id, 'thumbs_up')}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                      message.feedback === 'thumbs_up' ? 'text-green-600' : 'text-gray-400'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, 'thumbs_down')}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                      message.feedback === 'thumbs_down' ? 'text-red-600' : 'text-gray-400'
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-400"
                    title="Copy response"
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your shop..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          {isLoading && enableStreaming ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
