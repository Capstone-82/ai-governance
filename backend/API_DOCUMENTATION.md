# AI Cloud Governance Platform - API Documentation

## Base URL
```
http://localhost:8000
```

---

## 📋 Table of Contents
1. [Governance Endpoints](#governance-endpoints)
2. [History Endpoints](#history-endpoints)
3. [Analytics Endpoints](#analytics-endpoints)
4. [Supported Models](#supported-models)

---

## Governance Endpoints

### 1. Single Model Analysis
**Endpoint:** `POST /api/v1/governance/analyze`

**Description:** Analyze a governance query using a single AI model.

**Request Body:**
```json
{
  "query": "How do I secure my S3 buckets?",
  "governance_context": "aws",
  "host_platform": "aws_bedrock",
  "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
}
```

**Response:** Returns a single `GovernanceLog` object with metrics.

---

### 2. Batch Model Analysis (Parallel)
**Endpoint:** `POST /api/v1/governance/analyze/batch`

**Description:** Run the same query across multiple models in parallel.

**Request Body:**
```json
{
  "query": "Explain AWS IAM best practices",
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

**Response:** Returns array of `GovernanceLog` objects (one per model).

**Response Schema:**
```json
[
  {
    "id": "uuid",
    "trace_id": "uuid",
    "provider": "AWS",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
    "started_at": "2026-02-04T10:30:00Z",
    "ended_at": "2026-02-04T10:30:02Z",
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
      "score": 92,
      "rationale": "Correctly identifies S3 encryption defaults and provides actionable steps.",
      "evaluator_model": "gemini-2.5-pro"
    },
    "status": "COMPLETED",
    "success": true,
    "input_prompt": "How do I secure my S3 buckets?",
    "response_text": "To secure S3 buckets..."
  }
]
```

---

### 3. Health Check
**Endpoint:** `GET /api/v1/governance/health`

**Response:**
```json
{
  "status": "ok"
}
```

---

## History Endpoints

### 1. List Conversations
**Endpoint:** `GET /api/v1/history/conversations?limit=50&offset=0`

**Description:** Get a list of all conversation threads.

**Query Parameters:**
- `limit` (default: 50) - Max conversations to return
- `offset` (default: 0) - Pagination offset

**Response:**
```json
[
  {
    "id": "conv-uuid",
    "title": "How do I secure my S3 buckets?",
    "created_at": "2026-02-04T10:30:00Z",
    "message_count": 5
  }
]
```

---

### 2. Get Conversation Details
**Endpoint:** `GET /api/v1/history/conversations/{conversation_id}`

**Description:** Get full conversation with all messages and telemetry.

**Response:**
```json
{
  "id": "conv-uuid",
  "title": "How do I secure my S3 buckets?",
  "created_at": "2026-02-04T10:30:00Z",
  "message_count": 5,
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "How do I secure my S3 buckets?",
      "created_at": "2026-02-04T10:30:00Z",
      "telemetry": null
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "To secure S3 buckets...",
      "created_at": "2026-02-04T10:30:02Z",
      "telemetry": {
        "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
        "latency_ms": 1250.5,
        "total_cost": 0.001875,
        "accuracy_score": 92
      }
    }
  ]
}
```

---

### 3. Delete Conversation
**Endpoint:** `DELETE /api/v1/history/conversations/{conversation_id}`

**Response:**
```json
{
  "status": "deleted"
}
```

---

## Analytics Endpoints

### 1. Model Performance
**Endpoint:** `GET /api/v1/analytics/model-performance?limit=50`

**Description:** Get aggregated performance metrics for each model.

**Response:**
```json
[
  {
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
    "host_platform": "aws_bedrock",
    "total_requests": 45,
    "avg_accuracy": 92.5,
    "avg_cost": 0.001234,
    "avg_latency_ms": 1250.75,
    "avg_input_tokens": 150,
    "avg_output_tokens": 300,
    "total_cost": 0.0555
  }
]
```

---

### 2. Cost Breakdown
**Endpoint:** `GET /api/v1/analytics/cost-breakdown?group_by=model`

**Description:** Get cost breakdown by model or platform.

**Query Parameters:**
- `group_by` - Either `"model"` (default) or `"platform"`

**Response (group_by=model):**
```json
[
  {
    "host_platform": "aws_bedrock",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
    "total_requests": 45,
    "total_cost": 0.0555,
    "avg_cost_per_request": 0.001234
  }
]
```

**Response (group_by=platform):**
```json
[
  {
    "host_platform": "aws_bedrock",
    "model_id": "All Models",
    "total_requests": 120,
    "total_cost": 0.2345,
    "avg_cost_per_request": 0.001954
  }
]
```

---

### 3. Accuracy Trends
**Endpoint:** `GET /api/v1/analytics/accuracy-trends?days=7`

**Description:** Get accuracy trends over time for each model.

**Query Parameters:**
- `days` (default: 7) - Number of days to analyze

**Response:**
```json
[
  {
    "date": "2026-02-04",
    "model_id": "gpt-4o",
    "avg_accuracy": 95.0,
    "request_count": 12
  },
  {
    "date": "2026-02-03",
    "model_id": "gpt-4o",
    "avg_accuracy": 93.5,
    "request_count": 8
  }
]
```

---

### 4. Analytics Summary
**Endpoint:** `GET /api/v1/analytics/summary`

**Description:** Get overall platform statistics.

**Response:**
```json
{
  "total_requests": 150,
  "total_cost": 0.2345,
  "avg_accuracy": 91.5,
  "avg_latency_ms": 1450.25,
  "top_model_by_accuracy": "gemini-2.5-pro",
  "most_cost_effective_model": "gpt-4o-mini"
}
```

---

## Supported Models

### 🔷 AWS Bedrock (`host_platform: "aws_bedrock"`)

#### Anthropic Claude Models
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `anthropic.claude-3-5-sonnet-20240620-v1:0` | Most intelligent model | $3.00/1M | $15.00/1M |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Balanced performance | $3.00/1M | $15.00/1M |
| `anthropic.claude-3-haiku-20240307-v1:0` | Fastest, most compact | $0.25/1M | $1.25/1M |

#### Meta Llama Models
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `meta.llama3-1-405b-instruct-v1:0` | Largest Llama 3.1 | $0.00532/1K | $0.016/1K |
| `meta.llama3-1-70b-instruct-v1:0` | Llama 3.1 70B | $0.00099/1K | $0.00099/1K |
| `meta.llama3-70b-instruct-v1:0` | Llama 3 70B | $0.00099/1K | $0.00099/1K |
| `meta.llama3-8b-instruct-v1:0` | Llama 3 8B | $0.0003/1K | $0.0006/1K |

---

### 🟢 OpenAI (`host_platform: "openai"`)

#### GPT-5 Series (Latest)
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `gpt-5.2` | Most advanced GPT-5 | $1.75/1M | $14.00/1M |
| `gpt-5.1` | GPT-5.1 | $1.25/1M | $10.00/1M |
| `gpt-5` | Base GPT-5 | $1.25/1M | $10.00/1M |
| `gpt-5-mini` | Compact GPT-5 | $0.25/1M | $2.00/1M |
| `gpt-5-nano` | Smallest GPT-5 | $0.05/1M | $0.40/1M |

#### GPT-4 Series
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `gpt-4.1` | Latest GPT-4 | $2.00/1M | $8.00/1M |
| `gpt-4o` | GPT-4 Optimized | $2.50/1M | $10.00/1M |
| `gpt-4o-mini` | Compact GPT-4o | $0.15/1M | $0.60/1M |

#### O-Series (Reasoning Models)
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `o1` | Advanced reasoning | $15.00/1M | $60.00/1M |
| `o1-pro` | Pro reasoning | $150.00/1M | $600.00/1M |
| `o3` | O3 reasoning | $2.00/1M | $8.00/1M |
| `o3-mini` | Compact O3 | $1.10/1M | $4.40/1M |
| `o4-mini` | Latest compact | $1.10/1M | $4.40/1M |

---

### 🔴 Google Vertex AI (`host_platform: "gcp_vertex"`)

#### Gemini 3 Series (Latest)
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `gemini-3-pro-preview` | Most powerful agentic | $2.50/1M | $10.00/1M |
| `gemini-3-flash-preview` | Agentic workhorse | $0.075/1M | $0.30/1M |
| `gemini-3-pro-image-preview` | Creative + image gen | $1.25/1M | $5.00/1M |

#### Gemini 2.5 Series
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `gemini-2.5-pro` | Strongest quality | $1.25/1M | $5.00/1M |
| `gemini-2.5-flash` | Best balance | $0.075/1M | $0.30/1M |
| `gemini-2.5-flash-lite` | Low latency | $0.0375/1M | $0.15/1M |

#### Gemini 1.5 Series (Legacy)
| Model ID | Description | Input Cost | Output Cost |
|----------|-------------|------------|-------------|
| `gemini-1.5-pro` | Legacy pro | $1.25/1M | $5.00/1M |
| `gemini-1.5-flash` | Legacy flash | $0.075/1M | $0.30/1M |

---

## How to Find Model IDs

### AWS Bedrock
1. Go to AWS Console → Bedrock → Model Access
2. Model IDs follow pattern: `provider.model-name-version`
3. Example: `anthropic.claude-3-sonnet-20240229-v1:0`

### OpenAI
1. Check [OpenAI Platform Docs](https://platform.openai.com/docs/models)
2. Model IDs are simple names: `gpt-4o`, `gpt-4o-mini`, `o1`
3. Use exact model name from API docs

### Google Vertex AI
1. Check [Vertex AI Model Garden](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
2. Model IDs: `gemini-2.5-pro`, `gemini-2.5-flash`
3. Can include `google/` prefix (auto-removed by our system)

---

## Field Descriptions

### `governance_context`
The cloud platform you're asking about:
- `"aws"` - Amazon Web Services
- `"azure"` - Microsoft Azure
- `"gcp"` - Google Cloud Platform

This helps the AI provide context-specific answers.

### `host_platform`
Where the AI model is hosted:
- `"aws_bedrock"` - AWS Bedrock (Claude, Llama)
- `"openai"` - OpenAI Platform (GPT, O-series)
- `"gcp_vertex"` - Google Vertex AI (Gemini)

### Accuracy Score
- Range: **0-100** (percentage)
- Evaluated by: **Gemini 2.5 Pro**
- `100` = Perfect answer
- `0` = Completely wrong

---

## Example: Multi-Cloud Comparison

```json
{
  "query": "What are the security best practices for object storage?",
  "governance_context": "aws",
  "models": [
    {
      "host_platform": "aws_bedrock",
      "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0"
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

This will run all 3 models in parallel, evaluate each response with Gemini 2.5 Pro, calculate costs, and return comprehensive metrics for comparison.
