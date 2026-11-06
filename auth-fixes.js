(() => {
  const apiBase = String(window.VATVIT_API_URL || 'https://vatvit-api-jant.onrender.com').replace(/\/+$/, '');
  const localToken = localStorage.getItem('vatvit_token');
  const sessionToken = sessionStorage.getItem('vatvit_token');

  if (localToken && localToken.startsWith('demo-')) {
    localStorage.removeItem('vatvit_token');
    localStorage.removeItem('vatvit_user');
  }
  if (sessionToken && sessionToken.startsWith('demo-')) {
    sessionStorage.removeItem('vatvit_token');
    sessionStorage.removeItem('vatvit_user');
  }
  if (sessionToken && !sessionToken.startsWith('demo-')) {
    window.location.replace('dashboard.html');
  }

  const style = document.createElement('style');
  style.textContent = '.auth-feedback{margin:12px 0 0;color:#ff8b8b;font-size:.85rem;line-height:1.5}.submit:disabled{cursor:wait;opacity:.7}.social-btn:disabled{cursor:not-allowed;opacity:.6}';
  document.head.append(style);

  function getFeedback(form) {
    let feedback = form.querySelector('.auth-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'auth-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.append(feedback);
    }
    return feedback;
  }

  document.querySelectorAll('.social-btn').forEach(button => {
    button.disabled = true;
    button.textContent = `${button.textContent.trim()} (coming soon)`;
    button.setAttribute('aria-label', `${button.textContent.trim()} sign-in is coming soon`);
  });

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !['loginForm', 'registerForm'].includes(form.id)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const feedback = getFeedback(form);
    feedback.textContent = '';
    const submit = form.querySelector('button[type="submit"]');
    const originalText = submit.textContent;
    submit.disabled = true;
    submit.textContent = form.id === 'loginForm' ? 'Signing in…' : 'Creating account…';

    try {
      const isLogin = form.id === 'loginForm';
      const payload = isLogin
        ? {
            email: form.querySelector('#login-email').value.trim(),
            password: form.querySelector('#login-password').value
          }
        : {
            name: form.querySelector('#name').value.trim(),
            phone: form.querySelector('#phone').value.trim(),
            email: form.querySelector('#register-email').value.trim(),
            password: form.querySelector('#register-password').value
          };
      const response = await fetch(`${apiBase}/api/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('The sign-in service returned an unexpected response. Please try again later.');
      }
      if (!response.ok) throw new Error(data?.message || 'Unable to complete sign-in. Please try again.');
      if (!data?.token || !data?.user) throw new Error('The sign-in service returned an incomplete response. Please try again later.');

      const remember = form.querySelector('input[type="checkbox"]')?.checked === true;
      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem('vatvit_token');
      otherStorage.removeItem('vatvit_user');
      storage.setItem('vatvit_token', data.token);
      storage.setItem('vatvit_user', JSON.stringify(data.user));
      window.location.assign('dashboard.html');
    } catch (error) {
      feedback.textContent = error instanceof Error
        ? error.message
        : 'Unable to reach the sign-in service. Check your connection and try again.';
    } finally {
      submit.disabled = false;
      submit.textContent = originalText;
    }
  }, true);
})();