import { useState, useCallback, useRef } from 'react';

/**
 * Custom React hook for streaming queries from Kairo AI using SSE
 * @param {string} apiUrl - Base URL for the API
 * @returns {Object} Streaming state and control functions
 */
export function useKairoStream(apiUrl) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [answer, setAnswer] = useState('');
    const [sources, setSources] = useState([]);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const streamQuery = useCallback(async (query, userId, sessionId) => {
        // Reset state
        setIsStreaming(true);
        setAnswer('');
        setSources([]);
        setError(null);

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`${apiUrl}/query/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    user_id: userId,
                    session_id: sessionId
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('Stream complete');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'start':
                                console.log('Query started:', data.query);
                                break;

                            case 'token':
                                setAnswer(prev => prev + data.content);
                                break;

                            case 'done':
                                setSources(data.sources || []);
                                break;

                            case 'error':
                                setError(data.message);
                                break;

                            default:
                                console.warn('Unknown event type:', data.type);
                        }
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                console.error('Stream error:', err);
                setError(err.message);
            }
        } finally {
            setIsStreaming(false);
        }
    }, [apiUrl]);

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        isStreaming,
        answer,
        sources,
        error,
        streamQuery,
        cancelStream
    };
}
