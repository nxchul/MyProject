/**
 * Example usage of the Reflex Agent with MCP Connection
 * Demonstrates how to use the reflex agent to intelligently route requests to different LLMs
 */

import { ReflexAgent, Request } from './reflex-agent';
import { createMCPConnector, MCPConnector } from './mcp-connector';

/**
 * Initialize and configure the system
 */
async function initializeSystem() {
  // Create MCP Connector with endpoints
  const mcpConnector = createMCPConnector({
    'mcp://openai/gpt-4-turbo': {
      endpoint: 'wss://api.openai.com/mcp/v1',
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    },
    'mcp://openai/gpt-3.5-turbo': {
      endpoint: 'wss://api.openai.com/mcp/v1',
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000
    },
    'mcp://anthropic/claude-3-opus': {
      endpoint: 'wss://api.anthropic.com/mcp/v1',
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30000
    },
    'mcp://meta/codellama-70b': {
      endpoint: 'wss://api.meta.com/mcp/v1',
      apiKey: process.env.META_API_KEY,
      timeout: 20000
    },
    'mcp://mistral/mixtral-8x7b': {
      endpoint: 'wss://api.mistral.ai/mcp/v1',
      apiKey: process.env.MISTRAL_API_KEY,
      timeout: 15000
    },
    'mcp://google/gemini-pro': {
      endpoint: 'wss://api.google.com/mcp/v1',
      apiKey: process.env.GOOGLE_API_KEY,
      timeout: 20000
    }
  });

  // Create Reflex Agent
  const reflexAgent = new ReflexAgent();

  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 2000));

  return { reflexAgent, mcpConnector };
}

/**
 * Example 1: Simple code generation request
 */
