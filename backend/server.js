require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const fetch = require('node-fetch');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// In production: serve built frontend from ../frontend/dist
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
}

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Claude: clean + categorize transcription ────────────────────────────────

async function analyzeTranscription(transcription) {
  if (!anthropic) throw new Error('No Anthropic API key');

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: 'You process quick voice memos. Always respond with valid JSON only — no markdown, no explanation.',
    messages: [{
      role: 'user',
      content: `Voice memo transcription: "${transcription}"

Return JSON:
{
  "cleaned": "corrected transcription (fix speech-to-text errors, add punctuation)",
  "category": "todo|idea|callback|research|note",
  "title": "concise title under 60 chars",
  "tags": ["tag1", "tag2"]
}

Category rules:
- todo: tasks, action items ("need to", "buy", "fix", "do")
- callback: people to call/message, follow-ups ("call", "email", "message", "reach out")
- idea: creative thoughts, brainstorms ("what if", "could we", "imagine")
- research: things to look up ("look into", "research", "find out", "check")
- note: everything else`,
    }],
  });

  const text = msg.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid JSON from Claude');
  return JSON.parse(match[0]);
}

// ─── Mem API: create note ─────────────────────────────────────────────────────

async function createMemNote({ title, body, tags, category }) {
  if (!process.env.MEM_API_KEY) throw new Error('MEM_API_KEY not set');

  const tagLine = tags.map(t => `#${t.replace(/\s+/g, '-')}`).join(' ');
  const content = `# ${title}\n\n${body}\n\n---\n${tagLine}`;

  const res = await fetch('https://api.mem.ai/v2/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw Object.assign(new Error(`Mem API ${res.status}: ${errText}`), {
      status: res.status,
      retryable: res.status >= 500 || res.status === 429,
    });
  }

  return res.json();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    claude: !!anthropic,
    mem: !!process.env.MEM_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/notes', async (req, res) => {
  const { transcription, manualCategory } = req.body;

  if (!transcription?.trim()) {
    return res.status(400).json({ error: 'transcription is required' });
  }

  let noteData = null;

  // Step 1: Try Claude for cleanup + categorization
  if (anthropic) {
    try {
      noteData = await analyzeTranscription(transcription);
    } catch (err) {
      console.warn('[claude] Analysis failed, using fallback:', err.message);
    }
  }

  // Step 2: Fallback — basic auto-tagging without Claude
  if (!noteData) {
    const category = manualCategory || detectCategoryLocal(transcription);
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    noteData = {
      cleaned: transcription,
      category,
      title: `${capitalize(category)} — ${time}`,
      tags: [category, 'voice-memo'],
    };
  }

  // Ensure voice-memo tag is always present
  if (!noteData.tags.includes('voice-memo')) noteData.tags.push('voice-memo');
  if (manualCategory && noteData.category !== manualCategory) {
    noteData.category = manualCategory;
    noteData.tags = [manualCategory, ...noteData.tags.filter(t => t !== noteData.category)];
  }

  // Step 3: Create note in Mem
  try {
    const capturedAt = new Date().toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const body = `${noteData.cleaned}\n\n*Captured via voice · ${capturedAt}*`;
    const memNote = await createMemNote({ ...noteData, body });

    return res.json({
      success: true,
      noteId: memNote.id,
      category: noteData.category,
      title: noteData.title,
      cleaned: noteData.cleaned,
      tags: noteData.tags,
    });
  } catch (err) {
    console.error('[mem] Failed to create note:', err.message);
    return res.status(err.status || 500).json({
      error: err.message,
      retryable: err.retryable !== false,
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectCategoryLocal(text) {
  const t = text.toLowerCase();
  if (/\b(call|phone|email|message|text|reach out|contact|follow.?up)\b/.test(t)) return 'callback';
  if (/\b(research|look.?up|google|find out|investigate|read about|check)\b/.test(t)) return 'research';
  if (/\b(idea|what if|could|imagine|maybe|concept|brainstorm)\b/.test(t)) return 'idea';
  if (/\b(todo|to.do|need to|should|must|buy|fix|finish|complete|remind)\b/.test(t)) return 'todo';
  return 'note';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── In production: all non-API routes serve the React app ───────────────────

if (isProd) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎙  Voice-to-Mem backend`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Claude cleanup: ${anthropic ? '✓' : '✗ (set ANTHROPIC_API_KEY)'}`);
  console.log(`   Mem API:        ${process.env.MEM_API_KEY ? '✓' : '✗ (set MEM_API_KEY)'}\n`);
});
