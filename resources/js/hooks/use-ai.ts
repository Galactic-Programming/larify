import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import type {
    AIChatResult,
    AIDescriptionResult,
    AIErrorResponse,
    AILabelSuggestionResult,
    AIMeetingNotesResult,
    AIPrioritySuggestionResult,
    AIResponse,
    AIStatus,
    AITaskParseResult,
} from '@/types/ai';

interface UseAIOptions {
    onError?: (error: AIErrorResponse) => void;
    onSuccess?: () => void;
}

interface UseAIReturn<T, TArgs extends unknown[] = unknown[]> {
    data: T | null;
    isLoading: boolean;
    error: AIErrorResponse | null;
    remainingRequests: number | null;
    execute: (...args: TArgs) => Promise<T | null>;
    reset: () => void;
}

/**
 * Base hook for AI API calls
 */
function useAIRequest<T, TArgs extends unknown[]>(
    endpoint: string,
    buildPayload: (...args: TArgs) => Record<string, unknown>,
    options: UseAIOptions = {},
): UseAIReturn<T, TArgs> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AIErrorResponse | null>(null);
    const [remainingRequests, setRemainingRequests] = useState<number | null>(
        null,
    );

    const execute = useCallback(
        async (...args: TArgs): Promise<T | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(buildPayload(...args)),
                });

                const json = await response.json();

                if (!response.ok) {
                    const errorData = json as AIErrorResponse;
                    setError(errorData);
                    options.onError?.(errorData);

                    // If subscription required, redirect to billing
                    if (
                        errorData.reason === 'subscription_required' &&
                        errorData.upgrade_url
                    ) {
                        router.visit(errorData.upgrade_url);
                    }

                    return null;
                }

                const result = json as AIResponse<T>;
                setData(result.data);
                setRemainingRequests(result.remaining_requests);
                options.onSuccess?.();

                return result.data;
            } catch {
                const errorData: AIErrorResponse = {
                    message: 'An unexpected error occurred. Please try again.',
                };
                setError(errorData);
                options.onError?.(errorData);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [endpoint, buildPayload, options],
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setRemainingRequests(null);
    }, []);

    return {
        data,
        isLoading,
        error,
        remainingRequests,
        execute,
        reset,
    };
}

/**
 * Hook to check AI status for current user
 */
export function useAIStatus() {
    const [status, setStatus] = useState<AIStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ai/status', {
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { status, isLoading, checkStatus };
}

/**
 * Hook to parse natural language into task data
 */
export function useAIParseTask(options: UseAIOptions = {}) {
    return useAIRequest<AITaskParseResult, [string]>(
        '/api/ai/tasks/parse',
        (text) => ({ text }),
        options,
    );
}

/**
 * Hook to generate task description from title
 */
export function useAIGenerateDescription(options: UseAIOptions = {}) {
    return useAIRequest<AIDescriptionResult, [string]>(
        '/api/ai/tasks/description',
        (title) => ({ title }),
        options,
    );
}

/**
 * Hook to suggest priority for a task
 */
export function useAISuggestPriority(options: UseAIOptions = {}) {
    return useAIRequest<AIPrioritySuggestionResult, [string, string | null]>(
        '/api/ai/tasks/priority',
        (title, description) => ({ title, description }),
        options,
    );
}

/**
 * Hook to suggest labels for a task
 */
export function useAISuggestLabels(
    projectId: number,
    options: UseAIOptions = {},
) {
    return useAIRequest<AILabelSuggestionResult, [string, string | null]>(
        `/api/ai/projects/${projectId}/labels/suggest`,
        (title, description) => ({ title, description }),
        options,
    );
}

/**
 * Hook to chat with AI assistant
 */
export function useAIChat(projectId: number, options: UseAIOptions = {}) {
    return useAIRequest<AIChatResult, [string]>(
        `/api/ai/projects/${projectId}/chat`,
        (message) => ({ message }),
        options,
    );
}

/**
 * Hook to parse meeting notes into tasks
 */
export function useAIParseMeetingNotes(options: UseAIOptions = {}) {
    return useAIRequest<AIMeetingNotesResult, [string]>(
        '/api/ai/tasks/meeting-notes',
        (notes) => ({ notes }),
        options,
    );
}
