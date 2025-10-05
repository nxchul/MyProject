// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { retrieveContext } from "@/lib/rag";
import { ReflexAgent } from "@/lib/reflex-agent";
import { MCPMessage } from "@/lib/mcp-interface";

// Global agent instance (in production, use proper singleton pattern or DI)
let agentInstance: ReflexAgent | null = null;

// Initialize the reflex agent with available providers
async function getAgent(): Promise<ReflexAgent> {
  if (!agentInstance) {
    agentInstance = await ReflexAgent.createWithProviders({
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
    });
    
    console.log('🤖 Initialized Reflex Agent with providers:', agentInstance.getAvailableProviders());
  }
  return agentInstance;
}

export async function POST(req: Request) {
  try {
    const { messages, userPreferences } = (await req.json()) as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      userPreferences?: {
        preferredProvider?: string;
        maxLatency?: number;
        prioritizeCost?: boolean;
      };
    };

    // Initialize the reflex agent
    const agent = await getAgent();

    if (agent.getAvailableProviders().length === 0) {
      return NextResponse.json(
        { error: "No LLM providers available. Please configure API keys." },
        { status: 500 }
      );
    }

    // Get last user question for RAG context retrieval
    const question = messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";

    // Retrieve documents for RAG (if available)
    let contextText = "";
    let citations: any[] = [];
    
    try {
      if (question && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const relevantDocs = await retrieveContext(question, 4);
        contextText = relevantDocs.map((d: any) => d.pageContent).join("\n---\n");
        citations = relevantDocs.map((d: any, idx: number) => ({ 
          id: idx + 1, 
          source: d.metadata?.source 
        }));
      }
    } catch (error) {
      console.warn('RAG context retrieval failed, continuing without context:', error);
    }

    // Prepare system prompt with RAG context
    const systemPrompt = `You are an assistant for YNS & TSMC Design House. ${contextText ? 'Use the provided CONTEXT to answer user queries accurately.' : 'Answer user queries about semiconductor design, TSMC services, and related topics.'} If you don't know something, please say so honestly.

${contextText ? `CONTEXT:\n${contextText}` : ''}`;

    // Convert to MCP message format
    const mcpMessages: MCPMessage[] = [
      { 
        role: "system", 
        content: systemPrompt.trim(),
        timestamp: new Date()
      },
      ...messages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        timestamp: new Date()
      }))
    ];

    // Use the reflex agent to process the query with intelligent LLM selection
    const agentResponse = await agent.processQuery(mcpMessages, userPreferences);

    // Return response in the expected format
    return NextResponse.json({ 
      response: agentResponse.content,
      citations,
      metadata: {
        provider: agentResponse.provider,
        model: agentResponse.model,
        latency: agentResponse.latency,
        confidence: agentResponse.confidence,
        usage: agentResponse.usage
      }
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}