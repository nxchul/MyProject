export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  subcategories?: ServiceCategory[];
}

export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  attachments?: string[];
}

export interface MPWShuttle {
  id: string;
  name: string;
  process: string;
  tapeOutDate: Date;
  deliveryDate: Date;
  minSize: string;
  maxDieCount: number;
  status: 'open' | 'closed' | 'in-progress';
}

export interface ProcessInfo {
  name: string;
  voltage: string;
  devices: string[];
  features: string[];
}