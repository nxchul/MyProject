# Environment Variables Configuration for Reflex Agent

## Required API Keys for Multi-LLM Support

Add these to your `.env.local` file in the `yns-web` directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic Claude Configuration (optional but recommended)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google Gemini Configuration (optional)
GOOGLE_API_KEY=your-google-api-key-here

# Existing Supabase Configuration (for RAG)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Email Configuration (existing)
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Provider Priority

The Reflex Agent will automatically detect which providers are available and route queries accordingly:

1. **Primary**: If only OpenAI is configured, all queries go to OpenAI with intelligent model selection
2. **Enhanced**: With OpenAI + Anthropic, complex reasoning tasks go to Claude, code tasks to GPT-4
3. **Full**: With all three providers, optimal routing based on task type, cost, and latency

## API Key Setup Instructions

### OpenAI (Required)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local` as `OPENAI_API_KEY`

### Anthropic Claude (Recommended)
1. Go to https://console.anthropic.com/
2. Create an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### Google Gemini (Optional)
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `.env.local` as `GOOGLE_API_KEY`

## Testing the Setup

After configuring API keys, you can test the reflex agent:

1. **Via API**: `curl http://localhost:3000/api/agent` to see provider status
2. **Via Chat**: Use the existing chat interface - responses will now show which provider was used
3. **Via Example**: Run the example script to see routing decisions

## Cost Optimization

The reflex agent automatically optimizes costs by:
- Using cheaper models (GPT-4o-mini, Claude Haiku) for simple queries
- Reserving expensive models (GPT-4o, Claude Sonnet) for complex tasks
- Load balancing across providers to avoid rate limits
- Falling back to alternative providers on errors