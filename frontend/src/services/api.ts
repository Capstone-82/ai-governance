// API Service for AI Cloud Governance Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Types for API requests/responses
export interface BackendModelConfig {
    host_platform: 'aws_bedrock' | 'openai' | 'gcp_vertex';
    model_id: string;
}

export interface BatchGovernanceRequest {
    query: string;
    governance_context: 'aws' | 'azure' | 'gcp';
    models: BackendModelConfig[];
}

export interface UsageMetrics {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
}

export interface CostMetrics {
    input_cost: number;
    output_cost: number;
    total_cost: number;
}

export interface AccuracyMetrics {
    score: number; // 0-100
    rationale: string;
    evaluator_model: string;
}

export interface GovernanceLog {
    id: string;
    trace_id: string;
    provider: string;
    model_id: string;
    started_at: string;
    ended_at: string;
    usage: UsageMetrics;
    cost: CostMetrics;
    accuracy: AccuracyMetrics;
    status: string;
    success: boolean;
    input_prompt: string;
    response_text: string;
    error_message?: string;
}

export interface ConversationSummary {
    id: string;
    title: string;
    created_at: string;
    message_count: number;
}

export interface MessageDetail {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    telemetry?: {
        id: string;
        model_id: string;
        latency_ms: number;
        input_tokens: number;
        output_tokens: number;
        total_cost: number;
        accuracy_score: number;
        accuracy_rationale?: string;
        timestamp: string;
    };
}

export interface ConversationDetail {
    id: string;
    title: string;
    created_at: string;
    message_count: number;
    messages: MessageDetail[];
}

export interface ModelPerformance {
    model_id: string;
    host_platform: string;
    total_requests: number;
    avg_accuracy: number;
    avg_cost: number;
    avg_latency_ms: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
    total_cost: number;
}

export interface CostBreakdown {
    host_platform: string;
    model_id: string;
    total_requests: number;
    total_cost: number;
    avg_cost_per_request: number;
}

export interface AccuracyTrend {
    date: string;
    model_id: string;
    avg_accuracy: number;
    request_count: number;
}

export interface AnalyticsSummary {
    total_requests: number;
    total_cost: number;
    avg_accuracy: number;
    avg_latency_ms: number;
    top_model_by_accuracy: string;
    most_cost_effective_model: string;
}

// Helper function for API calls
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            throw error;
        }
        throw new Error('Unknown error occurred');
    }
}

// Governance API
export const governanceAPI = {
    /**
     * Analyze governance query with multiple models in parallel
     */
    async batchAnalyze(request: BatchGovernanceRequest): Promise<GovernanceLog[]> {
        return apiCall<GovernanceLog[]>('/api/v1/governance/analyze/batch', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    /**
     * Health check
     */
    async health(): Promise<{ status: string }> {
        return apiCall('/api/v1/governance/health');
    },
};

// History API
export const historyAPI = {
    /**
     * Get all conversations
     */
    async getConversations(limit = 50, offset = 0): Promise<ConversationSummary[]> {
        return apiCall<ConversationSummary[]>(
            `/api/v1/history/conversations?limit=${limit}&offset=${offset}`
        );
    },

    /**
     * Get conversation details with messages and telemetry
     */
    async getConversation(conversationId: string): Promise<ConversationDetail> {
        return apiCall<ConversationDetail>(
            `/api/v1/history/conversations/${conversationId}`
        );
    },

    /**
     * Delete conversation
     */
    async deleteConversation(conversationId: string): Promise<{ status: string }> {
        return apiCall(`/api/v1/history/conversations/${conversationId}`, {
            method: 'DELETE',
        });
    },
};

// Analytics API
export const analyticsAPI = {
    /**
     * Get model performance metrics
     */
    async getModelPerformance(limit = 50): Promise<ModelPerformance[]> {
        return apiCall<ModelPerformance[]>(
            `/api/v1/analytics/model-performance?limit=${limit}`
        );
    },

    /**
     * Get cost breakdown by model or platform
     */
    async getCostBreakdown(
        groupBy: 'model' | 'platform' = 'model'
    ): Promise<CostBreakdown[]> {
        return apiCall<CostBreakdown[]>(
            `/api/v1/analytics/cost-breakdown?group_by=${groupBy}`
        );
    },

    /**
     * Get accuracy trends over time
     */
    async getAccuracyTrends(days = 7): Promise<AccuracyTrend[]> {
        return apiCall<AccuracyTrend[]>(
            `/api/v1/analytics/accuracy-trends?days=${days}`
        );
    },

    /**
     * Get overall analytics summary
     */
    async getSummary(): Promise<AnalyticsSummary> {
        return apiCall<AnalyticsSummary>('/api/v1/analytics/summary');
    },
};

// Export default API object
export default {
    governance: governanceAPI,
    history: historyAPI,
    analytics: analyticsAPI,
};
