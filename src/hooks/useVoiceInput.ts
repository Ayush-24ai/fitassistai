import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
  silenceTimeout?: number; // Auto-stop after silence (ms)
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Singleton to ensure only one recognition instance exists globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalRecognitionInstance: any = null;
let isGlobalListening = false;

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { 
    onResult, 
    onError, 
    continuous = false, 
    language = 'en-US',
    silenceTimeout = 3000 // Default 3 seconds of silence before auto-stop
  } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);
  const callbacksRef = useRef({ onResult, onError });
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const accumulatedTranscriptRef = useRef<string>('');
  
  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { onResult, onError };
  }, [onResult, onError]);

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Reset silence timer (called on each speech event)
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    lastSpeechTimeRef.current = Date.now();
    
    if (silenceTimeout > 0 && isGlobalListening) {
      silenceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && isGlobalListening) {
          console.log('Auto-stopping due to silence');
          // Process accumulated transcript before stopping
          const finalTranscript = accumulatedTranscriptRef.current.trim();
          if (finalTranscript) {
            callbacksRef.current.onResult?.(finalTranscript);
          }
          stopListeningInternal();
        }
      }, silenceTimeout);
    }
  }, [silenceTimeout, clearSilenceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearSilenceTimer();
      // Force stop on unmount
      if (globalRecognitionInstance && isGlobalListening) {
        try {
          globalRecognitionInstance.abort();
        } catch (e) {
          // Ignore errors on cleanup
        }
        globalRecognitionInstance = null;
        isGlobalListening = false;
      }
    };
  }, [clearSilenceTimer]);

  // Handle visibility changes (mobile backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        // App went to background, stop recording
        const finalTranscript = accumulatedTranscriptRef.current.trim();
        if (finalTranscript) {
          callbacksRef.current.onResult?.(finalTranscript);
        }
        stopListeningInternal();
      }
    };

    const handleBlur = () => {
      if (isListening) {
        // Window lost focus, stop recording
        const finalTranscript = accumulatedTranscriptRef.current.trim();
        if (finalTranscript) {
          callbacksRef.current.onResult?.(finalTranscript);
        }
        stopListeningInternal();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isListening]);

  const stopListeningInternal = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    clearSilenceTimer();

    if (globalRecognitionInstance) {
      try {
        globalRecognitionInstance.abort();
      } catch (e) {
        // Ignore errors during stop
      }
      
      // Clean up listeners
      globalRecognitionInstance.onstart = null;
      globalRecognitionInstance.onend = null;
      globalRecognitionInstance.onerror = null;
      globalRecognitionInstance.onresult = null;
      globalRecognitionInstance.onspeechend = null;
      globalRecognitionInstance.onsoundend = null;
      globalRecognitionInstance = null;
    }
    
    isGlobalListening = false;
    accumulatedTranscriptRef.current = '';
    
    if (isMountedRef.current) {
      setIsListening(false);
    }
    
    // Reset stopping flag after a short delay
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    // Prevent starting if already stopping
    if (isStoppingRef.current) {
      return;
    }

    // Stop any existing instance first
    if (globalRecognitionInstance || isGlobalListening) {
      stopListeningInternal();
      // Wait a bit before starting new instance
      setTimeout(() => {
        if (isMountedRef.current) {
          startListening();
        }
      }, 150);
      return;
    }

    setError(null);
    setTranscript('');
    accumulatedTranscriptRef.current = '';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        if (!isMountedRef.current) {
          recognition.abort();
          return;
        }
        isGlobalListening = true;
        setIsListening(true);
        setError(null);
        resetSilenceTimer(); // Start silence detection
      };

      recognition.onend = () => {
        clearSilenceTimer();
        isGlobalListening = false;
        globalRecognitionInstance = null;
        
        if (isMountedRef.current && !isStoppingRef.current) {
          setIsListening(false);
          
          // Process any remaining transcript
          const finalTranscript = accumulatedTranscriptRef.current.trim();
          if (finalTranscript) {
            callbacksRef.current.onResult?.(finalTranscript);
          }
        }
        accumulatedTranscriptRef.current = '';
      };

      // Handle speech end - user stopped talking
      recognition.onspeechend = () => {
        // User stopped speaking, auto-stop after a short delay
        if (silenceTimeout > 0) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            if (isMountedRef.current && isGlobalListening) {
              const finalTranscript = accumulatedTranscriptRef.current.trim();
              if (finalTranscript) {
                callbacksRef.current.onResult?.(finalTranscript);
              }
              stopListeningInternal();
            }
          }, 1000); // 1 second after speech ends
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        const errorCode = event.error;
        clearSilenceTimer();
        
        // Don't report aborted as an error when intentionally stopping
        if (errorCode === 'aborted' && isStoppingRef.current) {
          return;
        }
        
        // Handle "no-speech" gracefully - process what we have
        if (errorCode === 'no-speech') {
          const finalTranscript = accumulatedTranscriptRef.current.trim();
          if (finalTranscript) {
            callbacksRef.current.onResult?.(finalTranscript);
          }
          
          if (isMountedRef.current) {
            setError('No speech detected. Try speaking louder or closer to the microphone.');
          }
          stopListeningInternal();
          return;
        }

        const errorMessage = getErrorMessage(errorCode);
        
        if (isMountedRef.current) {
          setError(errorMessage);
          setIsListening(false);
        }
        
        callbacksRef.current.onError?.(errorMessage);
        
        // Cleanup on error
        isGlobalListening = false;
        globalRecognitionInstance = null;
        accumulatedTranscriptRef.current = '';
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;
        
        // Reset silence timer on any speech activity
        resetSilenceTimer();
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Accumulate final transcript
        if (finalTranscript) {
          accumulatedTranscriptRef.current += finalTranscript;
        }

        // Update display transcript
        const currentDisplay = accumulatedTranscriptRef.current + interimTranscript;
        setTranscript(currentDisplay.trim());
      };

      globalRecognitionInstance = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setError('Failed to start speech recognition. Please try again.');
      isGlobalListening = false;
      globalRecognitionInstance = null;
      accumulatedTranscriptRef.current = '';
    }
  }, [isSupported, continuous, language, silenceTimeout, stopListeningInternal, resetSilenceTimer, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    // Process accumulated transcript before stopping
    const finalTranscript = accumulatedTranscriptRef.current.trim();
    if (finalTranscript && isMountedRef.current) {
      callbacksRef.current.onResult?.(finalTranscript);
    }
    stopListeningInternal();
  }, [stopListeningInternal]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'No microphone was found. Ensure it is connected.';
    case 'not-allowed':
      return 'Microphone permission was denied. Please allow access.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'aborted':
      return 'Recording stopped.';
    case 'language-not-supported':
      return 'The language is not supported.';
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.';
    default:
      return `Speech recognition error: ${error}`;
  }
}
