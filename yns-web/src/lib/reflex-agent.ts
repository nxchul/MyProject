/**
 * Reflex Agent + MCP Integration for YNS Platform
 * Provides intelligent LLM routing and orchestration
 */

export interface LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  capabilities: string[];
  costPerToken: number;
}

export interface MCPMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  query: string;
  queryType: string;
  llmUsed: string;
  response: string;
  metadata: {
    provider: string;
    model: string;
    conversationLength: number;
    cost?: number;
    fallback?: boolean;
  };
}

export class YNSReflexAgent {
  private llmProviders: Map<string, LLMProvider> = new Map();
  private conversationHistory: MCPMessage[] = [];
  private routingRules: Record<string, string> = {
    technical: 'claude',
    general: 'gpt4',
    creative: 'gemini',
    code: 'gpt4',
    analysis: 'claude',
    mpw: 'claude',
    pdk: 'claude',
    crypto: 'gpt4'
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Register LLM providers
    this.llmProviders.set('gpt4', {
      name: 'gpt4',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY || '',
      capabilities: ['general', 'code', 'analysis', 'crypto'],
      costPerToken: 0.00003
    });

    this.llmProviders.set('claude', {
      name: 'claude',
      model: 'claude-3-sonnet',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      capabilities: ['technical', 'analysis', 'mpw', 'pdk'],
      costPerToken: 0.000015
    });

    this.llmProviders.set('gemini', {
      name: 'gemini',
      model: 'gemini-pro',
      apiKey: process.env.GOOGLE_API_KEY || '',
      capabilities: ['creative', 'general'],
      costPerToken: 0.00001
    });
  }

  private classifyQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    // YNS-specific technical terms
    if (queryLower.includes('mpw') || queryLower.includes('shuttle') || 
        queryLower.includes('wafer') || queryLower.includes('mask')) {
      return 'mpw';
    }
    
    if (queryLower.includes('pdk') || queryLower.includes('dk') || 
        queryLower.includes('process') || queryLower.includes('design kit')) {
      return 'pdk';
    }
    
    if (queryLower.includes('crypto') || queryLower.includes('bitcoin') || 
        queryLower.includes('portfolio') || queryLower.includes('investment')) {
      return 'crypto';
    }
    
    // General technical terms
    if (queryLower.includes('gds') || queryLower.includes('layout') || 
        queryLower.includes('semiconductor') || queryLower.includes('chip')) {
      return 'technical';
    }
    
    // Code-related terms
    if (queryLower.includes('code') || queryLower.includes('programming') || 
        queryLower.includes('api') || queryLower.includes('function')) {
      return 'code';
    }
    
    // Creative terms
    if (queryLower.includes('design') || queryLower.includes('creative') || 
        queryLower.includes('idea') || queryLower.includes('solution')) {
      return 'creative';
    }
    
    // Analysis terms
    if (queryLower.includes('analyze') || queryLower.includes('compare') || 
        queryLower.includes('evaluate') || queryLower.includes('assess')) {
      return 'analysis';
    }
    
