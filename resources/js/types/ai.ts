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
}

export interface AIPrioritySuggestionResult {
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AIChatResult {
    response: string;
}

export interface AIMeetingNotesTask {
    title: string;
    assignee_hint: string | null;
    due_date: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AIMeetingNotesResult {
    tasks: AIMeetingNotesTask[];
}
