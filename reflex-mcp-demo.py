#!/usr/bin/env python3
"""
Reflex Agent + MCP Demo for YNS Platform
Demonstrates how to construct AI agents that connect various LLMs through MCP
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    LOCAL = "local"

@dataclass
class LLMConfig:
    provider: LLMProvider
    model: str
    api_key: str
    base_url: Optional[str] = None
    capabilities: List[str] = None
    cost_per_token: float = 0.0

@dataclass
class MCPMessage:
    role: str
    content: str
    metadata: Dict[str, Any] = None

class MCPClient:
    """Model Context Protocol Client for connecting to various LLMs"""
    
    def __init__(self):
        self.connections: Dict[str, LLMConfig] = {}
        self.session = httpx.AsyncClient(timeout=30.0)
    
    async def register_llm(self, name: str, config: LLMConfig):
        """Register a new LLM provider"""
        self.connections[name] = config
        logger.info(f"Registered LLM: {name} ({config.provider.value})")
    
    async def send_message(self, llm_name: str, messages: List[MCPMessage]) -> Dict[str, Any]:
        """Send message to specific LLM via MCP"""
        if llm_name not in self.connections:
            raise ValueError(f"LLM {llm_name} not registered")
        
        config = self.connections[llm_name]
        
        # Convert MCP messages to provider-specific format
        formatted_messages = self._format_messages(messages, config.provider)
        
        try:
            response = await self._call_llm(config, formatted_messages)
            return {
                "llm_name": llm_name,
                "response": response,
                "provider": config.provider.value,
                "model": config.model
            }
        except Exception as e:
            logger.error(f"Error calling {llm_name}: {e}")
            raise
    
    def _format_messages(self, messages: List[MCPMessage], provider: LLMProvider) -> List[Dict]:
        """Convert MCP messages to provider-specific format"""
        formatted = []
        for msg in messages:
            formatted.append({
                "role": msg.role,
                "content": msg.content
            })
        return formatted
    
    async def _call_llm(self, config: LLMConfig, messages: List[Dict]) -> str:
        """Make actual API call to LLM"""
        if config.provider == LLMProvider.OPENAI:
            return await self._call_openai(config, messages)
        elif config.provider == LLMProvider.ANTHROPIC:
            return await self._call_anthropic(config, messages)
        elif config.provider == LLMProvider.GOOGLE:
            return await self._call_google(config, messages)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")
    
    async def _call_openai(self, config: LLMConfig, messages: List[Dict]) -> str:
        """Call OpenAI API"""
        headers = {"Authorization": f"Bearer {config.api_key}"}
        payload = {
            "model": config.model,
            "messages": messages,
            "temperature": 0.7
        }
        
        response = await self.session.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    async def _call_anthropic(self, config: LLMConfig, messages: List[Dict]) -> str:
        """Call Anthropic API"""
        headers = {
            "x-api-key": config.api_key,
            "Content-Type": "application/json"
        }
        
        # Convert to Anthropic format
        system_msg = ""
        user_msg = ""
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            elif msg["role"] == "user":
                user_msg = msg["content"]
        
        payload = {
            "model": config.model,
            "max_tokens": 1000,
            "system": system_msg,
            "messages": [{"role": "user", "content": user_msg}]
        }
        
        response = await self.session.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]
    
    async def _call_google(self, config: LLMConfig, messages: List[Dict]) -> str:
        """Call Google Gemini API"""
        headers = {"Authorization": f"Bearer {config.api_key}"}
        payload = {
            "contents": [{"parts": [{"text": msg["content"]} for msg in messages]}]
        }
        
        response = await self.session.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{config.model}:generateContent",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

class ReflexAgent:
    """Reflex Agent that orchestrates multiple LLMs via MCP"""
    
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        self.conversation_history: List[MCPMessage] = []
        self.routing_rules = self._setup_routing_rules()
    
    def _setup_routing_rules(self) -> Dict[str, str]:
        """Define which LLM to use for different types of queries"""
        return {
            "technical": "claude",  # Better for technical semiconductor questions
            "general": "gpt4",     # Good for general business questions
            "creative": "gemini",  # Good for creative solutions
            "code": "gpt4",        # Good for code generation
            "analysis": "claude"   # Better for complex analysis
        }
    
    def _classify_query(self, query: str) -> str:
        """Classify query type to determine which LLM to use"""
        query_lower = query.lower()
        
        # Technical semiconductor terms
        if any(term in query_lower for term in ["mpw", "pdk", "gds", "shuttle", "wafer", "process", "mask"]):
            return "technical"
        
        # Code-related terms
        if any(term in query_lower for term in ["code", "programming", "api", "function", "script"]):
            return "code"
        
        # Creative terms
        if any(term in query_lower for term in ["design", "creative", "idea", "solution", "approach"]):
            return "creative"
        
        # Analysis terms
        if any(term in query_lower for term in ["analyze", "compare", "evaluate", "assess", "review"]):
            return "analysis"
        
        return "general"
    
    async def process_query(self, user_query: str) -> Dict[str, Any]:
        """Process user query using appropriate LLM"""
        # Add user message to history
        user_message = MCPMessage(role="user", content=user_query)
        self.conversation_history.append(user_message)
        
        # Classify query and select LLM
        query_type = self._classify_query(user_query)
        llm_name = self.routing_rules.get(query_type, "gpt4")
        
        logger.info(f"Routing query to {llm_name} (type: {query_type})")
        
        # Create system prompt based on query type
        system_prompt = self._create_system_prompt(query_type)
        system_message = MCPMessage(role="system", content=system_prompt)
        
        # Prepare messages for LLM
        messages = [system_message] + self.conversation_history[-10:]  # Last 10 messages for context
        
        try:
            # Call LLM via MCP
            response = await self.mcp_client.send_message(llm_name, messages)
            
            # Add assistant response to history
            assistant_message = MCPMessage(role="assistant", content=response["response"])
            self.conversation_history.append(assistant_message)
            
            return {
                "query": user_query,
                "query_type": query_type,
                "llm_used": llm_name,
                "response": response["response"],
                "metadata": {
                    "provider": response["provider"],
                    "model": response["model"],
                    "conversation_length": len(self.conversation_history)
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            # Fallback to default LLM
            if llm_name != "gpt4":
                logger.info("Falling back to GPT-4")
                return await self.process_query_with_fallback(user_query)
            else:
                raise
    
    async def process_query_with_fallback(self, user_query: str) -> Dict[str, Any]:
        """Process query with fallback LLM"""
        messages = [
            MCPMessage(role="system", content="You are a helpful assistant for YNS TSMC Design House."),
            MCPMessage(role="user", content=user_query)
        ]
        
        response = await self.mcp_client.send_message("gpt4", messages)
        return {
            "query": user_query,
            "query_type": "fallback",
            "llm_used": "gpt4",
            "response": response["response"],
            "metadata": {"fallback": True}
        }
    
    def _create_system_prompt(self, query_type: str) -> str:
        """Create specialized system prompt based on query type"""
        base_prompt = "You are an AI assistant for YNS, a TSMC Design House. "
        
        prompts = {
            "technical": base_prompt + """
            You specialize in semiconductor design and manufacturing processes.
            Provide detailed technical information about MPW, PDK, GDS files, shuttle schedules,
            and other semiconductor-related topics. Be precise and technical in your responses.
            """,
            
            "general": base_prompt + """
            You help with general business inquiries about YNS services.
            Be helpful, professional, and provide clear information about our services.
            """,
            
            "creative": base_prompt + """
            You help with creative problem-solving and innovative approaches.
            Think outside the box and provide creative solutions for design challenges.
            """,
            
            "code": base_prompt + """
            You help with programming and technical implementation.
            Provide clean, well-documented code examples and technical solutions.
            """,
            
            "analysis": base_prompt + """
            You specialize in detailed analysis and evaluation.
            Provide thorough, data-driven analysis with clear conclusions and recommendations.
            """
        }
        
        return prompts.get(query_type, prompts["general"])

class YNSReflexAgent:
    """Main YNS Reflex Agent that integrates with existing platform"""
    
    def __init__(self):
        self.mcp_client = MCPClient()
        self.agent = ReflexAgent(self.mcp_client)
        self._setup_llms()
    
    def _setup_llms(self):
        """Setup various LLM providers"""
        # This would be configured with actual API keys
        llm_configs = [
            LLMConfig(
                provider=LLMProvider.OPENAI,
                model="gpt-4",
                api_key="your-openai-key",
                capabilities=["general", "code", "analysis"],
                cost_per_token=0.00003
            ),
            LLMConfig(
                provider=LLMProvider.ANTHROPIC,
                model="claude-3-sonnet",
                api_key="your-anthropic-key",
                capabilities=["technical", "analysis", "creative"],
                cost_per_token=0.000015
            ),
            LLMConfig(
                provider=LLMProvider.GOOGLE,
                model="gemini-pro",
                api_key="your-google-key",
                capabilities=["creative", "general"],
                cost_per_token=0.00001
            )
        ]
        
        # Register LLMs
        for i, config in enumerate(llm_configs):
            name = ["gpt4", "claude", "gemini"][i]
            asyncio.create_task(self.mcp_client.register_llm(name, config))
    
    async def handle_chat_message(self, message: str) -> Dict[str, Any]:
        """Handle chat message from YNS platform"""
        return await self.agent.process_query(message)
    
    async def get_llm_status(self) -> Dict[str, Any]:
        """Get status of all registered LLMs"""
        return {
            "registered_llms": list(self.mcp_client.connections.keys()),
            "conversation_length": len(self.agent.conversation_history),
            "routing_rules": self.agent.routing_rules
        }

# Example usage and testing
async def main():
    """Demo of Reflex Agent + MCP integration"""
    print("🚀 YNS Reflex Agent + MCP Demo")
    print("=" * 50)
    
    # Initialize agent
    yns_agent = YNSReflexAgent()
    
    # Example queries
    test_queries = [
        "What is MPW shuttle schedule?",
        "How do I upload GDS files?",
        "Can you help me write a Python script for data analysis?",
        "Compare different PDK options for our project",
        "What are the creative approaches for power optimization?"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        try:
            result = await yns_agent.handle_chat_message(query)
            print(f"🤖 LLM Used: {result['llm_used']} ({result['query_type']})")
            print(f"💬 Response: {result['response'][:100]}...")
            print(f"📊 Metadata: {result['metadata']}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Show agent status
    status = await yns_agent.get_llm_status()
    print(f"\n📈 Agent Status: {json.dumps(status, indent=2)}")

if __name__ == "__main__":
    asyncio.run(main())