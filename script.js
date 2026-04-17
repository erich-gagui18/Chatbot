// --- GLOBAL VARIABLES ---
let mode = 'sym';
let count = 0;
window.messageKeys = {}; // Stores correct keys for each message

// --- UI AND MODE SWITCHING ---
function setMode(m) {
  mode = m;
  const isSym = m === 'sym';

  document.getElementById('btn-sym').className = 'mode-btn sym' + (isSym ? ' active' : '');
  document.getElementById('btn-asym').className = 'mode-btn asym' + (!isSym ? ' active' : '');
  document.getElementById('sym-panel').style.display = isSym ? 'flex' : 'none';
  document.getElementById('asym-panel').style.display = isSym ? 'none' : 'flex';
  document.getElementById('status-dot').className = 'status-dot ' + (isSym ? 'sym' : 'asym');
  
  // Update Sender Badge
  document.getElementById('mode-badge').className = 'mode-badge ' + (isSym ? 'sym' : 'asym');
  document.getElementById('mode-badge').textContent = isSym ? 'Symmetric · Caesar' : 'Asymmetric · Base64';
  
  // Update Receiver Badge
  document.getElementById('receiver-mode-badge').className = 'mode-badge ' + (isSym ? 'sym' : 'asym');
  document.getElementById('receiver-mode-badge').textContent = isSym ? 'Symmetric · Caesar' : 'Asymmetric · Base64';

  document.getElementById('info-pill').className = 'info-pill ' + (isSym ? 'sym' : 'asym');
  document.getElementById('info-pill').innerHTML = isSym
    ? 'One shared key encrypts and decrypts.<br>Like a lock and key both parties share.'
    : 'Public key encrypts (anyone can use it). Private key decrypts (only the receiver). Two different keys.';
  document.getElementById('send-btn').className = 'send-btn ' + (isSym ? 'sym-active' : 'asym-active');
  
  // Update Receiver Input UI dynamically based on mode
  document.getElementById('receiver-input-label').textContent = isSym ? 'Enter Shift Key (1-25) to decrypt' : 'Enter Private Key to decrypt';
  document.getElementById('global-key-input').placeholder = isSym ? 'e.g., 3' : 'PRV:...';
  document.getElementById('global-key-input').type = isSym ? 'number' : 'text';
  document.getElementById('global-key-input').value = '';
}

// --- ENCRYPTION HELPER FUNCTIONS ---
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

// --- CHAT FUNCTIONS ---
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
  const recEmpty = document.getElementById('receiver-empty-state');
  if (recEmpty) recEmpty.remove();

  count++;
  let enc, dec, keyInfo, correctKey;
  let currentMode = mode;

  if (currentMode === 'sym') {
    const s = Math.max(1, Math.min(25, parseInt(document.getElementById('shift-key').value) || 3));
    enc = caesarEnc(text, s);
    dec = caesarDec(enc, s);
    keyInfo = 'shift ' + s;
    correctKey = s.toString();
  } else {
    enc = b64enc(text);
    dec = b64dec(enc);
    keyInfo = 'pub/priv keys';
    correctKey = 'PRV:Yz3nR9!qW7pL'; 
  }

  window.messageKeys[count] = correctKey;

  const senderCard = document.createElement('div');
  senderCard.className = 'msg-card';
  senderCard.innerHTML = `
    <div class="msg-header">
      <span class="msg-num">Message ${count}</span>
      <span class="msg-tag ${currentMode}">${currentMode === 'sym' ? 'Caesar cipher' : 'Base64 encode'} · ${keyInfo}</span>
    </div>
    <div class="msg-rows">
      <div class="msg-row">
        <div class="row-label orig">Original Message</div>
        <div class="row-val">${esc(text)}</div>
      </div>
      <div class="msg-row">
        <div class="row-label enc">Sent out (Encrypted)</div>
        <div class="row-val enc">${esc(enc)}</div>
      </div>
    </div>`;

  const receiverCard = document.createElement('div');
  receiverCard.className = 'msg-card';
  receiverCard.innerHTML = `
    <div class="msg-header">
      <span class="msg-num">Message ${count}</span>
      <span class="msg-tag ${currentMode}">${currentMode === 'sym' ? 'Caesar cipher' : 'Base64 locked'}</span>
    </div>
    <div class="msg-rows">
      <div class="msg-row">
        <div class="row-label enc">Received (Encrypted)</div>
        <div class="row-val enc">${esc(enc)}</div>
      </div>
      
      <div class="msg-row" id="msg-locked-${count}">
        <div class="row-label">Status</div>
        <div class="row-val" style="color: #d93025; font-size: 13px; font-weight: 600;">
          🔒 Locked — Enter key below
        </div>
      </div>

      <div class="msg-row" id="dec-result-${count}" style="display:none;">
        <div class="row-label dec">Decrypted Text</div>
        <div class="row-val dec">${esc(dec)}</div>
      </div>
    </div>`;

  const msgs = document.getElementById('messages');
  msgs.appendChild(senderCard);
  msgs.scrollTop = msgs.scrollHeight;

  const recMsgs = document.getElementById('receiver-messages');
  recMsgs.appendChild(receiverCard);
  recMsgs.scrollTop = recMsgs.scrollHeight;
}

function attemptDecrypt() {
  const inputEl = document.getElementById('global-key-input');
  const inputVal = inputEl.value.trim();
  if (!inputVal) return;

  let decryptedSomething = false;

  for (let id in window.messageKeys) {
    if (window.messageKeys[id] === inputVal) {
      const resultEl = document.getElementById('dec-result-' + id);
      const lockedEl = document.getElementById('msg-locked-' + id);
      
      if (resultEl && lockedEl && resultEl.style.display === 'none') {
        resultEl.style.display = 'flex';
        lockedEl.style.display = 'none';
        decryptedSomething = true;
      }
    }
  }

  if (decryptedSomething) {
    inputEl.value = ''; 
    inputEl.style.borderColor = '#1DAE80';
    inputEl.style.backgroundColor = '#E6F5EF';
    setTimeout(() => {
      inputEl.style.borderColor = '';
      inputEl.style.backgroundColor = '#f8f8fc';
    }, 800);
  } else {
    inputEl.style.borderColor = '#d93025'; 
    inputEl.style.backgroundColor = '#FCE8E6';
    setTimeout(() => {
      inputEl.style.borderColor = '';
      inputEl.style.backgroundColor = '#f8f8fc';
    }, 800);
  }
}

function clearMsgs() {
  count = 0;
  window.messageKeys = {};
  
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
    
  const recMsgs = document.getElementById('receiver-messages');
  recMsgs.innerHTML = `
    <div class="empty-state" id="receiver-empty-state">
      <div class="empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
      <div style="font-weight:600;color:#bbb;font-size:14px">Waiting for incoming messages...</div>
    </div>`;
}
// Enable horizontal scrolling for the chips wrapper using the mouse wheel
const chipsWrapper = document.querySelector('.chips-wrapper');
if (chipsWrapper) {
  chipsWrapper.addEventListener('wheel', (evt) => {
    evt.preventDefault(); // Prevents the page from scrolling vertically
    chipsWrapper.scrollLeft += evt.deltaY; // Translates vertical wheel movement to horizontal scrolling
  });
}
