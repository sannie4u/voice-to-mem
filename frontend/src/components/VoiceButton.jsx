export function VoiceButton({ isListening, onStart, onStop, disabled }) {
  const handleClick = () => {
    if (disabled) return;
    isListening ? onStop() : onStart();
  };

  return (
    <div className="voice-button-wrap">
      {isListening && (
        <>
          <div className="pulse-ring pulse-ring-1" />
          <div className="pulse-ring pulse-ring-2" />
        </>
      )}
      <button
        className={`voice-btn ${isListening ? 'voice-btn--active' : ''} ${disabled ? 'voice-btn--disabled' : ''}`}
        onClick={handleClick}
        onTouchEnd={e => { e.preventDefault(); handleClick(); }}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
        disabled={disabled}
      >
        {isListening ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.94V22h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.06A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z" />
          </svg>
        )}
      </button>
      <p className="voice-btn-label">
        {isListening ? 'Tap to stop' : 'Tap to speak'}
      </p>
    </div>
  );
}
