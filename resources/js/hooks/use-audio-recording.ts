import { useEffect, useRef, useState } from 'react';

import { recordAudio } from '@/lib/audio-utils';

interface UseAudioRecordingOptions {
    transcribeAudio?: (blob: Blob) => Promise<string>;
    onTranscriptionComplete?: (text: string) => void;
}

// Check if Web Speech API is available
const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    return (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null
    );
};

export function useAudioRecording({
    transcribeAudio,
    onTranscriptionComplete,
}: UseAudioRecordingOptions) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const activeRecordingRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const checkSpeechSupport = async () => {
            const hasMediaDevices = !!(
                navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            );
            const hasSpeechRecognition = !!getSpeechRecognition();
            // Support speech if we have transcribeAudio OR native Speech API
            setIsSpeechSupported(
                hasMediaDevices && (!!transcribeAudio || hasSpeechRecognition),
            );
        };

        checkSpeechSupport();
    }, [transcribeAudio]);

    const stopRecording = async () => {
        setIsRecording(false);

        // If using custom transcription
        if (transcribeAudio) {
            setIsTranscribing(true);
            try {
                recordAudio.stop();
                const recording = await activeRecordingRef.current;
                const text = await transcribeAudio(recording);
                onTranscriptionComplete?.(text);
            } catch (error) {
                console.error('Error transcribing audio:', error);
            } finally {
                setIsTranscribing(false);
            }
        }

        // Stop Web Speech API recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        setIsListening(false);
        if (audioStream) {
            audioStream.getTracks().forEach((track) => track.stop());
            setAudioStream(null);
        }
        activeRecordingRef.current = null;
    };

    const toggleListening = async () => {
        if (!isListening) {
            try {
                setIsListening(true);
                setIsRecording(true);

                // If custom transcription is provided, use audio recording
                if (transcribeAudio) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    });
                    setAudioStream(stream);
                    activeRecordingRef.current = recordAudio(stream);
                } else {
                    // Use Web Speech API for real-time transcription
                    const SpeechRecognition = getSpeechRecognition();
                    if (SpeechRecognition) {
                        const recognition = new SpeechRecognition();
                        recognition.continuous = true;
                        recognition.interimResults = true;
                        recognition.lang = 'vi-VN'; // Vietnamese, can be changed

                        let finalTranscript = '';

                        recognition.onresult = (event: any) => {
                            let interimTranscript = '';
                            for (
                                let i = event.resultIndex;
                                i < event.results.length;
                                i++
                            ) {
                                const transcript =
                                    event.results[i][0].transcript;
                                if (event.results[i].isFinal) {
                                    finalTranscript += transcript + ' ';
                                } else {
                                    interimTranscript += transcript;
                                }
                            }
                            // Update with current transcription
                            onTranscriptionComplete?.(
                                finalTranscript + interimTranscript,
                            );
                        };

                        recognition.onerror = (event: any) => {
                            console.error(
                                'Speech recognition error:',
                                event.error,
                            );
                            stopRecording();
                        };

                        recognition.onend = () => {
                            if (isListening) {
                                // Recognition ended but we're still listening
                                setIsRecording(false);
                                setIsListening(false);
                            }
                        };

                        recognitionRef.current = recognition;
                        recognition.start();

                        // Also get audio stream for visualization
                        try {
                            const stream =
                                await navigator.mediaDevices.getUserMedia({
                                    audio: true,
                                });
                            setAudioStream(stream);
                        } catch {
                            // Continue without visualization if mic permission denied
                        }
                    }
                }
            } catch (error) {
                console.error('Error recording audio:', error);
                setIsListening(false);
                setIsRecording(false);
                if (audioStream) {
                    audioStream.getTracks().forEach((track) => track.stop());
                    setAudioStream(null);
                }
            }
        } else {
            await stopRecording();
        }
    };

    return {
        isListening,
        isSpeechSupported,
        isRecording,
        isTranscribing,
        audioStream,
        toggleListening,
        stopRecording,
    };
}
