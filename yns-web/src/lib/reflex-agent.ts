/**
 * Reflex Agent Core - Implements a simple reflex agent architecture for LLM routing
 * 
 * A reflex agent follows the perception-action cycle:
 * 1. Perceive: Analyze incoming user query
 * 2. Decide: Apply condition-action rules to select optimal LLM
 * 3. Act: Route request to selected LLM and return response
 */

import { 
  MCPProvider, 
  MCPMessage, 
  MCPResponse, 
  TaskType, 
  QueryContext, 
  MCPGenerationOptions 
} from './mcp-interface';
import { QueryAnalyzer } from './query-analyzer';
import { OpenAIProvider } from './providers/openai-provider';
import { AnthropicProvider } from './providers/anthropic-provider';
import { GoogleProvider } from './providers/google-provider';

interface ReflexRule {
  condition: (context: QueryContext, providers: MCPProvider[]) => boolean;
  action: (context: QueryContext, providers: MCPProvider[]) => {
    provider: MCPProvider;
    model?: string;
    options?: MCPGenerationOptions;
  };
  priority: number;
  description: string;
}

interface RoutingMetrics {
  totalRequests: number;
  providerUsage: Record<string, number>;
  avgLatency: Record<string, number>;
  errorRates: Record<string, number>;
  taskTypeRouting: Record<TaskType, string[]>;
}

export class ReflexAgent {
  private providers: Map<string, MCPProvider> = new Map();
  private rules: ReflexRule[] = [];
  private metrics: RoutingMetrics = {
    totalRequests: 0,
    providerUsage: {},
    avgLatency: {},
    errorRates: {},
    taskTypeRouting: {} as Record<TaskType, string[]>
  };

  constructor() {
    this.initializeDefaultRules();
  }

  // Provider Management
  async addProvider(provider: MCPProvider): Promise<void> {
    if (await provider.isAvailable()) {
      this.providers.set(provider.name, provider);
      this.metrics.providerUsage[provider.name] = 0;
      this.metrics.avgLatency[provider.name] = 0;
      this.metrics.errorRates[provider.name] = 0;
      console.log(`✅ Added provider: ${provider.name}`);
    } else {
      console.warn(`⚠️ Provider ${provider.name} is not available`);
    }
  }

  removeProvider(providerName: string): void {
    this.providers.delete(providerName);
    delete this.metrics.providerUsage[providerName];
    delete this.metrics.avgLatency[providerName];
    delete this.metrics.errorRates[providerName];
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Rule Management
  addRule(rule: ReflexRule): void {
    this.rules.push(rule);
    // Sort rules by priority (higher priority first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  // Main Agent Logic: Perception -> Decision -> Action
  async processQuery(
    messages: MCPMessage[],
    userPreferences?: QueryContext['userPreferences']
  ): Promise<MCPResponse> {
    this.metrics.totalRequests++;

    // 1. PERCEPTION: Analyze the user's query
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    const queryContext = QueryAnalyzer.analyzeQuery(lastUserMessage.content);
    if (userPreferences) {
      queryContext.userPreferences = userPreferences;
    }

    console.log(`🧠 Perceived query context:`, queryContext);

    // 2. DECISION: Apply reflex rules to select optimal provider
    const routing = this.selectProvider(queryContext);
    console.log(`🎯 Selected provider: ${routing.provider.name} (${routing.model})`);

    // 3. ACTION: Execute the selected action
    try {
      const response = await routing.provider.generateResponse(
        messages, 
        { 
          model: routing.model,
          ...routing.options 
        }
      );

      // Update metrics
      this.updateMetrics(routing.provider.name, response.latency, false, queryContext.taskType);

      return response;
    } catch (error) {
      // Update error metrics
      this.updateMetrics(routing.provider.name, 0, true, queryContext.taskType);
      
      // Fallback to alternative provider
      const fallbackRouting = this.selectFallbackProvider(queryContext, routing.provider.name);
      if (fallbackRouting) {
        console.log(`🔄 Falling back to: ${fallbackRouting.provider.name}`);
        try {
          const response = await fallbackRouting.provider.generateResponse(messages, {
            model: fallbackRouting.model,
            ...fallbackRouting.options
          });
          this.updateMetrics(fallbackRouting.provider.name, response.latency, false, queryContext.taskType);
          return response;
        } catch (fallbackError) {
          this.updateMetrics(fallbackRouting.provider.name, 0, true, queryContext.taskType);
        }
      }
      
      throw error;
    }
  }

  // Decision Logic: Apply condition-action rules
  private selectProvider(context: QueryContext): {
    provider: MCPProvider;
    model?: string;
    options?: MCPGenerationOptions;
  } {
    const availableProviders = Array.from(this.providers.values());

    // Apply rules in priority order
    for (const rule of this.rules) {
      if (rule.condition(context, availableProviders)) {
        console.log(`📋 Applied rule: ${rule.description}`);
        return rule.action(context, availableProviders);
      }
    }

    // Default fallback
    const defaultProvider = availableProviders[0];
    if (!defaultProvider) {
      throw new Error('No providers available');
    }

    return {
      provider: defaultProvider,
      model: this.getBestModelForProvider(defaultProvider, context.taskType)
    };
  }

  private selectFallbackProvider(
    context: QueryContext, 
    excludeProvider: string
  ): { provider: MCPProvider; model?: string; options?: MCPGenerationOptions } | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.name !== excludeProvider);

    if (availableProviders.length === 0) return null;

    // Select provider with lowest error rate
    const bestProvider = availableProviders.reduce((best, current) => {
      const bestErrorRate = this.metrics.errorRates[best.name] || 0;
      const currentErrorRate = this.metrics.errorRates[current.name] || 0;
      return currentErrorRate < bestErrorRate ? current : best;
    });

    return {
      provider: bestProvider,
      model: this.getBestModelForProvider(bestProvider, context.taskType)
    };
  }

