/* TATOOA voice agent, free browser-only mode (no API key, no server calls).
   - Listening: Web Speech API SpeechRecognition (he-IL). In Chrome the audio is processed by Google's
     speech service, so it needs an internet connection.
   - Speaking: speechSynthesis with a Hebrew voice (Windows needs a Hebrew voice installed).
   - "Brain": a keyword-matched answer list written from PRD.md, plus screen navigation (location.hash).
   This is NOT an AI model: it only answers what is listed below. Artists and prices in the app are demo data.
   When the PRD changes, update ANSWERS. */
(() => {
  'use strict';

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  // ---------- text helpers ----------
  const norm = s => String(s).toLowerCase()
    .replace(/[֑-ׇ]/g, '')            // niqqud and cantillation
    .replace(/[׳״'"`.,!?;:()\-–־]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const any = (t, words) => words.some(w => t.includes(w));
  const word = (t, list) => list.some(w => (' ' + t + ' ').includes(' ' + w + ' '));

  // ---------- screens the user can ask to open ----------
  const SCREENS = [
    { hash: '#/artist', name: 'אזור האמנים', words: ['אזור אמנים', 'אזור האמנים', 'אזור האמן', 'תיבת פניות', 'תיבת הפניות'] },
    { hash: '#/studio', name: 'סטודיו ההדמיה', words: ['סטודיו', 'הדמיה', 'הדמייה', 'סקיצה', 'סקיצות'] },
    { hash: '#/price', name: 'הערכת המחיר', words: ['מחיר', 'הערכה', 'הערכת'] },
    { hash: '#/artists', name: 'התאמת האמנים', words: ['אמנים', 'מקעקעים', 'התאמה'] },
    { hash: '#/home', name: 'מסך הבית', words: ['בית', 'ראשי', 'ההתחלה', 'התחלה'] }
  ];
  const GO_VERBS = ['קח', 'קחי', 'קחו', 'עבור', 'עברי', 'עבר', 'פתח', 'פתחי', 'לך', 'לכי', 'הצג', 'הצגי', 'הראה', 'הראי', 'תראי', 'תראה', 'תעבירי', 'תעביר', 'העבירי', 'העבר', 'נווט', 'חזור', 'חזרי', 'מסך'];

  // ---------- answers (from PRD.md) ----------
  const ANSWERS = [
    { id: 'deposit', re: ['מקדמה', 'עמלה', 'חמישה עשר', 'שמונים וחמישה', 'חמישה עשר אחוז'],
      say: 'המקדמה היא חמישה עשר אחוז ממחיר הקעקוע, ואת שמונים וחמישה האחוזים הנותרים משלמים בסטודיו. הלקוח לא משלם יותר ממחיר הקעקוע.' },
    { id: 'insurance', re: ['ביטוח'],
      say: 'ביטוח קעקוע הוא תיקונים חינם אחרי הקעקוע. הוא מגיע רק למי שסוגר את התור דרך האפליקציה.' },
    { id: 'watermark', re: ['סימן מים', 'סימן המים', 'סטנסיל', 'סימן מי'],
      say: 'על הסקיצה יש סימן מים של טאטואה. הוא יוסר, והאמן יקבל סטנסיל נקי, רק אחרי שהמקדמה נסלקה.' },
    { id: 'demo', re: ['אמיתי', 'אמיתיים', 'הדגמה', 'בדוי', 'באמת'],
      say: 'האמנים, הדירוגים והמחירים באב הטיפוס הם נתוני הדגמה בלבד. המחירים האמיתיים ייקבעו מסקר של כחמישים אמנים.' },
    { id: 'cover', re: ['כיסוי', 'לכסות', 'קעקוע ישן', 'קעקוע קיים', 'קאבר'],
      say: 'במצב כיסוי קעקוע ישן אפשר להניח סקיצה חדשה על הקעקוע הקיים ולראות אם היא מכסה אותו, בלי שייראה כמו כתם שחור. זה בסטודיו ההדמיה.' },
    { id: 'price', re: ['מחיר', 'עולה', 'עלות', 'תקציב', 'כמה זה'],
      say: 'הערכת המחיר נקבעת לפי גודל, סגנון, מיקום על הגוף, מורכבות, צבע וכיסוי קעקוע ישן. אם התקציב נמוך מדי אזהיר ואציע סקיצה קטנה יותר. אפשר לבקש ממני לעבור למסך המחיר.' },
    { id: 'artists', re: ['אמנים', 'מקעקע', 'אמן'],
      say: 'אחרי ההערכה מוצגים אמנים לפי סגנון, תקציב ודירוג, ואפשר לשלוח לאחד מהם בקשה להצעת מחיר. כל האמנים באב הטיפוס הם הדגמה.' },
    { id: 'age', re: ['גיל', 'שמונה עשרה', 'קטין'],
      say: 'השימוש מגיל שמונה עשרה, ובבקשת הצעת מחיר מאשרים גיל ותנאי שימוש.' },
    { id: 'medical', re: ['רפואי', 'אלרגיה', 'צלקת', 'צלקות', 'בריאות'],
      say: 'ההדמיה אינה התחייבות רפואית, ואינה מחליפה ייעוץ על אלרגיה לדיו או צלקות קיימות.' },
    { id: 'ip', re: ['זכויות יוצרים', 'זכויות', 'בינה מלאכותית', 'רפרנס'],
      say: 'סקיצות שנוצרות בבינה מלאכותית על בסיס רפרנס הן להשראה בלבד.' },
    { id: 'future', re: ['מציאות רבודה', 'לידר', 'עומק', 'גוון עור', 'דהייה', 'דהיה', 'מחשבון', 'וידאו'],
      say: 'מציאות רבודה, סריקת עומק, ניתוח גוון עור ומחשבון דהייה עדיין בקרוב, ואינם חלק מאב הטיפוס.' },
    { id: 'share', re: ['שיתוף', 'לשתף', 'וואטסאפ', 'סטורי'],
      say: 'אפשר לשתף את ההדמיה לסטורי או לוואטסאפ, עם סימן מים, ולקבל דעה מחברים לפני שמחליטים.' },
    { id: 'privacy', re: ['פרטיות', 'מידע רגיש', 'מוצפן'],
      say: 'בגרסה עם וידאו אזורים אינטימיים יטושטשו אוטומטית והמידע הרגיש יוצפן. באב הטיפוס הנוכחי אין שרת, והפניות נשמרות רק בדפדפן שלכם.' },
    { id: 'artistside', re: ['תיק לקוח', 'פניות', 'אמן מקבל', 'מצד האמן'],
      say: 'באזור האמנים יש תיבת פניות. לכל פנייה יש תיק לקוח, ואפשר לאשר, להציע מחיר או מועד אחר, או לדחות.' },
    { id: 'help', re: ['מה את יודעת', 'מה אפשר', 'עזרה', 'תעזרי', 'מה את יכולה', 'מה זה טאטואה', 'מה האפליקציה', 'מה זה'],
      say: 'אני יכולה לענות על מקדמה, מחיר, ביטוח קעקוע, סימן מים, כיסוי קעקוע, גיל והצהרות, ולעבור בין המסכים. מה תרצו לדעת?' }
  ];
  const GREETING = 'שלום! אני טאטואה, העוזרת הקולית. אפשר לשאול על מקדמה, מחיר, ביטוח קעקוע או סימן מים, ולבקש שאעביר אתכם למסך. במה אפשר לעזור?';
  const FALLBACK = 'לא הבנתי. אפשר לשאול על מקדמה, מחיר, ביטוח קעקוע, סימן מים או כיסוי קעקוע, או לבקש לעבור למסך.';

  /** Pure function: text in, {say, go?, stop?} out. Exposed for tests. */
  function answer(raw) {
    const t = norm(raw);
    if (!t) return { say: FALLBACK };
    if (word(t, ['די', 'עצור', 'עצרי', 'ביי', 'להתראות', 'סיום', 'תסיימי', 'סגרי', 'נגמר']))
      return { say: 'להתראות, בהצלחה עם הקעקוע!', stop: true };
    if (word(t, ['תודה', 'תודה רבה']) && t.split(' ').length <= 3) return { say: 'בשמחה!' };
    // Navigation: a "go" verb plus a screen word.
    if (any(t, GO_VERBS)) {
      const s = SCREENS.find(s => any(t, s.words));
      if (s) return { say: 'עוברת אל ' + s.name + '.', go: s.hash };
    }
    for (const a of ANSWERS) if (any(t, a.re)) return { say: a.say, id: a.id };
    if (word(t, ['שלום', 'היי', 'הי', 'אהלן', 'בוקר טוב', 'ערב טוב']) && t.split(' ').length <= 3) return { say: GREETING };
    return { say: FALLBACK };
  }

  // ---------- session ----------
  function create(h) {
    let rec = null, active = false, busy = false, voice = null, restart = null;

    const pickVoice = () => {
      const list = synth ? synth.getVoices() : [];
      voice = list.find(v => /^(he|iw)([-_]|$)/i.test(v.lang)) || null;
    };
    if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener('voiceschanged', pickVoice); }

    function speak(text) {
      return new Promise(resolve => {
        h.bot(text);
        if (!synth || !voice) return resolve();
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = voice; u.lang = voice.lang;
        let done = false, timer;
        const fin = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
        u.onend = fin; u.onerror = fin;
        timer = setTimeout(fin, 2000 + text.length * 110);   // Chrome sometimes never fires "end"
        synth.speak(u);
      });
    }

    function listen() {
      if (!active || busy) return;
      clearTimeout(restart);
      restart = setTimeout(() => {
        if (!active || busy) return;
        try {
          rec.start();
          h.setStatus(voice ? 'מקשיבה… דברו בעברית.' : 'מקשיבה… (אין קול עברי בדפדפן, התשובות יופיעו בכתב)', false);
        } catch { /* already started */ }
      }, 250);
    }

    async function handle(text) {
      busy = true;
      h.user(text);
      const r = answer(text);
      if (r.go) location.hash = r.go;
      h.setStatus('מדברת…', false);
      await speak(r.say);
      busy = false;
      if (r.stop) return stop();
      listen();
    }

    function fail(msg) { stop(true); h.setStatus(msg, true); }

    function init() {
      rec = new SR();
      rec.lang = 'he-IL'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = e => {
        const r = e.results[e.results.length - 1];
        const text = r && r[0] && r[0].transcript;
        if (r && r.isFinal && text) handle(text);
      };
      rec.onerror = e => {
        console.warn('speech recognition error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed')
          fail('המיקרופון חסום. לחצו על סמל המנעול ליד הכתובת, הגדירו מיקרופון ל"אפשר" ורעננו. אם זה לא עוזר: הגדרות Windows > פרטיות > מיקרופון.');
        else if (e.error === 'audio-capture') fail('לא נמצא מיקרופון. חברו מיקרופון או אוזניות ונסו שוב.');
        else if (e.error === 'network') fail('זיהוי הדיבור של Chrome צריך חיבור לאינטרנט. בדקו את החיבור ונסו שוב.');
        // "no-speech" and "aborted" are normal: onend restarts listening.
      };
      rec.onend = () => { if (active && !busy) listen(); };
    }

    async function start() {
      active = true; init();
      busy = true;
      await speak(GREETING);
      busy = false;
      listen();
    }

    function stop(silent) {
      if (!active && !silent) return;
      active = false; busy = false; clearTimeout(restart);
      try { rec && rec.abort(); } catch { }
      try { synth && synth.cancel(); } catch { }
      h.onEnd();
    }

    return { start, stop, get active() { return active; } };
  }

  window.TatooaLocalVoice = { supported: !!SR, create, answer };
})();
