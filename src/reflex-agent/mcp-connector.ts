/**
 * MCP Connector for Reflex Agent
 * Handles the actual Model Context Protocol connections and communications
 */

import { EventEmitter } from 'events';

interface MCPConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}

interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'error';
  model?: string;
  content: any;
  metadata?: Record<string, any>;
}

/**
 * MCP Connector class for handling Model Context Protocol communications
 */
export class MCPConnector extends EventEmitter {
  private connections: Map<string, WebSocket | any> = new Map();
  private configs: Map<string, MCPConfig> = new Map();
  private messageQueue: Map<string, MCPMessage[]> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Register an MCP endpoint
   */
  public registerEndpoint(id: string, config: MCPConfig): void {
    this.configs.set(id, config);
    this.establishConnection(id);
  }

  /**
   * Establish connection to an MCP endpoint
   */
  private async establishConnection(endpointId: string): Promise<void> {
    const config = this.configs.get(endpointId);
    if (!config) {
      throw new Error(`No configuration found for endpoint ${endpointId}`);
    }

    try {
      // In a real implementation, this would establish actual WebSocket or HTTP connection
      // For now, we'll simulate the connection
      const connection = this.createMockConnection(endpointId, config);
      
      this.connections.set(endpointId, connection);
      
      // Process any queued messages
      this.processQueuedMessages(endpointId);
      
      this.emit('connected', { endpoint: endpointId });
      console.log(`Connected to MCP endpoint: ${endpointId}`);
    } catch (error) {
      console.error(`Failed to connect to ${endpointId}:`, error);
      this.scheduleReconnect(endpointId);
    }
  }

  /**
   * Create a mock connection for demonstration
   */
  private createMockConnection(endpointId: string, config: MCPConfig): any {
    return {
      id: endpointId,
      config: config,
      isConnected: true,
      send: (message: MCPMessage) => {
        // Simulate async message sending
        setTimeout(() => {
          this.handleMockResponse(endpointId, message);
        }, Math.random() * 1000 + 500);
      },
      close: () => {
        console.log(`Connection closed: ${endpointId}`);
      }
    };
  }