  private getBestModelForProvider(provider: MCPProvider, taskType: TaskType): string | undefined {
    // Use provider-specific model selection if available
    switch (provider.name) {
      case 'openai':
        return OpenAIProvider.getBestModelForTask(taskType);
      case 'anthropic':
        return AnthropicProvider.getBestModelForTask(taskType);
      case 'google':
        return GoogleProvider.getBestModelForTask(taskType);
      default:
        return provider.models[0];
    }
  }

  // Initialize default reflex rules
  private initializeDefaultRules(): void {
    // Rule 1: User preference override (highest priority)
    this.addRule({
      condition: (context, providers) => {
        return !!(context.userPreferences?.preferredProvider && 
                 providers.some(p => p.name === context.userPreferences!.preferredProvider));
      },
      action: (context, providers) => {
        const preferredProvider = providers.find(
          p => p.name === context.userPreferences!.preferredProvider
        )!;
        return {
          provider: preferredProvider,
          model: this.getBestModelForProvider(preferredProvider, context.taskType)
        };
      },
      priority: 100,
      description: 'User preferred provider'
    });

    // Rule 2: Low latency requirement
    this.addRule({
      condition: (context, providers) => {
        return !!(context.userPreferences?.maxLatency && context.userPreferences.maxLatency < 2000);
      },
      action: (context, providers) => {
        // Select fastest provider based on capabilities
        const fastestProvider = providers.reduce((fastest, current) => {
          return current.getCapabilities().avgLatencyMs < fastest.getCapabilities().avgLatencyMs 
            ? current : fastest;
        });
        return {
          provider: fastestProvider,
          model: this.getBestModelForProvider(fastestProvider, context.taskType),
          options: { temperature: 0.3 } // Lower temperature for faster responses
        };
      },
      priority: 80,
      description: 'Low latency requirement'
    });

    // Rule 3: Complex reasoning tasks -> Claude
    this.addRule({
      condition: (context, providers) => {
        return context.complexity === 'complex' && 
               (context.taskType === TaskType.TECHNICAL_ANALYSIS || 
                context.taskType === TaskType.MATH_REASONING) &&
               providers.some(p => p.name === 'anthropic');
      },
      action: (context, providers) => {
        const claudeProvider = providers.find(p => p.name === 'anthropic')!;
        return {
          provider: claudeProvider,
          model: 'claude-3-5-sonnet-20241022',
          options: { temperature: 0.2 }
        };
      },
      priority: 70,
      description: 'Complex reasoning -> Claude'
    });

    // Rule 4: Code generation -> OpenAI GPT-4
    this.addRule({
      condition: (context, providers) => {
        return context.taskType === TaskType.CODE_GENERATION && 
               providers.some(p => p.name === 'openai');
      },
      action: (context, providers) => {
        const openaiProvider = providers.find(p => p.name === 'openai')!;
        return {
          provider: openaiProvider,
          model: 'gpt-4o',
          options: { temperature: 0.1 }
        };
      },
      priority: 60,
      description: 'Code generation -> GPT-4'
    });

    // Rule 5: Creative writing -> Claude or GPT-4
    this.addRule({
      condition: (context, providers) => {
        return context.taskType === TaskType.CREATIVE_WRITING;
      },
      action: (context, providers) => {
        // Prefer Claude for creative tasks, fallback to OpenAI
        const claudeProvider = providers.find(p => p.name === 'anthropic');
        if (claudeProvider) {
          return {
            provider: claudeProvider,
            model: 'claude-3-5-sonnet-20241022',
            options: { temperature: 0.8 }
          };
        }
        
        const openaiProvider = providers.find(p => p.name === 'openai')!;
        return {
          provider: openaiProvider,
          model: 'gpt-4o',
          options: { temperature: 0.8 }
        };
      },
      priority: 50,
      description: 'Creative writing -> Claude/GPT-4'
    });

    // Rule 6: Cost optimization for simple tasks
    this.addRule({
      condition: (context, providers) => {
        return context.complexity === 'simple' && 
               (context.userPreferences?.prioritizeCost !== false);
      },
      action: (context, providers) => {
        // Select most cost-effective provider
        const cheapestProvider = providers.reduce((cheapest, current) => {
          return current.getCapabilities().costPerToken < cheapest.getCapabilities().costPerToken 
            ? current : cheapest;
        });
        
        return {
          provider: cheapestProvider,
          model: this.getBestModelForProvider(cheapestProvider, context.taskType)
        };
      },
      priority: 30,
      description: 'Cost optimization for simple tasks'
    });

    // Rule 7: Load balancing based on recent usage
    this.addRule({
      condition: (context, providers) => {
        return providers.length > 1;
      },
      action: (context, providers) => {
        // Select least used provider for load balancing
        const leastUsedProvider = providers.reduce((leastUsed, current) => {
          const leastUsedCount = this.metrics.providerUsage[leastUsed.name] || 0;
          const currentCount = this.metrics.providerUsage[current.name] || 0;
          return currentCount < leastUsedCount ? current : leastUsed;
        });
        
        return {
          provider: leastUsedProvider,
          model: this.getBestModelForProvider(leastUsedProvider, context.taskType)
        };
      },
      priority: 10,
      description: 'Load balancing'
    });
  }

