(() => {
  const apiBase = String(window.VATVIT_API_URL || 'https://vatvit-api-jant.onrender.com').replace(/\/+$/, '');
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.form-panel')];
  const challenge = document.getElementById('auth-challenge');
  let rememberSession = false;

  const existingToken = localStorage.getItem('vatvit_token') || sessionStorage.getItem('vatvit_token');
  if (existingToken && !existingToken.startsWith('demo-')) {
    window.location.replace('dashboard.html');
    return;
  }
  if (existingToken) {
    localStorage.removeItem('vatvit_token');
    localStorage.removeItem('vatvit_user');
    sessionStorage.removeItem('vatvit_token');
    sessionStorage.removeItem('vatvit_user');
  }

  function selectTab(name) {
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === name;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => {
      const selected = panel.id === `${name}-panel`;
      panel.hidden = !selected;
      panel.setAttribute('aria-hidden', String(!selected));
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      tabs[next].focus();
      selectTab(tabs[next].dataset.tab);
    });
  });
  document.querySelectorAll('[data-switch-tab]').forEach(button => button.addEventListener('click', () => selectTab(button.dataset.switchTab)));

  async function apiRequest(path, payload) {
    let response;
    try {
      response = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error('Unable to reach the sign-in service. Check your connection and try again.');
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('The sign-in service returned an unexpected response. Please try again later.');
    }
    if (!response.ok) throw new Error(data.message || 'Unable to complete sign-in. Please try again.');
    return data;
  }

  function clearChallenge() {
    challenge.replaceChildren();
    challenge.hidden = true;
    tabs.forEach(tab => { tab.hidden = false; });
    panels.forEach(panel => { panel.hidden = panel.id !== 'login-panel'; });
    selectTab('login');
    document.getElementById('login-email').focus();
  }

  function beginChallengeMode() {
    tabs.forEach(tab => { tab.hidden = true; });
    panels.forEach(panel => { panel.hidden = true; });
    challenge.hidden = false;
    challenge.replaceChildren();
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function saveSession(data) {
    if (!data.token || !data.user) throw new Error('The sign-in service returned an incomplete response. Please try again later.');
    const storage = rememberSession ? localStorage : sessionStorage;
    const otherStorage = rememberSession ? sessionStorage : localStorage;
    otherStorage.removeItem('vatvit_token');
    otherStorage.removeItem('vatvit_user');
    storage.setItem('vatvit_token', data.token);
    storage.setItem('vatvit_user', JSON.stringify(data.user));
    window.location.assign('dashboard.html');
  }

  function showRecoveryCodes(data) {
    beginChallengeMode();
    challenge.append(element('h2', 'Save your recovery codes'));
    challenge.append(element('p', 'These codes are shown once. Store them somewhere private; each can replace one authenticator code.', 'hint'));
    const list = element('ul', null, 'recovery-list');
    data.recoveryCodes.forEach(code => list.append(element('li', code)));
    challenge.append(list);
    const feedback = element('p', '', 'auth-feedback');
    feedback.setAttribute('role', 'status');
    challenge.append(feedback);
    const saved = element('button', 'I saved my recovery codes', 'submit');
    saved.type = 'button';
    saved.addEventListener('click', () => saveSession(data));
    challenge.append(saved);
  }

  function showChallenge(data) {
    if (!data.challengeToken || !['verify_email', 'enroll_totp', 'verify_totp'].includes(data.stage)) {
      throw new Error('The sign-in service returned an invalid verification step. Please try again.');
    }
    beginChallengeMode();
    const headings = {
      verify_email: 'Verify your email',
      enroll_totp: 'Set up an authenticator app',
      verify_totp: 'Enter your authenticator code'
    };
    challenge.append(element('h2', headings[data.stage]));
    const descriptions = {
      verify_email: 'Enter the six-digit code sent to your email. The code expires in 10 minutes.',
      enroll_totp: 'Add VaTViT to an authenticator app, then enter the current six-digit code to confirm setup.',
      verify_totp: 'Enter the current code from your authenticator app. You can also use one unused recovery code.'
    };
    challenge.append(element('p', data.message || descriptions[data.stage], 'hint'));
    if (data.stage === 'enroll_totp') {
      challenge.append(element('p', 'In your authenticator app, choose Add account manually and enter this setup key:', 'hint'));
      const secret = element('input', null, 'challenge-secret');
      secret.value = data.secret;
      secret.readOnly = true;
      secret.setAttribute('aria-label', 'Authenticator setup key');
      challenge.append(secret);
      const copy = element('button', 'Copy setup key', 'secondary');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        const feedback = challenge.querySelector('[role="alert"]');
        try {
          await navigator.clipboard.writeText(data.secret);
          feedback.textContent = 'Setup key copied.';
          feedback.setAttribute('role', 'status');
        } catch {
          secret.focus();
          secret.select();
          feedback.textContent = 'Copy was not available. Select and copy the setup key above.';
        }
      });
      challenge.append(copy);
    }

    const form = element('form');
    const label = element('label', data.stage === 'verify_email' ? 'Email verification code' : 'Authenticator or recovery code');
    const input = element('input');
    input.type = 'text';
    input.autocomplete = 'one-time-code';
    input.inputMode = 'text';
    input.maxLength = 32;
    input.required = true;
    input.setAttribute('aria-label', label.textContent);
    label.append(input);
    form.append(label);
    const feedback = element('p', '', 'auth-feedback');
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'assertive');
    feedback.tabIndex = -1;
    form.append(feedback);
    const submit = element('button', 'Verify and continue', 'submit');
    submit.type = 'submit';
    form.append(submit);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      feedback.textContent = '';
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      try {
        const endpoint = data.stage === 'verify_email' ? '/api/auth/verify-email' : '/api/auth/verify-totp';
        const result = await apiRequest(endpoint, { challengeToken: data.challengeToken, code: input.value.trim() });
        if (result.stage) {
          showChallenge(result);
        } else if (Array.isArray(result.recoveryCodes) && result.recoveryCodes.length) {
          showRecoveryCodes(result);
        } else {
          saveSession(result);
        }
      } catch (error) {
        feedback.textContent = error instanceof Error ? error.message : 'Unable to verify that code. Please try again.';
        feedback.focus();
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      }
    });
    challenge.append(form);

    if (data.stage === 'verify_email') {
      const resend = element('button', 'Send a new email code', 'secondary');
      resend.type = 'button';
      resend.addEventListener('click', async () => {
        const feedback = form.querySelector('[role="alert"]');
        feedback.textContent = '';
        resend.disabled = true;
        try {
          const result = await apiRequest('/api/auth/resend-email-otp', { challengeToken: data.challengeToken });
          showChallenge(result);
        } catch (error) {
          feedback.textContent = error instanceof Error ? error.message : 'Unable to send another code right now.';
          feedback.focus();
        } finally {
          resend.disabled = false;
        }
      });
      challenge.append(resend);
    }
    const restart = element('button', 'Return to sign in', 'secondary');
    restart.type = 'button';
    restart.addEventListener('click', clearChallenge);
    challenge.append(restart);
    input.focus();
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !['loginForm', 'registerForm'].includes(form.id)) return;
    event.preventDefault();
    const feedback = form.querySelector('.auth-feedback');
    const submit = form.querySelector('button[type="submit"]');
    const originalText = submit.textContent;
    feedback.textContent = '';
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = form.id === 'loginForm' ? 'Signing in…' : 'Creating account…';
    try {
      const isLogin = form.id === 'loginForm';
      const payload = isLogin
        ? { email: form.querySelector('#login-email').value.trim(), password: form.querySelector('#login-password').value }
        : {
            name: form.querySelector('#name').value.trim(),
            phone: form.querySelector('#phone').value.trim(),
            email: form.querySelector('#register-email').value.trim(),
            password: form.querySelector('#register-password').value
          };
      rememberSession = isLogin && form.querySelector('input[type="checkbox"]')?.checked === true;
      const result = await apiRequest(`/api/${isLogin ? 'login' : 'register'}`, payload);
      if (result.stage) showChallenge(result);
      else saveSession(result);
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : 'Unable to complete sign-in. Please try again.';
      feedback.focus();
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.textContent = originalText;
    }
  });
})();