    return 'general';
  }

  private createSystemPrompt(queryType: string): string {
    const basePrompt = "You are an AI assistant for YNS, a TSMC Design House. ";
    
    const prompts: Record<string, string> = {
      mpw: basePrompt + `
        You specialize in MPW (Multi-Project Wafer) services and shuttle management.
        Provide detailed information about shuttle schedules, wafer delivery, 
        mask information, and MPW project management processes.
        Be precise and technical in your responses about semiconductor manufacturing.
      `,
      
      pdk: basePrompt + `
        You specialize in PDK (Process Design Kit) and DK (Design Kit) services.
        Help with NDA processes, design kit requests, process information,
        and technical specifications. Provide accurate technical details.
      `,
      
      technical: basePrompt + `
        You specialize in semiconductor design and manufacturing processes.
        Provide detailed technical information about GDS files, layout design,
        process technologies, and other semiconductor-related topics.
        Be precise and technical in your responses.
      `,
      
      crypto: basePrompt + `
        You help with cryptocurrency investment tools and portfolio analysis.
        Provide information about average cost calculation, investment strategies,
        and financial analysis tools available on the YNS platform.
      `,
      
      general: basePrompt + `
        You help with general business inquiries about YNS services.
        Be helpful, professional, and provide clear information about our services.
      `,
      
      creative: basePrompt + `
        You help with creative problem-solving and innovative approaches.
        Think outside the box and provide creative solutions for design challenges.
      `,
      
      code: basePrompt + `
        You help with programming and technical implementation.
        Provide clean, well-documented code examples and technical solutions.
      `,
      
      analysis: basePrompt + `
        You specialize in detailed analysis and evaluation.
        Provide thorough, data-driven analysis with clear conclusions and recommendations.
      `
    };
    
    return prompts[queryType] || prompts.general;
  }

  private async callLLM(providerName: string, messages: MCPMessage[]): Promise<string> {
    const provider = this.llmProviders.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      if (provider.name === 'gpt4') {
        return await this.callOpenAI(provider, formattedMessages);
      } else if (provider.name === 'claude') {
        return await this.callAnthropic(provider, formattedMessages);
      } else if (provider.name === 'gemini') {
        return await this.callGoogle(provider, formattedMessages);
      } else {
        throw new Error(`Unsupported provider: ${provider.name}`);
      }
    } catch (error) {
      console.error(`Error calling ${providerName}:`, error);
      throw error;
    }
  }

  private async callOpenAI(provider: LLMProvider, messages: any[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(provider: LLMProvider, messages: any[]): Promise<string> {
    // Extract system and user messages
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.find(m => m.role === 'user')?.content || '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1000,
        system: systemMsg,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callGoogle(provider: LLMProvider, messages: any[]): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: messages.map(msg => ({ text: msg.content }))
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async processQuery(userQuery: string): Promise<AgentResponse> {
    // Add user message to history
    const userMessage: MCPMessage = {
      role: 'user',
      content: userQuery
    };
    this.conversationHistory.push(userMessage);

    // Classify query and select LLM
    const queryType = this.classifyQuery(userQuery);
    const llmName = this.routingRules[queryType] || 'gpt4';

    console.log(`Routing query to ${llmName} (type: ${queryType})`);

    // Create system prompt
    const systemPrompt = this.createSystemPrompt(queryType);
    const systemMessage: MCPMessage = {
      role: 'system',
      content: systemPrompt
    };

    // Prepare messages (last 10 for context)
    const messages = [systemMessage, ...this.conversationHistory.slice(-10)];

    try {
      // Call LLM
      const response = await this.callLLM(llmName, messages);

      // Add assistant response to history
      const assistantMessage: MCPMessage = {
        role: 'assistant',
        content: response
      };
      this.conversationHistory.push(assistantMessage);

      const provider = this.llmProviders.get(llmName)!;

      return {
        query: userQuery,
        queryType: queryType,
        llmUsed: llmName,
        response: response,
        metadata: {
          provider: provider.name,
          model: provider.model,
          conversationLength: this.conversationHistory.length,
          cost: this.estimateCost(response, provider.costPerToken)
        }
      };

    } catch (error) {
      console.error('Error processing query:', error);
      
      // Fallback to GPT-4 if not already using it
      if (llmName !== 'gpt4') {
        console.log('Falling back to GPT-4');
        return await this.processQueryWithFallback(userQuery);
      } else {
        throw error;
      }
    }
  }

  private async processQueryWithFallback(userQuery: string): Promise<AgentResponse> {
    const messages: MCPMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant for YNS TSMC Design House.'
      },
      {
        role: 'user',
        content: userQuery
      }
    ];

    const response = await this.callLLM('gpt4', messages);
    
    return {
      query: userQuery,
      queryType: 'fallback',
      llmUsed: 'gpt4',
      response: response,
      metadata: {
        provider: 'gpt4',
        model: 'gpt-4',
        conversationLength: this.conversationHistory.length,
        fallback: true
      }
    };
  }

  private estimateCost(response: string, costPerToken: number): number {
    // Rough estimation: 1 token ≈ 4 characters
    const estimatedTokens = response.length / 4;
    return estimatedTokens * costPerToken;
  }

  getConversationHistory(): MCPMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getLLMStatus(): Record<string, any> {
    return {
      registeredLLMs: Array.from(this.llmProviders.keys()),
      conversationLength: this.conversationHistory.length,
      routingRules: this.routingRules
    };
  }
}

// Export singleton instance
export const ynsReflexAgent = new YNSReflexAgent();