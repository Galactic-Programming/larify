/**
 * AI Feature Types
 */

export interface AIStatus {
    enabled: boolean;
    can_use: boolean;
    daily_usage: number;
    remaining_requests: number;
    has_subscription: boolean;
}

export interface AITaskParseResult {
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    due_time: string | null;
    assignee_hint: string | null;
}

export interface AIResponse<T> {
    data: T;
    remaining_requests: number;
}

export interface AIErrorResponse {
    message: string;
    upgrade_url?: string;
    reason?: 'subscription_required' | 'daily_limit_exceeded';
    remaining_requests?: number;
    resets_at?: string;
}

export interface AIDescriptionResult {
    description: string;
}

export interface AILabelSuggestionResult {
    labels: string[];
    type: 'existing'; // Labels from existing project labels
}

export interface AIGeneratedLabelSuggestion {
    name: string;
    color: string;
}

export interface AIGeneratedLabelResult {
    labels: AIGeneratedLabelSuggestion[];
    type: 'generated'; // New labels to be created
}

export interface AINoLabelsResult {
    labels: [];
    type: 'none'; // No labels available (for non-owners when project has no labels)
    message?: string;
}

export type AILabelResult =
    | AILabelSuggestionResult
    | AIGeneratedLabelResult
    | AINoLabelsResult;

export interface AIPrioritySuggestionResult {
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AIChatResult {
    response: string;
    history_enabled?: boolean;
}

export interface AIChatHistoryItem {
    role: 'user' | 'model';
    content: string;
    timestamp: string;
}

export interface AIChatHistoryResult {
    history: AIChatHistoryItem[];
    count: number;
}
