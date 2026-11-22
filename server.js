'use strict';
// Local dev server for the TATOOA prototype.
// 1. Serves the static files (index.html, app.js, styles.css, voice.js).
// 2. POST /api/session asks OpenAI for a short-lived client secret for the Realtime API,
//    so the real OPENAI_API_KEY (read from .env) never reaches the browser.
// No dependencies: Node 18+ built-ins only.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;

function loadEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv(path.join(ROOT, '.env'));

const PORT = Number(process.env.PORT) || 8787;
const MODEL = process.env.REALTIME_MODEL || 'gpt-realtime-2.1';
const VOICE = process.env.REALTIME_VOICE || 'marin';

// What the voice agent knows. Facts here come from PRD.md; the artists and prices in the app are demo data.
const INSTRUCTIONS = `
את "טאטואה", העוזרת הקולית של TATOOA, אפליקציה שמחברת בין אנשים שרוצים קעקוע לבין אמני קעקועים.
דברי בעברית, בקול חם וקצר: משפט או שניים בכל פעם, ושאלה אחת בכל פעם.

מה האפליקציה עושה (אב-טיפוס):
1. סטודיו הדמיה: בוחרים אזור בגוף או מעלים תמונה, ומניחים סקיצה עליה. גוררים, משנים גודל, מסובבים ומשנים שקיפות. יש מצב כיסוי קעקוע ישן (Cover-Up) ושיתוף.
2. הערכת מחיר: לפי גודל, סגנון, מיקום, מורכבות, צבע וכיסוי. אם התקציב נמוך מדי, מזהירים ומציעים סקיצה קטנה יותר.
3. התאמת אמנים: 3 עד 5 אמנים לפי סגנון, תקציב ודירוג.
4. בקשה להצעת מחיר: מאשרים גיל 18 ומעלה ותנאי שימוש, ושולחים לאמן את הבקשה.

כללים שחשוב לך להגיד נכון:
- המקדמה היא 15% ממחיר הקעקוע, ו-85% משלמים בסטודיו. הלקוח לא משלם יותר ממחיר הקעקוע.
- הסימן המים על הסקיצה יוסר, והאמן יקבל סטנסיל נקי, רק אחרי שהמקדמה נסלקה.
- "ביטוח קעקוע" (תיקונים חינם) מגיע רק למי שסוגר דרך האפליקציה.
- ההדמיה להשראה בלבד. היא לא התחייבות רפואית ולא מחליפה ייעוץ על אלרגיה לדיו או צלקות. סקיצות AI הן להשראה בלבד.
- AR, LiDAR, ניתוח גוון עור ומחשבון דהייה עדיין "בקרוב".

חשוב: האמנים, הדירוגים והמחירים באב-הטיפוס הם נתוני הדגמה בלבד. אם שואלים על מחיר או אמן, אמרי שזו הדגמה ושהמחירים האמיתיים ייקבעו מסקר של כ-50 אמנים. אל תמציאי עובדות, מחירים או שמות שלא הוזכרו כאן. אם את לא יודעת, אמרי את זה.
בתחילת השיחה הציגי את עצמך במשפט אחד ושאלי איך אפשר לעזור.
`.trim();

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};
// Only these files are served; .env, .git, server.js etc. are never reachable.
const STATIC = new Set(['index.html', 'app.js', 'styles.css', 'voice.js']);
const HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function createSession(res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return send(res, 500, { error: 'OPENAI_API_KEY is missing. Copy .env.example to .env and put your key there.' });
  try {
    const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: { type: 'realtime', model: MODEL, instructions: INSTRUCTIONS, audio: { output: { voice: VOICE } } } })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.value) {
      console.error('OpenAI client_secrets failed:', r.status, JSON.stringify(data).slice(0, 400));
      return send(res, 502, { error: (data.error && data.error.message) || `OpenAI returned ${r.status}` });
    }
    send(res, 200, { value: data.value });
  } catch (e) {
    console.error('client_secrets request error:', e.message);
    send(res, 502, { error: 'Could not reach OpenAI: ' + e.message });
  }
}

const server = http.createServer((req, res) => {
  // Only answer requests addressed to localhost (blocks DNS-rebinding style abuse of the key).
  if (!HOSTS.has(req.headers.host)) return send(res, 403, { error: 'forbidden host' });
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/session') {
    // The custom header forces a CORS preflight for cross-site pages, which this server never answers.
    if (req.method !== 'POST' || req.headers['x-tatooa'] !== '1') return send(res, 405, { error: 'POST with X-Tatooa: 1 only' });
    return createSession(res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!STATIC.has(name)) return send(res, 404, { error: 'not found' });
  fs.readFile(path.join(ROOT, name), (err, buf) => {
    if (err) return send(res, 404, { error: 'not found' });
    send(res, 200, buf, MIME[path.extname(name)] || 'application/octet-stream');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`TATOOA is running at http://localhost:${PORT}`);
  console.log(process.env.OPENAI_API_KEY ? `Voice agent ready (model ${MODEL}).` : 'No OPENAI_API_KEY found: the app works, the voice agent will not connect.');
});
