export function QueueStatus({ queueCount, isOnline, isRetrying, onRetry }) {
  if (queueCount === 0 && isOnline) return null;

  return (
    <div className={`queue-banner ${!isOnline ? 'queue-banner--offline' : 'queue-banner--pending'}`}>
      {!isOnline ? (
        <span>⚡ Offline — {queueCount} note{queueCount !== 1 ? 's' : ''} queued</span>
      ) : isRetrying ? (
        <span>⟳ Syncing {queueCount} queued note{queueCount !== 1 ? 's' : ''}…</span>
      ) : (
        <span>
          {queueCount} note{queueCount !== 1 ? 's' : ''} pending{' '}
          <button className="retry-btn" onClick={onRetry}>Retry now</button>
        </span>
      )}
    </div>
  );
}
