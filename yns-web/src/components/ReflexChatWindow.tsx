"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, User, Loader2, Cpu, Zap, Brain } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    queryType: string;
    llmUsed: string;
    provider: string;
    model: string;
    cost?: number;
    fallback?: boolean;
  };
}

interface AgentStatus {
  registeredLLMs: string[];
  conversationLength: number;
  routingRules: Record<string, string>;
}

export default function ReflexChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [messages]);

  // Load agent status on mount
  useEffect(() => {
    loadAgentStatus();
  }, []);

  const loadAgentStatus = async () => {
    try {
      const response = await fetch("/api/chat/reflex");
      const status = await response.json();
      setAgentStatus(status);
    } catch (error) {
      console.error("Failed to load agent status:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      role: "user", 
      content: input.trim() 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/reflex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input.trim() }),
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        metadata: data.metadata
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        metadata: { queryType: "error", llmUsed: "none", provider: "none", model: "none" }
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const getLLMIcon = (llmUsed: string) => {
    switch (llmUsed) {
      case "gpt4":
        return <Brain className="w-4 h-4 text-green-500" />;
      case "claude":
        return <Cpu className="w-4 h-4 text-orange-500" />;
      case "gemini":
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQueryTypeColor = (queryType: string) => {
    const colors: Record<string, string> = {
      mpw: "bg-purple-100 text-purple-800",
      pdk: "bg-blue-100 text-blue-800",
      technical: "bg-green-100 text-green-800",
      crypto: "bg-yellow-100 text-yellow-800",
      creative: "bg-pink-100 text-pink-800",
      code: "bg-indigo-100 text-indigo-800",
      analysis: "bg-red-100 text-red-800",
      general: "bg-gray-100 text-gray-800",
      fallback: "bg-orange-100 text-orange-800"
    };
    return colors[queryType] || colors.general;
  };

  return (
    <div className="flex h-[80vh] flex-col rounded-lg border bg-white/50 backdrop-blur">
      {/* Header with Agent Status */}
      <div className="border-b bg-white/70 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">YNS Reflex Agent</h3>
          </div>
          {agentStatus && (
            <div className="text-sm text-gray-600">
              {agentStatus.registeredLLMs.length} LLMs • {agentStatus.conversationLength} messages
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 space-y-2">
            <p>Ask anything about YNS and TSMC Design House services.</p>
            <p className="text-xs">The Reflex agent will intelligently route your query to the best LLM.</p>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-3xl ${message.role === "user" ? "order-2" : "order-1"}`}>
              <div className={`flex items-start space-x-2 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user" ? "bg-blue-600" : "bg-gray-200"
                }`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    getLLMIcon(message.metadata?.llmUsed || "bot")
                  )}
                </div>
                
                <div className={`px-4 py-2 rounded-lg ${
                  message.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white border shadow-sm"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.metadata && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getQueryTypeColor(message.metadata.queryType)}`}>
                        {message.metadata.queryType}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {message.metadata.llmUsed}
                      </span>
                      {message.metadata.cost && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          ${message.metadata.cost.toFixed(6)}
                        </span>
                      )}
                      {message.metadata.fallback && (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                          fallback
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white border shadow-sm px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Processing with Reflex agent...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white/70 px-4 py-3">
        <textarea
          className="h-20 w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          placeholder="Type your message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            The agent will automatically choose the best LLM for your query
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}