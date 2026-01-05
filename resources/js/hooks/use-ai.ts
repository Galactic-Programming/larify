import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
    AIChatResult,
    AIDescriptionResult,
    AIErrorResponse,
    AILabelResult,
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

    // Auto-fetch status on mount
    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

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
 * Returns either existing labels to select, or generated labels to create
 */
export function useAISuggestLabels(
    projectId: number,
    options: UseAIOptions = {},
) {
    return useAIRequest<AILabelResult, [string, string | null]>(
        `/api/ai/projects/${projectId}/labels/suggest`,
        (title, description) => ({ title, description }),
        options,
    );
}

/**
 * Hook to chat with AI assistant
 */
export function useAIChat(projectId: number, options: UseAIOptions = {}) {
    return useAIRequest<AIChatResult, [string, boolean?]>(
        `/api/ai/projects/${projectId}/chat`,
        (message, includeHistory = true) => ({
            message,
            include_history: includeHistory,
        }),
        options,
    );
}

/**
 * Hook to get conversation history
 */
export function useAIChatHistory(projectId: number) {
    const [history, setHistory] = useState<
        Array<{ role: string; content: string; timestamp: string }>
    >([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/ai/projects/${projectId}/chat/history`,
                {
                    credentials: 'same-origin',
                },
            );
            if (response.ok) {
                const data = await response.json();
                setHistory(data.data?.history || []);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const clearHistory = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/ai/projects/${projectId}/chat/history`,
                {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                },
            );
            if (response.ok) {
                setHistory([]);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [projectId]);

    return { history, isLoading, fetchHistory, clearHistory };
}

/**
 * Hook to stream chat with AI assistant using Server-Sent Events
 */
export function useAIStreamChat(projectId: number, options: UseAIOptions = {}) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [error, setError] = useState<AIErrorResponse | null>(null);
    const [remainingRequests, setRemainingRequests] = useState<number | null>(
        null,
    );

    const abortControllerRef = useRef<AbortController | null>(null);

    const startStream = useCallback(
        async (
            message: string,
            includeHistory = true,
            onChunk?: (chunk: string, fullContent: string) => void,
        ): Promise<string | null> => {
            // Abort any existing stream
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsStreaming(true);
            setStreamedContent('');
            setError(null);

            try {
                const response = await fetch(
                    `/api/ai/projects/${projectId}/chat/stream`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'text/event-stream',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            message,
                            include_history: includeHistory,
                        }),
                        signal: abortControllerRef.current.signal,
                    },
                );

                if (!response.ok) {
                    const errorData =
                        (await response.json()) as AIErrorResponse;
                    setError(errorData);
                    options.onError?.(errorData);
                    return null;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Response body is not readable');
                }

                const decoder = new TextDecoder();
                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            const eventType = line.slice(7).trim();

                            // Find the data line for this event
                            const dataLineIndex = lines.indexOf(line) + 1;
                            const dataLine = lines[dataLineIndex];

                            if (dataLine && dataLine.startsWith('data: ')) {
                                const jsonData = dataLine.slice(6);
                                try {
                                    const data = JSON.parse(jsonData);

                                    if (eventType === 'chunk') {
                                        fullContent += data.content;
                                        setStreamedContent(fullContent);
                                        onChunk?.(data.content, fullContent);
                                    } else if (eventType === 'done') {
                                        setRemainingRequests(
                                            data.remaining_requests,
                                        );
                                        options.onSuccess?.();
                                    } else if (eventType === 'error') {
                                        const errorData: AIErrorResponse = {
                                            message: data.message,
                                        };
                                        setError(errorData);
                                        options.onError?.(errorData);
                                        return null;
                                    }
                                } catch {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }
                }

                return fullContent;
            } catch (err) {
                if ((err as Error).name === 'AbortError') {
                    return null; // Stream was cancelled
                }
                const errorData: AIErrorResponse = {
                    message:
                        'An unexpected error occurred during streaming. Please try again.',
                };
                setError(errorData);
                options.onError?.(errorData);
                return null;
            } finally {
                setIsStreaming(false);
            }
        },
        [projectId, options],
    );

    const stopStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    const reset = useCallback(() => {
        setStreamedContent('');
        setError(null);
        setRemainingRequests(null);
    }, []);

    return {
        isStreaming,
        streamedContent,
        error,
        remainingRequests,
        startStream,
        stopStream,
        reset,
    };
}
