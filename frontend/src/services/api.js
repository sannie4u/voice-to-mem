const BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

export async function submitNote({ transcription, manualCategory }) {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcription, manualCategory }),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `Server error ${res.status}`);
    err.retryable = data.retryable !== false && res.status >= 500;
    err.status = res.status;
    throw err;
  }

  return data;
}
