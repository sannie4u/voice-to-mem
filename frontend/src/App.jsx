import { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryPicker } from './components/CategoryPicker.jsx';
import { QueueStatus } from './components/QueueStatus.jsx';
import { useOfflineQueue } from './hooks/useOfflineQueue.js';
import { submitNote } from './services/api.js';

const STATE = { IDLE: 'idle', SENDING: 'sending', SUCCESS: 'success', ERROR: 'error' };

export default function App() {
  const [appState, setAppState] = useState(STATE.IDLE);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('note');
  const [result, setResult] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [backendOk, setBackendOk] = useState(null);
  const textareaRef = useRef(null);
  const offlineQueue = useOfflineQueue();

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setBackendOk(data.ok && data.mem))
      .catch(() => setBackendOk(false));
  }, []);

  // Auto-focus textarea on load so Wispr Flow can type straight in
  useEffect(() => {
    textareaRef.current?.focus();
  }, [appState]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setAppState(STATE.SENDING);
    setSendError(null);

    try {
      const data = await submitNote({ transcription: trimmed, manualCategory: category });
      setResult(data);
      setAppState(STATE.SUCCESS);
      setText('');
      setTimeout(() => setAppState(STATE.IDLE), 3000);
    } catch (err) {
      if (!offlineQueue.isOnline || err.retryable) {
        offlineQueue.enqueue({ transcription: trimmed, category });
        setResult({ title: 'Opgeslagen voor later', category, offline: true });
        setAppState(STATE.SUCCESS);
        setText('');
        setTimeout(() => setAppState(STATE.IDLE), 2500);
      } else {
        setSendError(err.message);
        setAppState(STATE.ERROR);
      }
    }
  }, [text, category, offlineQueue]);

  const handleDiscard = useCallback(() => {
    setText('');
    setSendError(null);
    setAppState(STATE.IDLE);
  }, []);

  const handleKeyDown = useCallback((e) => {
    // Cmd+Enter or Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">🎙</span>
        <span className="app-title">VoiceMem</span>
        <span
          className={`backend-dot ${backendOk === null ? 'dot--unknown' : backendOk ? 'dot--ok' : 'dot--err'}`}
          title={backendOk === null ? 'Verbinden…' : backendOk ? 'Verbonden' : 'Backend niet bereikbaar'}
        />
      </header>

      <QueueStatus
        queueCount={offlineQueue.queueCount}
        isOnline={offlineQueue.isOnline}
        isRetrying={offlineQueue.isRetrying}
        onRetry={offlineQueue.retryAll}
      />

      <main className="app-main">

        {/* ── IDLE: main input screen ── */}
        {appState === STATE.IDLE && (
          <div className="input-panel">
            <p className="input-hint">
              Spreek via Wispr Flow of het toetsenbord 🎙
            </p>
            <textarea
              ref={textareaRef}
              className="main-textarea"
              placeholder="Je memo verschijnt hier…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              autoFocus
            />
            <CategoryPicker selected={category} onChange={setCategory} />
            <div className="review-actions">
              <button
                className="btn btn--primary"
                onClick={handleSend}
                disabled={!text.trim()}
              >
                Verstuur naar Mem
              </button>
              {text && (
                <button className="btn btn--ghost" onClick={handleDiscard}>
                  Verwijder
                </button>
              )}
            </div>
            <p className="input-tip">Op Mac: ⌘+Enter om te versturen</p>
          </div>
        )}

        {/* ── SENDING ── */}
        {appState === STATE.SENDING && (
          <div className="status-panel">
            <div className="spinner" />
            <p className="status-text">Versturen naar Mem…</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {appState === STATE.SUCCESS && result && (
          <div className="status-panel status-panel--success">
            <div className="success-icon">{result.offline ? '⏳' : '✓'}</div>
            <p className="status-text status-text--big">
              {result.offline ? 'Opgeslagen voor later' : 'Opgeslagen in Mem!'}
            </p>
            <p className="status-subtext">{result.title}</p>
            {result.tags && (
              <p className="status-tags">{result.tags.map(t => `#${t}`).join(' ')}</p>
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {appState === STATE.ERROR && (
          <div className="status-panel status-panel--error">
            <p className="status-text">Versturen mislukt</p>
            <p className="error-msg">{sendError}</p>
            <div className="review-actions">
              <button className="btn btn--primary" onClick={handleSend}>Opnieuw proberen</button>
              <button className="btn btn--ghost" onClick={() => {
                offlineQueue.enqueue({ transcription: text.trim(), category });
                handleDiscard();
              }}>Later versturen</button>
              <button className="btn btn--ghost" onClick={handleDiscard}>Verwijder</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
