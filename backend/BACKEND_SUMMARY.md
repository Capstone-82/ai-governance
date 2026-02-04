# AI Cloud Governance Platform - Backend Summary

## Architecture Overview

This backend is a **multi-cloud AI governance platform** that orchestrates AI model execution across AWS Bedrock, OpenAI, and GCP Vertex AI, with automatic cost calculation, accuracy evaluation, and persistent storage.

## Supported Providers & Models

### 1. AWS Bedrock (`host_platform: "aws_bedrock"`)
- **Anthropic Claude Models**:
  - `anthropic.claude-3-5-sonnet-20240620-v1:0`
  - `anthropic.claude-3-sonnet-20240229-v1:0`
  - `anthropic.claude-3-haiku-20240307-v1:0`
  
- **Meta Llama Models**:
  - `meta.llama3-70b-instruct-v1:0`
  - `meta.llama3-8b-instruct-v1:0`
  - `meta.llama3-1-405b-instruct-v1:0`

### 2. OpenAI (`host_platform: "openai"`)
- GPT-5 Series: `gpt-5.2`, `gpt-5.1`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- GPT-4 Series: `gpt-4.1`, `gpt-4o`, `gpt-4o-mini`
- O-Series: `o1`, `o1-pro`, `o3`, `o3-mini`, `o4-mini`
- Specialized: `gpt-realtime`, `gpt-audio`, `computer-use-preview`

### 3. GCP Vertex AI (`host_platform: "gcp_vertex"`)
- **Gemini 3 Series**:
  - `gemini-3-pro-preview` (Most powerful agentic)
  - `gemini-3-flash-preview` (Agentic workhorse)
  - `gemini-3-pro-image-preview` (Creative + image gen)
  
- **Gemini 2.5 Series**:
  - `gemini-2.5-pro` (Strongest quality)
  - `gemini-2.5-flash` (Best balance)
  - `gemini-2.5-flash-lite` (Low latency)

## API Endpoints

### Governance Analysis
- `POST /api/v1/governance/analyze` - Single model analysis
- `POST /api/v1/governance/analyze/batch` - Multi-model parallel analysis
- `GET /api/v1/governance/health` - Health check

### History & Analytics
- `GET /api/v1/history/conversations` - List all conversations
- `GET /api/v1/history/conversations/{id}` - Get conversation details with telemetry
- `DELETE /api/v1/history/conversations/{id}` - Delete conversation

## Request Format

### Batch Analysis Example
```json
{
  "query": "How do I secure my S3 buckets?",
  "governance_context": "aws",
  "models": [
    {
      "host_platform": "aws_bedrock",
      "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "host_platform": "openai",
      "model_id": "gpt-4o"
    },
    {
      "host_platform": "gcp_vertex",
      "model_id": "gemini-2.5-pro"
    }
  ]
}
```

## Response Schema (GovernanceLog)

Each model execution returns:
```json
{
  "id": "uuid",
  "trace_id": "uuid",
  "provider": "AWS|OPENAI|GOOGLE",
  "model_id": "...",
  "started_at": "timestamp",
  "ended_at": "timestamp",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 300,
    "total_tokens": 450,
    "latency_ms": 1250.5
  },
  "cost": {
    "input_cost": 0.000375,
    "output_cost": 0.0015,
    "total_cost": 0.001875
  },
  "accuracy": {
    "score": 0.92,
    "rationale": "Correctly identifies S3 encryption defaults",
    "evaluator_model": "gemini-1.5-pro"
  },
  "status": "COMPLETED|FAILED",
  "success": true,
  "input_prompt": "...",
  "response_text": "..."
}
```

## Key Features

### 1. Parallel Execution
- Uses `ThreadPoolExecutor` + `asyncio` for true parallel model invocation
- Single request can run 10+ models simultaneously

### 2. Dynamic Cost Calculation
- Real-time pricing from JSON files:
  - `backend/pricing/aws_anthropic.json`
  - `backend/pricing/aws_meta.json`
  - `backend/pricing/openai.json`
  - `backend/pricing/gcp_vertex.json`
- Supports per-1M and per-1K token pricing

### 3. AI-Powered Accuracy Evaluation
- Every response is automatically graded by **Gemini 1.5 Pro**
- Returns score (0.0-1.0) and rationale
- Stored in database for analytics

### 4. Database Persistence (SQLite)
- **Conversations**: Chat history grouping
- **Messages**: User queries + AI responses
- **Telemetry**: Metrics linked to each response

### 5. Prompt Engineering Ready
- `EvaluatorService` uses structured prompts
- Easy to extend with system prompts per provider

## Environment Variables Required

```env
# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# OpenAI
OPENAI_API_KEY=sk-...

# Google
GOOGLE_API_KEY=...
```

## File Structure
```
backend/
├── app/
│   ├── api/v1/endpoints/
│   │   ├── governance.py (Analysis endpoints)
│   │   └── history.py (Chat history)
│   ├── core/
│   │   ├── config.py (Settings)
│   │   └── db.py (Database connection)
│   ├── models/
│   │   ├── conversation.py
│   │   ├── message.py
│   │   └── telemetry.py
│   ├── schemas/
│   │   ├── governance.py (GovernanceLog)
│   │   ├── requests.py (API inputs)
│   │   └── history.py (API outputs)
│   ├── services/
│   │   ├── ai_engine.py (Orchestration)
│   │   ├── pricing_service.py (Cost calculation)
│   │   ├── evaluator_service.py (Gemini judge)
│   │   ├── db_service.py (Database ops)
│   │   └── llm_providers/
│   │       ├── bedrock.py (AWS)
│   │       ├── openai_provider.py (OpenAI)
│   │       └── vertex_provider.py (GCP)
│   └── main.py
├── pricing/ (JSON pricing tables)
├── database.db (SQLite)
└── requirements.txt
```

## Next Steps for Production

1. **Add Authentication**: JWT or API Keys
2. **Rate Limiting**: Prevent abuse
3. **Caching**: Redis for repeated queries
4. **Monitoring**: Prometheus + Grafana
5. **Async DB**: Replace SQLite with PostgreSQL + async driver
6. **Batch Pricing**: Support OpenAI batch tier pricing
7. **Prompt Templates**: System prompts per governance_context
8. **Error Handling**: Retry logic with exponential backoff
