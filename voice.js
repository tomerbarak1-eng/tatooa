/* TATOOA voice agent: browser side.
   Flow (OpenAI Realtime API over WebRTC):
   1. POST /api/session on our local server -> short-lived client secret (the real API key stays on the server).
   2. Create an RTCPeerConnection, send the microphone, open the "oai-events" data channel.
   3. POST the SDP offer to https://api.openai.com/v1/realtime/calls with the client secret -> SDP answer.
   The assistant's voice arrives on the audio track; its transcript arrives as data-channel events. */
(() => {
  'use strict';

  const L = {
    start: 'שיחה קולית', connecting: 'מתחבר…', stop: 'סיום שיחה',
    title: 'העוזרת הקולית',
    idle: 'לחצו על הכפתור ודברו בעברית.',
    live: 'מקשיבה… אפשר לדבר.',
    noMic: 'אין גישה למיקרופון. אשרו אותה בדפדפן ונסו שוב.',
    micBlocked: 'המיקרופון חסום. פתחו את http://localhost:8787 ב-Chrome רגיל (לא בתצוגה מקדימה בתוך אפליקציה), לחצו על סמל המנעול ליד הכתובת, הגדירו מיקרופון ל"אפשר", ורעננו. אם זה לא עוזר: הגדרות Windows > פרטיות > מיקרופון.',
    micMissing: 'לא נמצא מיקרופון במחשב. חברו מיקרופון או אוזניות ונסו שוב.',
    noServer: 'השרת המקומי לא ענה. הריצו npm start ופתחו את http://localhost:8787',
    noSecure: 'שיחה קולית עובדת רק מ-http://localhost:8787 (לא מפתיחת הקובץ ישירות).',
    failed: 'החיבור נכשל: '
  };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  // ---- UI ----
  const root = el('div', 'voice');
  const panel = el('div', 'voice-panel'); panel.hidden = true;
  const head = el('p', 'voice-title', L.title);
  const status = el('p', 'voice-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const log = el('div', 'voice-log'); log.setAttribute('aria-live', 'polite');
  const btn = el('button', 'voice-btn', L.start); btn.type = 'button';
  panel.append(head, status, log);
  root.append(panel, btn);
  document.body.append(root);

  // ---- state ----
  let pc = null, dc = null, mic = null, audio = null, busy = false, liveLine = null;

  function setStatus(msg, isError) { status.textContent = msg; status.classList.toggle('err', !!isError); }
  function setBtn(label, on) { btn.textContent = label; btn.classList.toggle('on', !!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function addLine(text) { const p = el('p', 'voice-line', text); log.append(p); log.scrollTop = log.scrollHeight; return p; }

  function teardown() {
    try { dc && dc.close(); } catch { }
    try { pc && pc.close(); } catch { }
    if (mic) mic.getTracks().forEach(t => t.stop());
    if (audio) { audio.srcObject = null; audio.remove(); }
    pc = dc = mic = audio = liveLine = null;
  }

  function stop(msg) {
    teardown(); busy = false; setBtn(L.start, false);
    setStatus(msg || L.idle, false);
  }

  function onEvent(e) {
    let ev; try { ev = JSON.parse(e.data); } catch { return; }
    switch (ev.type) {
      case 'response.output_audio_transcript.delta':
        if (!liveLine) liveLine = addLine('');
        liveLine.textContent += ev.delta || ''; log.scrollTop = log.scrollHeight; break;
      case 'response.output_audio_transcript.done':
        if (liveLine && ev.transcript) liveLine.textContent = ev.transcript;
        liveLine = null; break;
      case 'error':
        console.error('Realtime error event:', ev);
        setStatus(L.failed + ((ev.error && ev.error.message) || 'שגיאה לא ידועה'), true); break;
      default: console.debug('realtime event:', ev.type);
    }
  }

  async function start() {
    if (busy) return; busy = true;
    panel.hidden = false; log.textContent = '';
    if (!window.isSecureContext || !navigator.mediaDevices) { stop(L.noSecure); setStatus(L.noSecure, true); return; }
    setBtn(L.connecting, true); setStatus(L.connecting, false);
    try {
      // 1. short-lived secret from our server
      let r;
      try { r = await fetch('/api/session', { method: 'POST', headers: { 'X-Tatooa': '1' } }); }
      catch { throw new Error(L.noServer); }
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.value) throw new Error(data.error || L.noServer);

      // 2. peer connection + microphone + events channel
      pc = new RTCPeerConnection();
      audio = document.createElement('audio'); audio.autoplay = true; document.body.append(audio);
      pc.ontrack = ev => { audio.srcObject = ev.streams[0]; };
      pc.onconnectionstatechange = () => {
        if (!pc) return;
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') stop(L.failed + 'החיבור נותק');
      };
      try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (err) {
        console.error('getUserMedia failed:', err);
        const why = err && err.name === 'NotFoundError' ? L.micMissing
          : err && err.name === 'NotAllowedError' ? L.micBlocked
          : L.noMic + ' (' + (err && err.name) + ')';
        throw new Error(why);
      }
      pc.addTrack(mic.getAudioTracks()[0], mic);
      dc = pc.createDataChannel('oai-events');
      dc.addEventListener('message', onEvent);
      dc.addEventListener('open', () => {
        setBtn(L.stop, true); setStatus(L.live, false);
        // Ask the agent to open the conversation.
        dc.send(JSON.stringify({ type: 'response.create' }));
      });

      // 3. SDP exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdp = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST', body: offer.sdp,
        headers: { Authorization: 'Bearer ' + data.value, 'Content-Type': 'application/sdp' }
      });
      if (!sdp.ok) throw new Error('OpenAI ' + sdp.status + ' ' + (await sdp.text()).slice(0, 200));
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
    } catch (e) {
      console.error(e);
      teardown(); busy = false; setBtn(L.start, false);
      setStatus(e.message.startsWith(L.failed) ? e.message : L.failed + e.message, true);
    }
  }

  btn.addEventListener('click', () => { pc ? stop() : start(); });
  setStatus(L.idle, false);
  window.addEventListener('pagehide', teardown);
})();
