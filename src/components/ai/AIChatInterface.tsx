'use client';

/**
 * AI Chat Interface
 *
 * Professional chat UI for Claude AI assistant
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ThumbsUp, ThumbsDown, Sparkles, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: any[];
  feedback?: 'thumbs_up' | 'thumbs_down';
}

interface AIChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: (id: string) => void;
}

export default function AIChatInterface({
  conversationId,
  onNewConversation,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history if conversationId provided
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory(conversationId);
    }
  }, [conversationId]);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Create new conversation if this was the first message
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
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
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
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedback } : msg
        )
      );
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleClearConversation = () => {
    if (confirm('Clear this conversation? This cannot be undone.')) {
      setMessages([]);
      setCurrentConversationId(undefined);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderToolCalls = (toolCalls?: any[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {toolCalls.map((tool, idx) => (
          <div
            key={idx}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block mr-2"
          >
            🔧 {tool.name}
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
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearConversation}
            className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

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
                'Show me this month\'s revenue',
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
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>

              {message.role === 'assistant' && renderToolCalls(message.toolCalls)}

              {message.role === 'assistant' && (
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

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

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
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
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
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
