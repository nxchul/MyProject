/**
 * Google Gemini MCP Provider Implementation
 */

import { MCPProvider, MCPMessage, MCPResponse, MCPGenerationOptions, MCPCapabilities, TaskType } from '../mcp-interface';

export class GoogleProvider implements MCPProvider {
  name = 'google';
  models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
  
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 1 }
          })
        }
      );
      return response.status !== 401;
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
      const model = options.model || 'gemini-1.5-flash';
      
      // Convert messages to Gemini format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      // Add system instruction if present
      const systemMessages = messages.filter(m => m.role === 'system');
      const systemInstruction = systemMessages.length > 0 ? {
        systemInstruction: {
          parts: [{ text: systemMessages.map(m => m.content).join('\n') }]
        }
      } : {};

      const body = {
        contents,
        ...systemInstruction,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000,
        }
      };

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`Google API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        provider: this.name,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
        latency,
        confidence: this.calculateConfidence(content, data.candidates?.[0]?.finishReason)
      };
    } catch (error) {
      throw new Error(`Google API Error: ${error}`);
    }
  }

  getCapabilities(): MCPCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsCodeGeneration: true,
      maxContextLength: 1048576, // 1M tokens for Gemini 1.5
      costPerToken: 0.000125, // Approximate for Gemini 1.5 Flash
      avgLatencyMs: 1800,
    };
  }

  private calculateConfidence(content: string, finishReason?: string): number {
    if (finishReason === 'STOP' && content.length > 10) {
      return 0.85;
    }
    if (finishReason === 'MAX_TOKENS') {
      return 0.65;
    }
    return 0.75;
  }

  static getBestModelForTask(taskType: TaskType): string {
    switch (taskType) {
      case TaskType.CODE_GENERATION:
      case TaskType.MATH_REASONING:
      case TaskType.TECHNICAL_ANALYSIS:
        return 'gemini-1.5-pro'; // Best for complex reasoning
      case TaskType.GENERAL_QA:
      case TaskType.SUMMARIZATION:
      case TaskType.TRANSLATION:
      case TaskType.CREATIVE_WRITING:
      default:
        return 'gemini-1.5-flash'; // Faster and more cost-effective
    }
  }
}