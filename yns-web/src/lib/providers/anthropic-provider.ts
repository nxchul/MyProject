/**
 * Anthropic Claude MCP Provider Implementation
 */

import { MCPProvider, MCPMessage, MCPResponse, MCPGenerationOptions, MCPCapabilities, TaskType } from '../mcp-interface';

export class AnthropicProvider implements MCPProvider {
  name = 'anthropic';
  models = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'];
  
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.status !== 401; // Not unauthorized
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
      // Convert system messages to Claude format
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      const body = {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        messages: conversationMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        ...(systemMessages.length > 0 && {
          system: systemMessages.map(m => m.content).join('\n')
        })
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Anthropic API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      const content = data.content[0]?.text || '';

      return {
        content,
        provider: this.name,
        model: options.model || 'claude-3-5-sonnet-20241022',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        latency,
        confidence: this.calculateConfidence(content, data.stop_reason)
      };
    } catch (error) {
      throw new Error(`Anthropic API Error: ${error}`);
    }
  }

  getCapabilities(): MCPCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsCodeGeneration: true,
      maxContextLength: 200000,
      costPerToken: 0.00025, // Approximate for Claude 3.5 Sonnet
      avgLatencyMs: 2000,
    };
  }

  private calculateConfidence(content: string, stopReason?: string): number {
    if (stopReason === 'end_turn' && content.length > 10) {
      return 0.90; // Claude is generally more confident in complete responses
    }
    if (stopReason === 'max_tokens') {
      return 0.70; // Truncated response
    }
    return 0.80; // Default confidence
  }

  static getBestModelForTask(taskType: TaskType): string {
    switch (taskType) {
      case TaskType.CREATIVE_WRITING:
      case TaskType.TECHNICAL_ANALYSIS:
        return 'claude-3-5-sonnet-20241022'; // Best for complex reasoning
      case TaskType.CODE_GENERATION:
        return 'claude-3-5-sonnet-20241022';
      case TaskType.GENERAL_QA:
      case TaskType.SUMMARIZATION:
      case TaskType.TRANSLATION:
      default:
        return 'claude-3-haiku-20240307'; // Faster and more cost-effective
    }
  }
}