  // Metrics Management
  private updateMetrics(
    providerName: string, 
    latency: number, 
    isError: boolean, 
    taskType: TaskType
  ): void {
    this.metrics.providerUsage[providerName] = (this.metrics.providerUsage[providerName] || 0) + 1;
    
    if (!isError && latency > 0) {
      const currentAvg = this.metrics.avgLatency[providerName] || 0;
      const usage = this.metrics.providerUsage[providerName];
      this.metrics.avgLatency[providerName] = (currentAvg * (usage - 1) + latency) / usage;
    }
    
    if (isError) {
      this.metrics.errorRates[providerName] = (this.metrics.errorRates[providerName] || 0) + 1;
    }

    // Track task type routing
    if (!this.metrics.taskTypeRouting[taskType]) {
      this.metrics.taskTypeRouting[taskType] = [];
    }
    this.metrics.taskTypeRouting[taskType].push(providerName);
  }

  getMetrics(): RoutingMetrics {
    // Calculate error percentages
    const errorRates: Record<string, number> = {};
    Object.keys(this.metrics.errorRates).forEach(provider => {
      const errors = this.metrics.errorRates[provider];
      const total = this.metrics.providerUsage[provider] || 1;
      errorRates[provider] = (errors / total) * 100;
    });

    return {
      ...this.metrics,
      errorRates
    };
  }

  // Utility method to create a configured agent with common providers
  static async createWithProviders(config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    googleApiKey?: string;
  }): Promise<ReflexAgent> {
    const agent = new ReflexAgent();

    if (config.openaiApiKey) {
      await agent.addProvider(new OpenAIProvider(config.openaiApiKey));
    }

    if (config.anthropicApiKey) {
      await agent.addProvider(new AnthropicProvider(config.anthropicApiKey));
    }

    if (config.googleApiKey) {
      await agent.addProvider(new GoogleProvider(config.googleApiKey));
    }

    return agent;
  }
}