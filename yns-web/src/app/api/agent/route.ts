/**
 * API endpoint to get agent metrics and provider status
 */

import { NextResponse } from "next/server";

// Use the same agent instance from chat route
let agentInstance: any = null;

export async function GET() {
  try {
    // Import dynamically to avoid circular dependency issues
    const { ReflexAgent } = await import('@/lib/reflex-agent');
    
    if (!agentInstance) {
      agentInstance = await ReflexAgent.createWithProviders({
        openaiApiKey: process.env.OPENAI_API_KEY,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
      });
    }

    const metrics = agentInstance.getMetrics();
    const availableProviders = agentInstance.getAvailableProviders();

    return NextResponse.json({
      availableProviders,
      metrics,
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get agent status", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();

    if (action === "test-routing") {
      // Test different types of queries to see how they're routed
      const { ReflexAgent } = await import('@/lib/reflex-agent');
      const { QueryAnalyzer } = await import('@/lib/query-analyzer');
      
      const testQueries = data?.queries || [
        "Write a React component for a button",
        "Explain the semiconductor manufacturing process", 
        "Calculate the area of a circle with radius 5",
        "Write a creative story about AI",
        "What is MPW in TSMC?",
        "Translate 'Hello world' to Korean"
      ];

      const results = testQueries.map((query: string) => {
        const context = QueryAnalyzer.analyzeQuery(query);
        return {
          query,
          analysis: context,
          recommendedAction: `Would route to best provider for ${context.taskType} (${context.complexity})`
        };
      });

      return NextResponse.json({
        testResults: results,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}