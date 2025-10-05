/**
 * Example: Comprehensive Reflex Agent Demo
 * 
 * This example demonstrates how to use the reflex agent system to route
 * different types of queries to optimal LLM providers through MCP.
 */

import { ReflexAgent } from '../lib/reflex-agent';
import { TaskType } from '../lib/mcp-interface';
import { QueryAnalyzer } from '../lib/query-analyzer';

// Example usage scenarios
const exampleQueries = [
  {
    query: "Write a React component that displays a user's profile with avatar and bio",
    expectedRouting: "OpenAI GPT-4 (code generation)",
    context: "Should route to OpenAI for code generation tasks"
  },
  {
    query: "Analyze the technical implications of moving from 7nm to 3nm semiconductor process technology",
    expectedRouting: "Claude 3.5 Sonnet (complex technical analysis)",
    context: "Complex reasoning task should go to Claude"
  },
  {
    query: "What's the weather like?",
    expectedRouting: "Most cost-effective provider (simple query)",
    context: "Simple queries use cheapest available provider"
  },
  {
    query: "Calculate the optimal pricing strategy for our MPW shuttle considering fabrication costs and market demand",
    expectedRouting: "Claude or GPT-4 (complex math reasoning)",
    context: "Complex mathematical reasoning"
  },
  {
    query: "Write a creative marketing story about the future of AI in semiconductor design",
    expectedRouting: "Claude 3.5 Sonnet (creative writing)",
    context: "Creative tasks prefer Claude with higher temperature"
  }
];

export async function demonstrateReflexAgent() {
  console.log("🚀 Starting Reflex Agent Demonstration\n");

  // Initialize the agent with multiple providers
  const agent = await ReflexAgent.createWithProviders({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    googleApiKey: process.env.GOOGLE_API_KEY!,
  });

  console.log("✅ Agent initialized with providers:", agent.getAvailableProviders());
  console.log();

  // Demonstrate query analysis
  console.log("🧠 QUERY ANALYSIS DEMONSTRATION");
  console.log("================================");
  
  for (const example of exampleQueries) {
    console.log(`\nQuery: "${example.query}"`);
    
    const analysis = QueryAnalyzer.analyzeQuery(example.query);
    console.log(`📊 Analysis:`, {
      taskType: analysis.taskType,
      complexity: analysis.complexity,
      domain: analysis.domain
    });
    
    console.log(`🎯 Expected: ${example.expectedRouting}`);
    console.log(`💭 Context: ${example.context}`);
  }

  // Demonstrate actual routing (if you have API keys configured)
  if (agent.getAvailableProviders().length > 0) {
    console.log("\n\n🔄 LIVE ROUTING DEMONSTRATION");
    console.log("===============================");
    
    // Test with a simple query
    const testQuery = "What is TSMC's MPW service?";
    console.log(`\nTesting query: "${testQuery}"`);
    
    try {
      const response = await agent.processQuery([
        { role: "user", content: testQuery, timestamp: new Date() }
      ]);
      
      console.log(`✅ Routed to: ${response.provider} (${response.model})`);
      console.log(`⚡ Latency: ${response.latency}ms`);
      console.log(`🎯 Confidence: ${response.confidence}`);
      console.log(`📝 Response preview: ${response.content.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ Routing failed: ${error}`);
    }
  }

  // Show current metrics
  console.log("\n\n📊 AGENT METRICS");
  console.log("==================");
  console.log(JSON.stringify(agent.getMetrics(), null, 2));

  return agent;
}

// Example of custom rule creation
export function addCustomBusinessRules(agent: ReflexAgent) {
  // Custom rule for TSMC-specific queries
  agent.addRule({
    condition: (context, providers) => {
      const query = context.domain === 'semiconductor' && 
                   context.taskType === TaskType.TECHNICAL_ANALYSIS;
      return query && providers.some(p => p.name === 'anthropic');
    },
    action: (context, providers) => {
      const anthropicProvider = providers.find(p => p.name === 'anthropic')!;
      return {
        provider: anthropicProvider,
        model: 'claude-3-5-sonnet-20241022',
        options: { 
          temperature: 0.1, // More precise for technical content
          maxTokens: 2000   // Longer responses for detailed analysis
        }
      };
    },
    priority: 85,
    description: 'TSMC technical queries -> Claude with precision settings'
  });

  // Custom rule for urgent/time-sensitive queries
  agent.addRule({
    condition: (context, providers) => {
      return context.userPreferences?.maxLatency && 
             context.userPreferences.maxLatency < 1000;
    },
    action: (context, providers) => {
      // Find the fastest provider
      const fastestProvider = providers.reduce((fastest, current) => {
        return current.getCapabilities().avgLatencyMs < fastest.getCapabilities().avgLatencyMs 
          ? current : fastest;
      });
      
      return {
        provider: fastestProvider,
        options: { 
          temperature: 0.3, // Lower temperature for faster processing
          maxTokens: 500    // Shorter responses for speed
        }
      };
    },
    priority: 95,
    description: 'Ultra-fast response required -> Speed-optimized routing'
  });

  console.log("✅ Added custom business rules to the agent");
}

// Usage example for your YNS platform
export async function ynsIntegrationExample() {
  const agent = await demonstrateReflexAgent();
  
  // Add YNS-specific rules
  addCustomBusinessRules(agent);
  
  // Test with YNS-specific scenarios
  const ynsQueries = [
    {
      messages: [{ 
        role: "user" as const, 
        content: "I need to submit my GDS files for the next MPW shuttle. What's the deadline?",
        timestamp: new Date()
      }],
      userPreferences: { prioritizeCost: true }
    },
    {
      messages: [{ 
        role: "user" as const, 
        content: "Generate a Python script to parse GDSII files and extract layer information",
        timestamp: new Date()
      }],
      userPreferences: { preferredProvider: "openai" }
    },
    {
      messages: [{ 
        role: "user" as const, 
        content: "URGENT: Explain the difference between 3nm and 5nm process nodes for our client presentation in 30 seconds",
        timestamp: new Date()
      }],
      userPreferences: { maxLatency: 800 }
    }
  ];

  console.log("\n\n🏢 YNS PLATFORM INTEGRATION EXAMPLES");
  console.log("=====================================");

  for (let i = 0; i < ynsQueries.length; i++) {
    const example = ynsQueries[i];
    console.log(`\n${i + 1}. Query: "${example.messages[0].content}"`);
    console.log(`   Preferences: ${JSON.stringify(example.userPreferences)}`);
    
    try {
      const response = await agent.processQuery(example.messages, example.userPreferences);
      console.log(`   ✅ Routed to: ${response.provider} (${response.model})`);
      console.log(`   ⚡ Latency: ${response.latency}ms`);
      console.log(`   💰 Est. Cost: ~$${(response.usage?.totalTokens || 0) * 0.00015}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error}`);
    }
  }

  return agent;
}

// Export for use in other modules
export { ReflexAgent, QueryAnalyzer };