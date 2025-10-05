/**
 * Reflex Agent for LLM-MCP Connection
 * A simple, fast, and scalable approach to routing requests to different LLMs
 */

// Types for the reflex agent system
interface Request {
  id: string;
  type: 'code_generation' | 'chat' | 'analysis' | 'translation' | 'summarization';
  content: string;
  context?: string[];
  constraints?: {
    maxLatency?: number; // in milliseconds
    maxCost?: number;    // in cents
    minAccuracy?: number; // 0-1 scale
    preferredModels?: string[];
  };
  metadata?: {
    language?: string;
    domain?: string;
    complexity?: 'low' | 'medium' | 'high';
    priority?: 'low' | 'normal' | 'high';
  };
}

interface LLMProfile {
  id: string;
  name: string;
  capabilities: string[];
  contextWindow: number;
  costPer1kTokens: number;
  averageLatency: number;
  accuracy: number;
  specializations: string[];
  mcpEndpoint: string;
  available: boolean;
}

interface ReflexRule {
  id: string;
  priority: number;
  conditions: Condition[];
  action: Action;
  fallback?: string; // ID of fallback rule
}

interface Condition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

interface Action {
  type: 'route_to_llm' | 'multi_llm' | 'cache_lookup';
  targetLLM?: string;
  targetLLMs?: string[];
  parameters?: Record<string, any>;
}

/**
 * Main Reflex Agent Class
 */
