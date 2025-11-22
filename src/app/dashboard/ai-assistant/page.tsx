/**
 * AI Assistant Dashboard Page
 *
 * Claude-powered conversational assistant for shop management
 */

import { createClient } from '@supabase/supabase-js';
import EnhancedAIChatInterface from '@/components/ai/EnhancedAIChatInterface';
import ConversationList from '@/components/ai/ConversationList';
import AIUsageStats from '@/components/ai/AIUsageStats';
import { Sparkles } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AIAssistantPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // TODO: Get userId from authenticated session
  const userId = 'test-user-id';

  // Get recent conversations
  const { data: conversations } = await supabase
    .from('AssistantConversation')
    .select('*')
    .eq('userId', userId)
    .eq('status', 'active')
    .order('updatedAt', { ascending: false })
    .limit(10);

  // Get usage stats for today
  const { data: todayUsage } = await supabase
    .from('AssistantUsage')
    .select('*')
    .eq('userId', userId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8" />
          <h1 className="text-3xl font-bold">AI Assistant</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Powered by Claude 3.5 Sonnet - Your intelligent shop management companion
        </p>
      </div>

      {/* Usage Stats */}
      <AIUsageStats stats={todayUsage} period="today" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <ConversationList userId={userId} />

          {/* Capabilities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">I can help with:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Search parts across multiple suppliers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Create and manage estimates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Track shop performance & analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Calculate tax deductions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Generate financial reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Assign technicians to jobs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Send customer notifications</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3" style={{ height: 'calc(100vh - 350px)' }}>
          <EnhancedAIChatInterface enableStreaming={true} />
        </div>
      </div>

      {/* Example Prompts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Example Prompts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              title: 'Search for Parts',
              prompt: 'Find the cheapest front bumper for a 2022 Honda Accord',
            },
            {
              title: 'Shop Analytics',
              prompt: 'Show me revenue analytics for this month',
            },
            {
              title: 'Create Estimate',
              prompt: 'Help me create a new estimate for a front-end collision',
            },
            {
              title: 'Tax Help',
              prompt: 'Calculate tax deduction for $15,000 in equipment purchases',
            },
            {
              title: 'Financial Report',
              prompt: 'Generate a profit & loss report for Q4',
            },
            {
              title: 'Job Management',
              prompt: 'Assign Mike to job EST-12345 with 8 hours estimated',
            },
          ].map((example, idx) => (
            <div
              key={idx}
              className="bg-linear-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100"
            >
              <div className="font-medium text-gray-900 mb-1">{example.title}</div>
              <div className="text-sm text-gray-600 italic">"{example.prompt}"</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