  /**
   * Send a request through MCP
   */
  public async sendRequest(
    endpointId: string, 
    request: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const message: MCPMessage = {
        id: messageId,
        type: 'request',
        content: request,
        metadata: {
          timestamp: Date.now(),
          endpointId
        }
      };

      const connection = this.connections.get(endpointId);
      
      if (!connection?.isConnected) {
        // Queue message if not connected
        this.queueMessage(endpointId, message);
        
        // Set up listener for response
        this.once(`response_${messageId}`, (response) => {
          resolve(response);
        });
        
        this.once(`error_${messageId}`, (error) => {
          reject(error);
        });
        
        return;
      }

      // Send message
      connection.send(message);

      // Set up response handlers
      this.once(`response_${messageId}`, (response) => {
        resolve(response);
      });

      this.once(`error_${messageId}`, (error) => {
        reject(error);
      });

      // Timeout handling
      const timeout = this.configs.get(endpointId)?.timeout || 30000;
      setTimeout(() => {
        reject(new Error(`Request timeout for ${endpointId}`));
      }, timeout);
    });
  }

  /**
   * Handle mock response for demonstration
   */
  private handleMockResponse(endpointId: string, request: MCPMessage): void {
    // Simulate different types of responses based on endpoint
    const responseContent = this.generateMockResponse(endpointId, request.content);
    
    const response: MCPMessage = {
      id: request.id,
      type: 'response',
      content: responseContent,
      metadata: {
        timestamp: Date.now(),
        endpointId,
        processingTime: Math.random() * 2000
      }
    };

    this.emit(`response_${request.id}`, response);
  }

  /**
   * Generate mock response based on endpoint type
   */
  private generateMockResponse(endpointId: string, request: any): any {
    const endpointType = endpointId.split('/')[1]; // Extract model type from endpoint
    
    const responses: Record<string, any> = {
      'gpt-4-turbo': {
        text: `GPT-4 Turbo response to: ${request.content}`,
        reasoning: 'Advanced reasoning applied',
        confidence: 0.95
      },
      'gpt-3.5-turbo': {
        text: `GPT-3.5 Turbo quick response to: ${request.content}`,
        confidence: 0.85
      },
      'claude-3-opus': {
        text: `Claude 3 Opus thoughtful analysis of: ${request.content}`,
        analysis_depth: 'comprehensive',
        confidence: 0.94
      },
      'codellama-70b': {
        code: `# Code Llama response\ndef solution():\n    # Implementation for: ${request.content}\n    pass`,
        language: 'python',
        confidence: 0.92
      },
      'mixtral-8x7b': {
        text: `Mixtral efficient response: ${request.content}`,
        tokens_used: 150,
        confidence: 0.88
      },
      'gemini-pro': {
        text: `Gemini Pro factual response to: ${request.content}`,
        sources: ['source1', 'source2'],
        confidence: 0.91
      }
    };

    return responses[endpointType] || { text: `Generic response from ${endpointId}` };
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(endpointId: string, message: MCPMessage): void {
    if (!this.messageQueue.has(endpointId)) {
      this.messageQueue.set(endpointId, []);
    }
    this.messageQueue.get(endpointId)!.push(message);
    console.log(`Message queued for ${endpointId}. Queue size: ${this.messageQueue.get(endpointId)!.length}`);
  }

  /**
   * Process queued messages after connection is established
   */
  private processQueuedMessages(endpointId: string): void {
    const queue = this.messageQueue.get(endpointId);
    if (!queue || queue.length === 0) return;

    const connection = this.connections.get(endpointId);
    if (!connection?.isConnected) return;

    console.log(`Processing ${queue.length} queued messages for ${endpointId}`);
    
    queue.forEach(message => {
      connection.send(message);
    });

    this.messageQueue.set(endpointId, []);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(endpointId: string): void {
    // Clear existing timer if any
    const existingTimer = this.reconnectTimers.get(endpointId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      console.log(`Attempting to reconnect to ${endpointId}`);
      this.establishConnection(endpointId);
    }, 5000); // Retry after 5 seconds

    this.reconnectTimers.set(endpointId, timer);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('MCP Connector error:', error);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      this.closeAllConnections();
      process.exit(0);
    });
  }

  /**
   * Close all connections
   */
  public closeAllConnections(): void {
    this.connections.forEach((connection, endpointId) => {
      if (connection.close) {
        connection.close();
      }
      console.log(`Closed connection: ${endpointId}`);
    });
    
    this.connections.clear();
    
    // Clear all timers
    this.reconnectTimers.forEach(timer => clearTimeout(timer));
    this.reconnectTimers.clear();
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    this.connections.forEach((connection, endpointId) => {
      status.set(endpointId, connection.isConnected || false);
    });
    return status;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): Map<string, number> {
    const status = new Map<string, number>();
    this.messageQueue.forEach((queue, endpointId) => {
      status.set(endpointId, queue.length);
    });
    return status;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for all endpoints
   */
  public async healthCheck(): Promise<Map<string, any>> {
    const health = new Map<string, any>();
    
    for (const [endpointId, connection] of this.connections.entries()) {
      const startTime = Date.now();
      
      try {
        // Send ping request
        const response = await this.sendRequest(endpointId, {
          type: 'ping',
          timestamp: startTime
        });
        
        health.set(endpointId, {
          status: 'healthy',
          latency: Date.now() - startTime,
          connected: connection.isConnected
        });
      } catch (error) {
        health.set(endpointId, {
          status: 'unhealthy',
          error: error.message,
          connected: false
        });
      }
    }
    
    return health;
  }
}

/**
 * Factory function to create MCP connector with pre-configured endpoints
 */
export function createMCPConnector(endpoints: Record<string, MCPConfig>): MCPConnector {
  const connector = new MCPConnector();
  
  Object.entries(endpoints).forEach(([id, config]) => {
    connector.registerEndpoint(id, config);
  });
  
  return connector;
}

// Export types
export type { MCPConfig, MCPMessage };