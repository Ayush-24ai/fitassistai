import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
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
  const { onResult, onError, continuous = false, language = 'en-US' } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);
  const callbacksRef = useRef({ onResult, onError });
  
  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { onResult, onError };
  }, [onResult, onError]);

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
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
  }, []);

  // Handle visibility changes (mobile backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        // App went to background, stop recording
        stopListeningInternal();
      }
    };

    const handleBlur = () => {
      if (isListening) {
        // Window lost focus, stop recording
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
      globalRecognitionInstance = null;
    }
    
    isGlobalListening = false;
    
    if (isMountedRef.current) {
      setIsListening(false);
    }
    
    // Reset stopping flag after a short delay
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  }, []);

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
      };

      recognition.onend = () => {
        isGlobalListening = false;
        globalRecognitionInstance = null;
        
        if (isMountedRef.current && !isStoppingRef.current) {
          setIsListening(false);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        const errorCode = event.error;
        
        // Don't report aborted as an error when intentionally stopping
        if (errorCode === 'aborted' && isStoppingRef.current) {
          return;
        }
        
        // Handle "no-speech" gracefully
        if (errorCode === 'no-speech') {
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
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;
        
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        
        if (currentTranscript) {
          setTranscript(prev => continuous ? (prev + ' ' + currentTranscript).trim() : currentTranscript);
        }

        if (finalTranscript) {
          callbacksRef.current.onResult?.(finalTranscript);
        }
      };

      globalRecognitionInstance = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setError('Failed to start speech recognition. Please try again.');
      isGlobalListening = false;
      globalRecognitionInstance = null;
    }
  }, [isSupported, continuous, language, stopListeningInternal]);

  const stopListening = useCallback(() => {
    stopListeningInternal();
  }, [stopListeningInternal]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
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
