import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef('');

  const supported = !!SpeechRecognition;

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError('Speech recognition is not supported in this browser. Use Chrome on Android.');
      return;
    }
    if (isListening) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    finalRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'nl-NL';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      // Rebuild from scratch every time to avoid Chrome's duplication bug
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      finalRef.current = final;
      setTranscript(final.trim());
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      const messages = {
        'not-allowed':       'Microphone access denied — tap the lock icon in your browser address bar to allow it.',
        'permission-denied': 'Microphone access denied — tap the lock icon in your browser address bar to allow it.',
        'network':           'Network error — check your connection (speech recognition needs internet).',
        'service-not-allowed': 'Speech service unavailable — try refreshing the page.',
      };
      setError(messages[event.error] || `Microphone error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, isListening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalRef.current = '';
  }, []);

  return { isListening, transcript, interimTranscript, error, supported, start, stop, reset };
}
