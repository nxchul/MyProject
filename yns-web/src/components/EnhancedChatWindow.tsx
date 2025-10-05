/**
 * Enhanced Chat Window Component with Reflex Agent Support
 * Shows provider information and routing decisions
 */

"use client";
import { useEffect, useRef, useState } from "react";
import ChatMessage, { ChatRole } from "@/components/ChatMessage";

interface Message {
  role: ChatRole;
  content: string;
}

interface ApiResponse { 
  response: string; 
  citations?: { id: number; source: string }[];
  metadata?: {
    provider: string;
    model: string;
    latency: number;
    confidence?: number;
    usage?: {
      totalTokens: number;
    };
  };
}

interface UserPreferences {
  preferredProvider?: string;
  maxLatency?: number;
  prioritizeCost?: boolean;
}

export default function EnhancedChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [messages]);

  // Load agent status on component mount
  useEffect(() => {
    fetch('/api/agent')
      .then(res => res.json())
      .then(data => setAgentStatus(data))
      .catch(err => console.warn('Could not load agent status:', err));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userPreferences 
        }),
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      const data = (await res.json()) as ApiResponse;
      
      // Enhanced response with metadata
      let responseContent = data.response;
      
      if (data.metadata) {
        responseContent += `\n\n---\n🤖 **Routed to:** ${data.metadata.provider} (${data.metadata.model})`;
        responseContent += `\n⚡ **Latency:** ${data.metadata.latency}ms`;
        if (data.metadata.confidence) {
          responseContent += `\n🎯 **Confidence:** ${Math.round(data.metadata.confidence * 100)}%`;
        }
        if (data.metadata.usage?.totalTokens) {
          responseContent += `\n💰 **Tokens:** ${data.metadata.usage.totalTokens}`;
        }
      }
      
      if (data.citations && data.citations.length > 0) {
        responseContent += "\n\n**Sources:**\n" + data.citations.map(c => `[${c.id}] ${c.source}`).join("\n");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testRouting = async () => {
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'test-routing',
          data: { queries: [input || "Write a React component"] }
        })
      });
      const data = await res.json();
      console.log('Routing test results:', data);
      alert('Check console for routing analysis');
    } catch (err) {
      console.error('Routing test failed:', err);
    }
  };

  return (
    <div className="flex h-[80vh] flex-col rounded-lg border bg-white/50 backdrop-blur">
      {/* Agent Status Header */}
      {agentStatus && (
        <div className="border-b bg-blue-50/70 px-4 py-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-900">
              🤖 Reflex Agent: {agentStatus.availableProviders?.join(', ') || 'No providers'} 
              ({agentStatus.metrics?.totalRequests || 0} requests)
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? 'Hide' : 'Show'} Settings
            </button>
          </div>
        </div>
      )}

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div className="border-b bg-gray-50/70 px-4 py-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Preferred Provider</label>
              <select
                value={userPreferences.preferredProvider || ''}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  preferredProvider: e.target.value || undefined
                }))}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">Auto-select</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Max Latency (ms)</label>
              <input
                type="number"
                value={userPreferences.maxLatency || ''}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  maxLatency: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                placeholder="3000"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={userPreferences.prioritizeCost || false}
                  onChange={(e) => setUserPreferences(prev => ({
                    ...prev,
                    prioritizeCost: e.target.checked
                  }))}
                  className="mr-2"
                />
                Prioritize Cost
              </label>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={testRouting}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              Test Routing
            </button>
            <button
              onClick={() => setUserPreferences({})}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Reset Settings
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500">
            <p className="mb-2">Ask anything about YNS and TSMC Design House services.</p>
            <p className="text-xs">
              🤖 Powered by Reflex Agent - Intelligently routes to optimal AI models
            </p>
          </div>
        )}
        {messages.map((m, idx) => (
          <ChatMessage key={idx} role={m.role} content={m.content} />
        ))}
        {loading && (
          <ChatMessage role="assistant" content="🤔 Analyzing query and selecting optimal AI model..." />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white/70 px-4 py-3">
        <textarea
          className="h-20 w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          placeholder="Type your message and press Enter… (Try: 'Write code', 'Explain semiconductors', 'Creative story')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {agentStatus?.availableProviders?.length > 0 && (
              <span>Available: {agentStatus.availableProviders.join(', ')}</span>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}