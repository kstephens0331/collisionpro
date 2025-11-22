'use client';

/**
 * Conversation List Component
 *
 * Display and manage AI conversation history
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Trash2, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date;
  updatedAt: Date;
}

interface ConversationListProps {
  userId?: string;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  currentConversationId?: string;
}

export default function ConversationList({
  userId,
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      // For now, using placeholder data
      setConversations([]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`/api/ai/conversations/${id}`, {
        method: 'DELETE',
      });

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (currentConversationId === id) {
        onNewConversation?.();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Conversations
        </h2>
        <button
          onClick={onNewConversation}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="New conversation"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative p-3 rounded-lg transition-colors cursor-pointer ${
                currentConversationId === conv.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onSelectConversation?.(conv.id)}
            >
              <div className="font-medium text-sm text-gray-900 truncate pr-8">
                {conv.title || 'Untitled Conversation'}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span>{conv.messageCount} messages</span>
                <span>•</span>
                <span>{formatDate(conv.lastMessageAt)}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(conv.id);
                }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conversations yet</p>
          <button
            onClick={onNewConversation}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Start your first conversation
          </button>
        </div>
      )}
    </div>
  );
}
