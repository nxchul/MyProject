/**
 * OpenAI MCP Provider Implementation
 */

import OpenAI from 'openai';
import { MCPProvider, MCPMessage, MCPResponse, MCPGenerationOptions, MCPCapabilities, TaskType } from '../mcp-interface';

export class OpenAIProvider implements MCPProvider {
  name = 'openai';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo'];
  
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async generateResponse(
    messages: MCPMessage[], 
    options: MCPGenerationOptions = {}
  ): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });

      const latency = Date.now() - startTime;
      const response = completion.choices[0].message.content || '';

      return {
        content: response,
        provider: this.name,
        model: options.model || 'gpt-4o-mini',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        latency,
        confidence: this.calculateConfidence(response, completion.choices[0].finish_reason)
      };
    } catch (error) {
      throw new Error(`OpenAI API Error: ${error}`);
    }
  }

  getCapabilities(): MCPCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsCodeGeneration: true,
      maxContextLength: 128000,
      costPerToken: 0.00015, // Approximate for gpt-4o-mini
      avgLatencyMs: 1500,
    };
  }

  private calculateConfidence(content: string, finishReason?: string): number {
    // Simple confidence calculation based on response characteristics
    if (finishReason === 'stop' && content.length > 10) {
      return 0.85;
    }
    if (finishReason === 'length') {
      return 0.65; // Truncated response
    }
    return 0.75; // Default confidence
  }

  // Task-specific model selection
  static getBestModelForTask(taskType: TaskType): string {
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        return 'gpt-4o';
      case TaskType.CREATIVE_WRITING:
        return 'gpt-4o';
      case TaskType.MATH_REASONING:
        return 'gpt-4o';
      case TaskType.GENERAL_QA:
      case TaskType.SUMMARIZATION:
      case TaskType.TRANSLATION:
      default:
        return 'gpt-4o-mini'; // More cost-effective for simpler tasks
    }
  }
}