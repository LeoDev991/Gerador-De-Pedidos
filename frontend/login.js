async function apiJSON(url, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

function show(el, yes = true) { el.classList.toggle('hidden', !yes); }

document.getElementById('showRegister').addEventListener('click', () => {
  show(document.getElementById('registerCard'), true);
});
document.getElementById('cancelRegister').addEventListener('click', () => {
  show(document.getElementById('registerCard'), false);
});

document.getElementById('btnRegister').addEventListener('click', async () => {
  const u = document.getElementById('regUsername').value.trim();
  const p = document.getElementById('regPassword').value;
  const fb = document.getElementById('regFeedback');
  fb.textContent = '';
  if (!u || !p) return fb.textContent = 'Preencha usuário e senha';
  try {
    const res = await apiJSON('/api/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.user.username || u);
      location.href = '/';
    } else {
      fb.textContent = res.error || 'Erro';
    }
  } catch (err) { fb.textContent = err.message || err; }
});

document.getElementById('btnLogin').addEventListener('click', async () => {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  const fb = document.getElementById('loginFeedback');
  fb.textContent = '';
  if (!u || !p) return fb.textContent = 'Preencha usuário e senha';
  try {
    const res = await apiJSON('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.user.username || u);
      location.href = '/';
    } else {
      fb.textContent = res.error || 'Credenciais inválidas';
    }
  } catch (err) { fb.textContent = err.message || err; }
});

// If already logged in, go to main
if (localStorage.getItem('token')) {
  location.href = '/';
}