async function example1_codeGeneration(agent: ReflexAgent) {
  console.log('\n=== Example 1: Code Generation ===');
  
  const request: Request = {
    id: 'req_001',
    type: 'code_generation',
    content: 'Write a Python function to calculate fibonacci numbers',
    metadata: {
      language: 'python',
      complexity: 'low'
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('LLM Used:', response.llmUsed); // Should route to codellama-70b
}

/**
 * Example 2: Low latency chat request
 */
async function example2_lowLatencyChat(agent: ReflexAgent) {
  console.log('\n=== Example 2: Low Latency Chat ===');
  
  const request: Request = {
    id: 'req_002',
    type: 'chat',
    content: 'What is the capital of France?',
    constraints: {
      maxLatency: 500 // Need response in 500ms
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('LLM Used:', response.llmUsed); // Should route to gpt-3.5-turbo
}

/**
 * Example 3: Complex analysis with large context
 */
async function example3_complexAnalysis(agent: ReflexAgent) {
  console.log('\n=== Example 3: Complex Analysis ===');
  
  const request: Request = {
    id: 'req_003',
    type: 'analysis',
    content: 'Analyze the implications of quantum computing on cryptography',
    context: [
      // Simulating large context
      'Quantum computing leverages quantum mechanical phenomena...',
      '...RSA encryption relies on the difficulty of factoring large numbers...',
      // ... imagine 100k+ tokens of context here
    ],
    metadata: {
      complexity: 'high',
      domain: 'technology'
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('LLM Used:', response.llmUsed); // Should route to gpt-4-turbo
}

/**
 * Example 4: Cost-sensitive request
 */
async function example4_costOptimized(agent: ReflexAgent) {
  console.log('\n=== Example 4: Cost-Optimized Request ===');
  
  const request: Request = {
    id: 'req_004',
    type: 'summarization',
    content: 'Summarize this article about renewable energy',
    constraints: {
      maxCost: 5 // Max 5 cents
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('LLM Used:', response.llmUsed); // Should route to mixtral-8x7b
  console.log('Cost:', response.cost);
}

/**
 * Example 5: High accuracy requirement with consensus
 */
async function example5_highAccuracy(agent: ReflexAgent) {
  console.log('\n=== Example 5: High Accuracy with Consensus ===');
  
  const request: Request = {
    id: 'req_005',
    type: 'analysis',
    content: 'Calculate the optimal trajectory for Mars mission launch window',
    constraints: {
      minAccuracy: 0.98 // Need very high accuracy
    },
    metadata: {
      domain: 'aerospace',
      complexity: 'high'
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('LLMs Used:', response.llmsUsed); // Should use multiple LLMs
  console.log('Consensus:', response.consensus);
}

/**
 * Example 6: Dynamic rule addition
 */
async function example6_dynamicRules(agent: ReflexAgent) {
  console.log('\n=== Example 6: Dynamic Rule Addition ===');
  
  // Add a custom rule for medical queries
  agent.addRule({
    id: 'rule_medical_specialist',
    priority: 11, // High priority
    conditions: [
      { field: 'metadata.domain', operator: 'equals', value: 'medical' }
    ],
    action: {
      type: 'multi_llm',
      targetLLMs: ['gpt-4-turbo', 'claude-3-opus'], // Use multiple for safety
      parameters: { strategy: 'consensus' }
    }
  });

  const request: Request = {
    id: 'req_006',
    type: 'analysis',
    content: 'What are the symptoms and treatment options for Type 2 Diabetes?',
    metadata: {
      domain: 'medical',
      complexity: 'medium'
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('Custom rule applied for medical domain');
}

/**
 * Example 7: Monitoring and metrics
 */
async function example7_monitoring(agent: ReflexAgent) {
  console.log('\n=== Example 7: Metrics and Monitoring ===');
  
  // Process several requests to generate metrics
  const requests: Request[] = [
    {
      id: 'metric_001',
      type: 'chat',
      content: 'Hello world'
    },
    {
      id: 'metric_002',
      type: 'code_generation',
      content: 'Write a function',
      metadata: { language: 'python' }
    },
    {
      id: 'metric_003',
      type: 'analysis',
      content: 'Analyze this data',
      metadata: { complexity: 'high' }
    }
  ];

  for (const req of requests) {
    await agent.processRequest(req);
  }

  // Get metrics
  const metrics = agent.getMetrics();
  console.log('System Metrics:');
  console.log('Total Requests:', metrics.totalRequests);
  console.log('Cache Hit Rate:', metrics.cacheHitRate);
  console.log('\nRule Usage:');
  metrics.rules.forEach((rule: any) => {
    console.log(`  ${rule.ruleId}: ${rule.uses} uses, avg latency: ${rule.averageLatency}ms`);
  });
}

/**
 * Example 8: Handling LLM failures
 */
async function example8_failureHandling(agent: ReflexAgent) {
  console.log('\n=== Example 8: Failure Handling ===');
  
  // Simulate GPT-4 being unavailable
  agent.updateLLMAvailability('gpt-4-turbo', false);
  
  const request: Request = {
    id: 'req_008',
    type: 'analysis',
    content: 'Complex analysis that would normally use GPT-4',
    metadata: {
      complexity: 'high'
    }
  };

  const response = await agent.processRequest(request);
  console.log('Response:', response);
  console.log('Fallback LLM Used:', response.llmUsed); // Should fallback to another model
  
  // Re-enable GPT-4
  agent.updateLLMAvailability('gpt-4-turbo', true);
}

/**
 * Example 9: Batch processing with different routing
 */
async function example9_batchProcessing(agent: ReflexAgent) {
  console.log('\n=== Example 9: Batch Processing ===');
  
  const batchRequests: Request[] = [
    {
      id: 'batch_001',
      type: 'translation',
      content: 'Translate to Spanish: Hello, how are you?',
      constraints: { maxLatency: 1000 }
    },
    {
      id: 'batch_002',
      type: 'code_generation',
      content: 'Generate SQL query for user analytics',
      metadata: { language: 'sql' }
    },
    {
      id: 'batch_003',
      type: 'summarization',
      content: 'Summarize this 10-page document...',
      context: ['Page 1 content...', 'Page 2 content...'],
      constraints: { maxCost: 10 }
    }
  ];

  // Process in parallel
  const responses = await Promise.all(
    batchRequests.map(req => agent.processRequest(req))
  );

  responses.forEach((response, index) => {
    console.log(`Request ${batchRequests[index].id}:`);
    console.log(`  LLM: ${response.llmUsed || response.llmsUsed}`);
    console.log(`  Latency: ${response.latency}ms`);
    console.log(`  Cost: $${response.cost}`);
  });
}

/**
 * Example 10: Health monitoring
 */
async function example10_healthCheck(mcpConnector: MCPConnector) {
  console.log('\n=== Example 10: Health Check ===');
  
  const health = await mcpConnector.healthCheck();
  
  console.log('MCP Endpoint Health Status:');
  health.forEach((status, endpoint) => {
    console.log(`  ${endpoint}:`);
    console.log(`    Status: ${status.status}`);
    console.log(`    Latency: ${status.latency}ms`);
    console.log(`    Connected: ${status.connected}`);
  });

  // Check connection status
  const connectionStatus = mcpConnector.getConnectionStatus();
  console.log('\nConnection Status:');
  connectionStatus.forEach((isConnected, endpoint) => {
    console.log(`  ${endpoint}: ${isConnected ? 'Connected' : 'Disconnected'}`);
  });

  // Check queue status
  const queueStatus = mcpConnector.getQueueStatus();
  console.log('\nMessage Queue Status:');
  queueStatus.forEach((queueSize, endpoint) => {
    console.log(`  ${endpoint}: ${queueSize} messages queued`);
  });
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Reflex Agent MCP Integration Demo');
  console.log('=====================================\n');

  try {
    // Initialize system
    const { reflexAgent, mcpConnector } = await initializeSystem();
    console.log('✅ System initialized successfully\n');

    // Run examples
    await example1_codeGeneration(reflexAgent);
    await example2_lowLatencyChat(reflexAgent);
    await example3_complexAnalysis(reflexAgent);
    await example4_costOptimized(reflexAgent);
    await example5_highAccuracy(reflexAgent);
    await example6_dynamicRules(reflexAgent);
    await example7_monitoring(reflexAgent);
    await example8_failureHandling(reflexAgent);
    await example9_batchProcessing(reflexAgent);
    await example10_healthCheck(mcpConnector);

    console.log('\n✅ All examples completed successfully!');
    
    // Cleanup
    mcpConnector.closeAllConnections();
    console.log('🔒 Connections closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other modules
export { initializeSystem, main };