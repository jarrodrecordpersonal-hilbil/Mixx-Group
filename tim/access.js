/* The code is never bundled here. Only authenticated ciphertext is published. */
(() => {
  const form = document.getElementById('access-form');
  const field = document.getElementById('access-code');
  const button = document.getElementById('open-brief');
  const error = document.getElementById('access-error');
  const show = document.getElementById('show-code');
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  show.addEventListener('click', () => {
    const visible = field.type === 'password';
    field.type = visible ? 'text' : 'password';
    show.textContent = visible ? 'Hide' : 'Show';
    show.setAttribute('aria-pressed', String(visible));
    show.setAttribute('aria-label', visible ? 'Hide access code' : 'Show access code');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    error.textContent = '';
    field.removeAttribute('aria-invalid');
    if (!window.isSecureContext || !window.crypto?.subtle) {
      error.textContent = 'Please open this page over HTTPS in a current browser.';
      return;
    }
    const normalized = field.value.toUpperCase().replace(/[\s-]/g, '');
    if (!normalized) { field.focus(); return; }
    button.disabled = true;
    button.firstElementChild.textContent = 'Opening…';
    let payload;
    try {
      const response = await fetch('/tim/brief.enc.json', { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Unavailable');
      payload = await response.json();
      if (payload.version !== 1 || payload.iterations !== 600000 || payload.algorithm !== 'AES-256-GCM') throw new Error('Unsupported brief');
    } catch {
      error.textContent = 'The briefing could not be loaded. Check your connection and try again.';
      button.disabled = false;
      button.firstElementChild.textContent = 'Open the brief';
      return;
    }
    try {
      const encoder = new TextEncoder();
      const material = await crypto.subtle.importKey('raw', encoder.encode(normalized), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode(payload.salt), iterations: payload.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv), additionalData: encoder.encode('mixxgroup.com/tim:brief:v1') }, key, decode(payload.ciphertext));
      const html = new TextDecoder('utf-8', { fatal: true }).decode(clear);
      field.value = '';
      document.open();
      document.write(html);
      document.close();
    } catch {
      error.textContent = 'That code did not open the brief. Check the code and try again.';
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      button.disabled = false;
      button.firstElementChild.textContent = 'Open the brief';
    }
  });
})();