export class ReflexAgent {
  private rules: ReflexRule[] = [];
  private llmRegistry: Map<string, LLMProfile> = new Map();
  private responseCache: Map<string, any> = new Map();
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.initializeRules();
    this.initializeLLMRegistry();
  }

  /**
   * Initialize reflex rules - these are the core of the agent's decision making
   */
  private initializeRules(): void {
    this.rules = [
      // High-priority specialized rules
      {
        id: 'rule_code_python',
        priority: 10,
        conditions: [
          { field: 'type', operator: 'equals', value: 'code_generation' },
          { field: 'metadata.language', operator: 'equals', value: 'python' }
        ],
        action: {
          type: 'route_to_llm',
          targetLLM: 'codellama-70b'
        },
        fallback: 'rule_code_general'
      },
      
      // Performance-critical routing
      {
        id: 'rule_low_latency',
        priority: 9,
        conditions: [
          { field: 'constraints.maxLatency', operator: 'less_than', value: 1000 }
        ],
        action: {
          type: 'route_to_llm',
          targetLLM: 'gpt-3.5-turbo'
        }
      },

      // Complex reasoning tasks
      {
        id: 'rule_complex_analysis',
        priority: 8,
        conditions: [
          { field: 'type', operator: 'equals', value: 'analysis' },
          { field: 'metadata.complexity', operator: 'equals', value: 'high' }
        ],
        action: {
          type: 'route_to_llm',
          targetLLM: 'gpt-4-turbo'
        }
      },

      // Large context handling
      {
        id: 'rule_large_context',
        priority: 7,
        conditions: [
          { field: 'context_length', operator: 'greater_than', value: 50000 }
        ],
        action: {
          type: 'route_to_llm',
          targetLLM: 'claude-3-opus'
        }
      },

      // Cost-optimized routing
      {
        id: 'rule_cost_sensitive',
        priority: 6,
        conditions: [
          { field: 'constraints.maxCost', operator: 'less_than', value: 10 }
        ],
        action: {
          type: 'route_to_llm',
          targetLLM: 'mixtral-8x7b'
        }
      },

      // Multi-model consensus for critical tasks
      {
        id: 'rule_high_accuracy',
        priority: 5,
        conditions: [
          { field: 'constraints.minAccuracy', operator: 'greater_than', value: 0.95 }
        ],
        action: {
          type: 'multi_llm',
          targetLLMs: ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro'],
          parameters: { strategy: 'consensus' }
        }
      },

      // Default fallback rule
      {
        id: 'rule_default',
        priority: 0,
        conditions: [],
        action: {
          type: 'route_to_llm',
          targetLLM: 'gpt-3.5-turbo'
        }
      }
    ];

    // Sort rules by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Initialize LLM registry with available models and their profiles
   */
  private initializeLLMRegistry(): void {
    const models: LLMProfile[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
        contextWindow: 128000,
        costPer1kTokens: 0.03,
        averageLatency: 3000,
        accuracy: 0.95,
        specializations: ['complex_reasoning', 'nuanced_analysis'],
        mcpEndpoint: 'mcp://openai/gpt-4-turbo',
        available: true
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        capabilities: ['chat', 'simple_coding', 'summarization'],
        contextWindow: 16385,
        costPer1kTokens: 0.002,
        averageLatency: 500,
        accuracy: 0.85,
        specializations: ['general_chat', 'fast_response'],
        mcpEndpoint: 'mcp://openai/gpt-3.5-turbo',
        available: true
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        capabilities: ['reasoning', 'coding', 'analysis', 'long_context'],
        contextWindow: 200000,
        costPer1kTokens: 0.015,
        averageLatency: 2500,
        accuracy: 0.94,
        specializations: ['long_documents', 'detailed_analysis'],
        mcpEndpoint: 'mcp://anthropic/claude-3-opus',
        available: true
      },
      {
        id: 'codellama-70b',
        name: 'Code Llama 70B',
        capabilities: ['coding', 'debugging', 'code_analysis'],
        contextWindow: 100000,
        costPer1kTokens: 0.001,
        averageLatency: 1500,
        accuracy: 0.92,
        specializations: ['python', 'javascript', 'rust'],
        mcpEndpoint: 'mcp://meta/codellama-70b',
        available: true
      },
      {
        id: 'mixtral-8x7b',
        name: 'Mixtral 8x7B',
        capabilities: ['chat', 'coding', 'reasoning'],
        contextWindow: 32000,
        costPer1kTokens: 0.0005,
        averageLatency: 800,
        accuracy: 0.88,
        specializations: ['cost_effective', 'multilingual'],
        mcpEndpoint: 'mcp://mistral/mixtral-8x7b',
        available: true
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        capabilities: ['reasoning', 'multimodal', 'analysis'],
        contextWindow: 32000,
        costPer1kTokens: 0.001,
        averageLatency: 1200,
        accuracy: 0.91,
        specializations: ['multimodal', 'factual_accuracy'],
        mcpEndpoint: 'mcp://google/gemini-pro',
        available: true
      }
    ];

    models.forEach(model => this.llmRegistry.set(model.id, model));
  }

  /**
   * Main processing function - applies reflex rules to route requests
   */
  public async processRequest(request: Request): Promise<any> {
    // Enrich request with computed fields
    const enrichedRequest = this.enrichRequest(request);

    // Check cache first (simple reflex for repeated requests)
    const cacheKey = this.generateCacheKey(request);
    if (this.responseCache.has(cacheKey)) {
      console.log(`Cache hit for request ${request.id}`);
      return this.responseCache.get(cacheKey);
    }

    // Find matching rule
    const matchedRule = this.findMatchingRule(enrichedRequest);
    
    if (!matchedRule) {
      throw new Error('No matching rule found for request');
    }

    console.log(`Request ${request.id} matched rule: ${matchedRule.id}`);

    // Execute action
    const response = await this.executeAction(matchedRule.action, enrichedRequest);

    // Cache response for future use
    this.responseCache.set(cacheKey, response);

    // Update metrics
    this.updateMetrics(request, matchedRule, response);

    return response;
  }

  /**
   * Enrich request with computed fields for rule matching
   */
  private enrichRequest(request: Request): any {
    const enriched = { ...request };
    
    // Calculate context length
    if (request.context) {
      enriched.context_length = request.context.join('').length;
    } else {
      enriched.context_length = 0;
    }

    // Add timestamp
    enriched.timestamp = Date.now();

    return enriched;
  }

  /**
   * Find the first matching rule based on conditions
   */
  private findMatchingRule(request: any): ReflexRule | null {
    for (const rule of this.rules) {
      if (this.evaluateConditions(rule.conditions, request)) {
        // Check if the target LLM is available
        if (rule.action.targetLLM) {
          const llm = this.llmRegistry.get(rule.action.targetLLM);
          if (!llm?.available && rule.fallback) {
            // Use fallback rule if primary LLM is unavailable
            return this.rules.find(r => r.id === rule.fallback) || null;
          }
        }
        return rule;
      }
    }
    return null;
  }

  /**
   * Evaluate all conditions for a rule
   */
  private evaluateConditions(conditions: Condition[], request: any): boolean {
    if (conditions.length === 0) return true; // No conditions means always match

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(request, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Get nested field value from request object
   */
  private getFieldValue(obj: any, field: string): any {
    const fields = field.split('.');
    let value = obj;
    
    for (const f of fields) {
      value = value?.[f];
      if (value === undefined) break;
    }
    
    return value;
  }

  /**
   * Execute the action specified by the matched rule
   */
  private async executeAction(action: Action, request: any): Promise<any> {
    switch (action.type) {
      case 'route_to_llm':
        return this.routeToSingleLLM(action.targetLLM!, request);
      
      case 'multi_llm':
        return this.routeToMultipleLLMs(action.targetLLMs!, request, action.parameters);
      
      case 'cache_lookup':
        return this.performCacheLookup(request);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Route request to a single LLM via MCP
   */
  private async routeToSingleLLM(llmId: string, request: any): Promise<any> {
    const llm = this.llmRegistry.get(llmId);
    if (!llm) {
      throw new Error(`LLM ${llmId} not found in registry`);
    }

    console.log(`Routing to ${llm.name} via ${llm.mcpEndpoint}`);
    
    // Simulate MCP call (in real implementation, this would use actual MCP client)
    const response = await this.callMCPEndpoint(llm.mcpEndpoint, request);
    
    return {
      llmUsed: llm.name,
      response: response,
      latency: llm.averageLatency,
      cost: this.calculateCost(request, llm)
    };
  }

  /**
   * Route request to multiple LLMs for consensus or comparison
   */
  private async routeToMultipleLLMs(
    llmIds: string[], 
    request: any, 
    parameters?: any
  ): Promise<any> {
    const promises = llmIds.map(llmId => this.routeToSingleLLM(llmId, request));
    const responses = await Promise.all(promises);

    if (parameters?.strategy === 'consensus') {
      return this.buildConsensusResponse(responses);
    }

    return {
      llmsUsed: responses.map(r => r.llmUsed),
      responses: responses,
      strategy: parameters?.strategy || 'parallel'
    };
  }

  /**
   * Perform cache lookup (simplified)
   */
  private async performCacheLookup(request: any): Promise<any> {
    const cacheKey = this.generateCacheKey(request);
    return this.responseCache.get(cacheKey) || null;
  }

  /**
   * Simulate MCP endpoint call
   */
  private async callMCPEndpoint(endpoint: string, request: any): Promise<any> {
    // In real implementation, this would:
    // 1. Establish MCP connection
    // 2. Send request through MCP protocol
    // 3. Handle response and errors
    
    return {
      content: `Response from ${endpoint} for request: ${request.content}`,
      tokens: Math.floor(request.content.length / 4),
      timestamp: Date.now()
    };
  }

  /**
   * Build consensus response from multiple LLM responses
   */
  private buildConsensusResponse(responses: any[]): any {
    // Simple consensus: return most common response or aggregate
    // In real implementation, this would be more sophisticated
    
    return {
      consensus: true,
      llmsUsed: responses.map(r => r.llmUsed),
      aggregatedResponse: responses[0].response, // Simplified
      confidence: 0.95
    };
  }

  /**
   * Calculate cost for using an LLM
   */
  private calculateCost(request: any, llm: LLMProfile): number {
    const tokens = Math.floor((request.content?.length || 0) / 4);
    return (tokens / 1000) * llm.costPer1kTokens;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: Request): string {
    return `${request.type}_${request.content.substring(0, 50)}_${JSON.stringify(request.constraints)}`;
  }

  /**
   * Update metrics for monitoring and rule improvement
   */
  private updateMetrics(request: Request, rule: ReflexRule, response: any): void {
    const ruleMetrics = this.metrics.get(rule.id) || {
      uses: 0,
      totalLatency: 0,
      totalCost: 0,
      errors: 0
    };

    ruleMetrics.uses++;
    ruleMetrics.totalLatency += response.latency || 0;
    ruleMetrics.totalCost += response.cost || 0;

    this.metrics.set(rule.id, ruleMetrics);
  }

  /**
   * Get current metrics for monitoring
   */
  public getMetrics(): any {
    const metricsArray = Array.from(this.metrics.entries()).map(([ruleId, metrics]) => ({
      ruleId,
      ...metrics,
      averageLatency: metrics.totalLatency / metrics.uses,
      averageCost: metrics.totalCost / metrics.uses
    }));

    return {
      rules: metricsArray,
      cacheHitRate: this.calculateCacheHitRate(),
      totalRequests: metricsArray.reduce((sum, m) => sum + m.uses, 0)
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // Simplified - in real implementation would track hits vs misses
    return this.responseCache.size > 0 ? 0.3 : 0;
  }

  /**
   * Add or update a rule dynamically
   */
  public addRule(rule: ReflexRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a rule
   */
  public removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== ruleId);
    return this.rules.length < initialLength;
  }

  /**
   * Update LLM availability
   */
  public updateLLMAvailability(llmId: string, available: boolean): void {
    const llm = this.llmRegistry.get(llmId);
    if (llm) {
      llm.available = available;
    }
  }
}

// Export types for external use
export type { Request, LLMProfile, ReflexRule, Condition, Action };