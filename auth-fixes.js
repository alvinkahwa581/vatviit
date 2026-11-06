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

  const mainContent = document.querySelector('.page-shell');
  if (mainContent && mainContent.parentElement === document.body) {
    const main = document.createElement('main');
    main.id = 'main-content';
    mainContent.before(main);
    main.append(mainContent);
    mainContent.style.minHeight = '100vh';
  }

  if (!document.querySelector('.skip-link') && document.querySelector('main')) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    document.body.prepend(skipLink);
    document.querySelector('main').id ||= 'main-content';
  }

  const tabs = [...document.querySelectorAll('.tab')];
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.id ||= `auth-tab-${index + 1}`;
    tab.setAttribute('aria-controls', `${tab.dataset.tab}-panel`);
    tab.setAttribute('aria-selected', String(tab.classList.contains('active')));
    tab.tabIndex = tab.classList.contains('active') ? 0 : -1;
  });

  document.querySelectorAll('.form-panel').forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `auth-tab-${panel.id === 'login-panel' ? '1' : '2'}`);
    panel.tabIndex = 0;
    panel.setAttribute('aria-hidden', String(!panel.classList.contains('active')));
  });

  function setTab(name) {
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === name;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('.form-panel').forEach(panel => {
      const selected = panel.id === `${name}-panel`;
      panel.classList.toggle('active', selected);
      panel.setAttribute('aria-hidden', String(!selected));
    });
    const swapLink = document.getElementById('swapLink');
    if (swapLink) swapLink.textContent = name === 'login' ? 'Create one' : 'Already have an account?';
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      tabs[nextIndex].focus();
      setTab(tabs[nextIndex].dataset.tab);
    });
  });

  document.querySelectorAll('.social-btn').forEach(button => {
    const provider = button.textContent.replace(/^Continue with\s+/i, '').trim();
    button.disabled = true;
    button.textContent = `Continue with ${provider} (coming soon)`;
    button.setAttribute('aria-label', `${provider} sign-in is not available yet`);
  });

  function getFeedback(form) {
    let feedback = form.querySelector('.auth-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'auth-feedback';
      feedback.setAttribute('role', 'alert');
      feedback.setAttribute('aria-live', 'assertive');
      feedback.tabIndex = -1;
      form.append(feedback);
    }
    return feedback;
  }

  document.querySelectorAll('#login-email, #register-email').forEach(input => {
    input.autocomplete = 'email';
  });
  const loginPassword = document.getElementById('login-password');
  if (loginPassword) loginPassword.autocomplete = 'current-password';
  const registerPassword = document.getElementById('register-password');
  if (registerPassword) registerPassword.autocomplete = 'new-password';
  const fullName = document.getElementById('name');
  if (fullName) fullName.autocomplete = 'name';
  const phone = document.getElementById('phone');
  if (phone) phone.autocomplete = 'tel';

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
    submit.setAttribute('aria-busy', 'true');
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
      feedback.focus();
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.textContent = originalText;
    }
  }, true);
})();