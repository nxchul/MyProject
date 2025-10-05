/**
 * Model Context Protocol (MCP) Interface
 * 
 * This module provides a unified interface for connecting to multiple LLM providers
 * through a standardized protocol, enabling seamless switching and load balancing.
 */

export interface MCPMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface MCPResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
  confidence?: number;
}

export interface MCPProvider {
  name: string;
  models: string[];
  isAvailable(): Promise<boolean>;
  generateResponse(
    messages: MCPMessage[],
    options?: MCPGenerationOptions
  ): Promise<MCPResponse>;
  getCapabilities(): MCPCapabilities;
}

export interface MCPGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeout?: number;
}

export interface MCPCapabilities {
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsCodeGeneration: boolean;
  maxContextLength: number;
  costPerToken: number;
  avgLatencyMs: number;
}

export enum TaskType {
  GENERAL_QA = 'general_qa',
  CODE_GENERATION = 'code_generation', 
  CREATIVE_WRITING = 'creative_writing',
  TECHNICAL_ANALYSIS = 'technical_analysis',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  MATH_REASONING = 'math_reasoning'
}

export interface QueryContext {
  taskType: TaskType;
  complexity: 'simple' | 'medium' | 'complex';
  domain: string;
  userPreferences?: {
    preferredProvider?: string;
    maxLatency?: number;
    prioritizeCost?: boolean;
  };
}