const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const Sentry = require('@sentry/node');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'vatvit-dev-secret';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const requestCounts = new Map();
const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'vatvit-dev-secret') {
  throw new Error('JWT_SECRET must be configured in production.');
}

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.static(__dirname));

async function ensureStorage() {
  if (database) {
    await database.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS waitlist (
        email TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL
      );
    `);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readUsers() {
  await ensureStorage();
  if (database) {
    const result = await database.query('SELECT id, name, phone, email, password, created_at AS "createdAt" FROM users ORDER BY created_at');
    return result.rows;
  }
  const content = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(content || '[]');
}

async function writeUsers(users) {
  if (database) {
    await database.query('DELETE FROM users');
    for (const user of users) {
      await database.query('INSERT INTO users (id, name, phone, email, password, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [user.id, user.name, user.phone, user.email, user.password, user.createdAt]);
    }
    return;
  }
  await ensureStorage();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

async function readWaitlist() {
  await ensureStorage();
  if (database) {
    const result = await database.query('SELECT email, created_at AS "createdAt" FROM waitlist ORDER BY created_at');
    return result.rows;
  }
  try {
    const content = await fs.readFile(WAITLIST_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(WAITLIST_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
}

async function writeWaitlist(entries) {
  if (database) {
    for (const entry of entries) {
      await database.query('INSERT INTO waitlist (email, created_at) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [entry.email, entry.createdAt]);
    }
    return;
  }
  await ensureStorage();
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function rateLimit(key, limit = 8, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.startedAt > windowMs) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

async function notifyWaitlist(email) {
  if (!process.env.RESEND_API_KEY || !process.env.WAITLIST_NOTIFY_EMAIL) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.WAITLIST_FROM_EMAIL || 'VaTViT <onboarding@resend.dev>',
      to: [process.env.WAITLIST_NOTIFY_EMAIL],
      subject: 'New VaTViT early-access request',
      text: `New waitlist email: ${email}`,
    }),
  });
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, message: 'VaTViT auth service is running.' });
});

app.post('/api/waitlist', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(`waitlist:${ip}`)) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const entries = await readWaitlist();
    if (!entries.some((entry) => entry.email === email)) {
      entries.push({ email, createdAt: new Date().toISOString() });
      await writeWaitlist(entries);
      await notifyWaitlist(email);
    }

    return res.status(201).json({ message: 'You are on the early-access list.' });
  } catch (error) {
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    return res.status(500).json({ message: 'Unable to join the waitlist right now.' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body || {};

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'Please complete all fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const users = await readUsers();
    const exists = users.some((user) => user.email.toLowerCase() === String(email).toLowerCase());

    if (exists) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    const token = signToken(newUser);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const users = await readUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === String(email).trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(String(password), user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Welcome back.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'forgot-password.html'));
});

app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify-email.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'welcome.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VaTViT auth server is running on http://localhost:${PORT}`);
});
