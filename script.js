let mode = 'sym';
let count = 0;

function setMode(m) {
  mode = m;
  const isSym = m === 'sym';

  document.getElementById('btn-sym').className = 'mode-btn sym' + (isSym ? ' active' : '');
  document.getElementById('btn-asym').className = 'mode-btn asym' + (!isSym ? ' active' : '');
  document.getElementById('sym-panel').style.display = isSym ? 'flex' : 'none';
  document.getElementById('asym-panel').style.display = isSym ? 'none' : 'flex';
  document.getElementById('status-dot').className = 'status-dot ' + (isSym ? 'sym' : 'asym');
  document.getElementById('mode-badge').className = 'mode-badge ' + (isSym ? 'sym' : 'asym');
  document.getElementById('mode-badge').textContent = isSym ? 'Symmetric · Caesar' : 'Asymmetric · Base64';
  document.getElementById('info-pill').className = 'info-pill ' + (isSym ? 'sym' : 'asym');
  document.getElementById('info-pill').textContent = isSym
    ? 'One shared key encrypts and decrypts. Like a lock and key both parties share.'
    : 'Public key encrypts (anyone can use it). Private key decrypts (only the receiver). Two different keys.';
  document.getElementById('send-btn').className = 'send-btn ' + (isSym ? 'sym-active' : 'asym-active');
}

function caesarEnc(text, shift) {
  return text.split('').map(c => {
    if (/[a-z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 97 + shift) % 26) + 97);
    if (/[A-Z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
    return c;
  }).join('');
}

function caesarDec(text, shift) {
  return caesarEnc(text, 26 - shift);
}

function b64enc(text) {
  try { return btoa(unescape(encodeURIComponent(text))); }
  catch (e) { return btoa(text); }
}

function b64dec(text) {
  try { return decodeURIComponent(escape(atob(text))); }
  catch (e) { return atob(text); }
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function quickSend(msg) {
  document.getElementById('msg-input').value = msg;
  sendMessage();
}

function sendMessage() {
  const inp = document.getElementById('msg-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';

  const empty = document.getElementById('empty-state');
  if (empty) empty.remove();

  count++;
  let enc, dec, keyInfo;

  if (mode === 'sym') {
    const s = Math.max(1, Math.min(25, parseInt(document.getElementById('shift-key').value) || 3));
    enc = caesarEnc(text, s);
    dec = caesarDec(enc, s);
    keyInfo = 'shift ' + s;
  } else {
    enc = b64enc(text);
    dec = b64dec(enc);
    keyInfo = 'pub/priv keys';
  }

  const card = document.createElement('div');
  card.className = 'msg-card';
  card.innerHTML = `
    <div class="msg-header">
      <span class="msg-num">Message ${count}</span>
      <span class="msg-tag ${mode}">${mode === 'sym' ? 'Caesar cipher' : 'Base64 encode'} · ${keyInfo}</span>
    </div>
    <div class="msg-rows">
      <div class="msg-row">
        <div class="row-label orig">Original</div>
        <div class="row-val">${esc(text)}</div>
      </div>
      <div class="msg-row">
        <div class="row-label enc">Encrypted</div>
        <div class="row-val enc">${esc(enc)}</div>
      </div>
      <div class="msg-row">
        <div class="row-label dec">Decrypted</div>
        <div class="row-val dec">${esc(dec)}</div>
      </div>
    </div>`;

  const msgs = document.getElementById('messages');
  msgs.appendChild(card);
  msgs.scrollTop = msgs.scrollHeight;
}

function clearMsgs() {
  const msgs = document.getElementById('messages');
  msgs.innerHTML = `
    <div class="empty-state" id="empty-state">
      <div class="empty-icon">
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="9" width="18" height="11" rx="2.5" stroke="#ccc" stroke-width="1.5" fill="none"/>
          <path d="M7 9V7a4 4 0 018 0v2" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <circle cx="11" cy="14.5" r="1.5" fill="#ccc"/>
        </svg>
      </div>
      <div style="font-weight:600;color:#bbb;font-size:14px">Send a message to see encryption in action</div>
      <div style="font-size:12px;color:#d0d0d8">Use the quick-send chips or type your own</div>
    </div>`;
  count = 0;
}
