'use strict';

const crypto = require('crypto');

const OTP_TTL_MINUTES = 10;
const MAX_CHALLENGE_ATTEMPTS = 5;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(input) {
  let bits = '';
  for (const byte of input) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let offset = 0; offset < bits.length; offset += 5) {
    output += BASE32[parseInt(bits.slice(offset, offset + 5).padEnd(5, '0'), 2)];
  }
  return output;
}

function base32Decode(value) {
  const normalized = value.toUpperCase().replace(/=+$/g, '');
  let bits = '';
  for (const character of normalized) {
    const index = BASE32.indexOf(character);
    if (index < 0) throw new Error('Invalid base32 value.');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpAt(secret, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 30000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return { code: String(value).padStart(6, '0'), step: counter };
}

function matchTotp(secret, code, timeMs = Date.now(), afterStep = -1) {
  if (!/^\d{6}$/.test(code)) return null;
  for (const drift of [-1, 0, 1]) {
    const step = Math.floor(timeMs / 30000) + drift;
    if (step <= afterStep) continue;
    const expected = totpAt(secret, step * 30000).code;
    const left = Buffer.from(expected);
    const right = Buffer.from(code);
    if (left.length === right.length && crypto.timingSafeEqual(left, right)) return step;
  }
  return null;
}

function digest(value, key) {
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

function encryptionKey() {
  const value = process.env.MFA_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('MFA_ENCRYPTION_KEY must be a 32-byte hexadecimal key.');
  return Buffer.from(value, 'hex');
}

function encryptSecret(secret, key = encryptionKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

function decryptSecret(encrypted, key = encryptionKey()) {
  const [iv, tag, ciphertext] = encrypted.split('.').map(part => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !ciphertext) throw new Error('Invalid encrypted authenticator secret.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function newTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function newRecoveryCodes() {
  return Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex').toUpperCase());
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function safeEqualHex(left, right) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function installAuthMfa(app, { database, bcrypt, jwt, jwtSecret, sanitizeUser }) {
  let schemaPromise;

  async function ensureSchema() {
    if (!database) throw new Error('Account verification requires the configured database.');
    if (!schemaPromise) {
      schemaPromise = database.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE IF NOT EXISTS auth_mfa (
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          totp_secret TEXT,
          totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          last_totp_step BIGINT NOT NULL DEFAULT -1
        );
        CREATE TABLE IF NOT EXISTS auth_challenges (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'enroll_totp', 'login_totp')),
          code_hash TEXT,
          secret TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS auth_challenges_user_created ON auth_challenges (user_id, created_at DESC);
        CREATE TABLE IF NOT EXISTS auth_recovery_codes (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, code_hash)
        );
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
          rate_key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at TIMESTAMPTZ NOT NULL
        );
      `).catch(error => {
        schemaPromise = null;
        throw error;
      });
    }
    await schemaPromise;
    encryptionKey();
    if (!process.env.RESEND_API_KEY || !process.env.WAITLIST_FROM_EMAIL) {
      throw new Error('Email delivery is not configured.');
    }
  }

  function failClosed(error, res, fallback) {
    console.error('Authentication verification error:', error.message);
    return res.status(error.message.includes('not configured') || error.message.includes('requires the configured') ? 503 : 500)
      .json({ message: fallback });
  }

  async function rateLimit(key, limit, windowMinutes = 60) {
    const hashedKey = digest(key, jwtSecret);
    const result = await database.query(`
      INSERT INTO auth_rate_limits (rate_key, count, reset_at)
      VALUES ($1, 1, NOW() + ($3 * INTERVAL '1 minute'))
      ON CONFLICT (rate_key) DO UPDATE SET
        count = CASE WHEN auth_rate_limits.reset_at <= NOW() THEN 1 ELSE auth_rate_limits.count + 1 END,
        reset_at = CASE WHEN auth_rate_limits.reset_at <= NOW() THEN NOW() + ($3 * INTERVAL '1 minute') ELSE auth_rate_limits.reset_at END
      RETURNING count
    `, [hashedKey, limit, windowMinutes]);
    return result.rows[0].count <= limit;
  }

  async function createChallenge(userId, purpose, { codeHash = null, secret = null } = {}) {
    const token = newToken();
    const tokenHash = digest(token, jwtSecret);
    await database.query(
      'INSERT INTO auth_challenges (token_hash, user_id, purpose, code_hash, secret, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + ($6 * INTERVAL \'1 minute\'))',
      [tokenHash, userId, purpose, codeHash, secret, OTP_TTL_MINUTES]
    );
    return token;
  }

  async function emailCode(user, purpose = 'verify_email') {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const token = await createChallenge(user.id, purpose, { codeHash: digest(code, jwtSecret) });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.WAITLIST_FROM_EMAIL,
        to: [user.email],
        subject: 'Your VaTViT verification code',
        text: `Your VaTViT verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`,
      }),
    });
    if (!response.ok) {
      await database.query('DELETE FROM auth_challenges WHERE token_hash = $1', [digest(token, jwtSecret)]);
      console.error('Email provider rejected an authentication email:', response.status);
      throw new Error('Email delivery failed.');
    }
    return token;
  }

  function setupDetails(user, secret) {
    const issuer = 'VaTViT';
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const query = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
    return { secret, otpauthUrl: `otpauth://totp/${label}?${query.toString()}` };
  }

  async function createEnrollment(user) {
    const secret = newTotpSecret();
    const encryptedSecret = encryptSecret(secret);
    await database.query(
      'INSERT INTO auth_mfa (user_id, totp_secret, totp_enabled, last_totp_step) VALUES ($1, $2, FALSE, -1) ON CONFLICT (user_id) DO UPDATE SET totp_secret = EXCLUDED.totp_secret, totp_enabled = FALSE, last_totp_step = -1',
      [user.id, encryptedSecret]
    );
    await database.query("DELETE FROM auth_challenges WHERE user_id = $1 AND purpose = 'enroll_totp'", [user.id]);
    const challengeToken = await createChallenge(user.id, 'enroll_totp', { secret: encryptedSecret });
    return { stage: 'enroll_totp', challengeToken, ...setupDetails(user, secret) };
  }

  async function issueOtpForUser(user, req, res) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!(await rateLimit(`otp-ip:${ip}`, 8)) || !(await rateLimit(`otp-user:${user.id}`, 4))) {
      return res.status(429).json({ message: 'Too many verification requests. Please try again later.' });
    }
    const recent = await database.query(
      "SELECT 1 FROM auth_challenges WHERE user_id = $1 AND purpose = 'verify_email' AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1",
      [user.id]
    );
    if (recent.rowCount) return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
    const challengeToken = await emailCode(user);
    return res.json({ stage: 'verify_email', challengeToken, message: 'Enter the verification code sent to your email.' });
  }

  app.post('/api/register', async (req, res) => {
    try {
      await ensureSchema();
      const { name, phone, email, password } = req.body || {};
      const normalizedName = typeof name === 'string' ? name.trim() : '';
      const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedName || !normalizedPhone || !normalizedEmail || typeof password !== 'string') {
        return res.status(400).json({ message: 'Please complete all fields.' });
      }
      if (normalizedName.length > 100 || normalizedPhone.length > 40 || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please check your name, phone number, and email address.' });
      }
      if (password.length < 12 || password.length > 128) {
        return res.status(400).json({ message: 'Use a password between 12 and 128 characters.' });
      }
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (!(await rateLimit(`register-ip:${ip}`, 5))) {
        return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = {
        id: crypto.randomUUID(), name: normalizedName, phone: normalizedPhone,
        email: normalizedEmail, password: hashedPassword,
      };
      const result = await database.query(
        'INSERT INTO users (id, name, phone, email, password, created_at, email_verified) VALUES ($1, $2, $3, $4, $5, NOW(), FALSE) ON CONFLICT (email) DO NOTHING RETURNING id',
        [user.id, user.name, user.phone, user.email, user.password]
      );
      if (!result.rowCount) return res.status(409).json({ message: 'Unable to create an account with those details. Try signing in or use a different email.' });
      const response = await issueOtpForUser(user, req, res);
      return response;
    } catch (error) {
      return failClosed(error, res, 'Unable to create your account or send a verification code. Please try again.');
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      await ensureSchema();
      const { email, password } = req.body || {};
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail || typeof password !== 'string' || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Enter a valid email address and password.' });
      }
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (!(await rateLimit(`login-ip:${ip}`, 10))) return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
      const result = await database.query('SELECT id, name, phone, email, password, email_verified FROM users WHERE email = $1', [normalizedEmail]);
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      if (!user.email_verified) return issueOtpForUser(user, req, res);

      const mfa = await database.query('SELECT totp_secret, totp_enabled FROM auth_mfa WHERE user_id = $1', [user.id]);
      if (!mfa.rows[0]?.totp_enabled) {
        const enrollment = await createEnrollment(user);
        return res.json({ ...enrollment, message: 'Set up an authenticator app to finish securing your account.' });
      }

      await database.query("DELETE FROM auth_challenges WHERE user_id = $1 AND purpose = 'login_totp'", [user.id]);
      const challengeToken = await createChallenge(user.id, 'login_totp');
      return res.json({ stage: 'verify_totp', challengeToken, message: 'Enter the current code from your authenticator app.' });
    } catch (error) {
      return failClosed(error, res, 'Sign-in could not be completed. Please try again.');
    }
  });

  app.post('/api/auth/resend-email-otp', async (req, res) => {
    try {
      await ensureSchema();
      const token = typeof req.body?.challengeToken === 'string' ? req.body.challengeToken : '';
      const challenge = await database.query(
        "SELECT c.user_id, u.id, u.name, u.phone, u.email FROM auth_challenges c JOIN users u ON u.id = c.user_id WHERE c.token_hash = $1 AND c.purpose = 'verify_email' AND c.expires_at > NOW()",
        [digest(token, jwtSecret)]
      );
      if (!challenge.rowCount) return res.status(400).json({ message: 'This verification session has expired. Sign in or register again.' });
      await database.query('DELETE FROM auth_challenges WHERE user_id = $1 AND purpose = $2', [challenge.rows[0].user_id, 'verify_email']);
      return issueOtpForUser(challenge.rows[0], req, res);
    } catch (error) {
      return failClosed(error, res, 'Unable to send another code right now.');
    }
  });

  app.post('/api/auth/verify-email', async (req, res) => {
    const client = database;
    try {
      await ensureSchema();
      const token = typeof req.body?.challengeToken === 'string' ? req.body.challengeToken : '';
      const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      const connection = await client.connect();
      try {
        await connection.query('BEGIN');
        const result = await connection.query(
          "SELECT c.*, u.id, u.name, u.phone, u.email FROM auth_challenges c JOIN users u ON u.id = c.user_id WHERE c.token_hash = $1 AND c.purpose = 'verify_email' AND c.expires_at > NOW() FOR UPDATE",
          [digest(token, jwtSecret)]
        );
        const challenge = result.rows[0];
        if (!challenge || challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
          await connection.query('ROLLBACK');
          return res.status(400).json({ message: 'The code is invalid or expired. Request a new code and try again.' });
        }
        if (!/^\d{6}$/.test(code) || !safeEqualHex(challenge.code_hash, digest(code, jwtSecret))) {
          await connection.query('UPDATE auth_challenges SET attempts = attempts + 1 WHERE token_hash = $1', [challenge.token_hash]);
          await connection.query('COMMIT');
          return res.status(400).json({ message: 'The code is invalid or expired. Request a new code and try again.' });
        }
        await connection.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [challenge.user_id]);
        await connection.query('DELETE FROM auth_challenges WHERE token_hash = $1', [challenge.token_hash]);
        await connection.query('COMMIT');
        const enrollment = await createEnrollment(challenge);
        return res.json({ ...enrollment, message: 'Email verified. Set up an authenticator app to secure your account.' });
      } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      return failClosed(error, res, 'Unable to verify that code. Please try again.');
    }
  });

  app.post('/api/auth/verify-totp', async (req, res) => {
    let connection;
    try {
      await ensureSchema();
      const token = typeof req.body?.challengeToken === 'string' ? req.body.challengeToken : '';
      const code = typeof req.body?.code === 'string' ? req.body.code.trim().replace(/\s+/g, '').toUpperCase() : '';
      connection = await database.connect();
      await connection.query('BEGIN');
      const result = await connection.query(
        "SELECT c.*, u.id, u.name, u.phone, u.email, u.email_verified, m.totp_secret, m.totp_enabled, m.last_totp_step FROM auth_challenges c JOIN users u ON u.id = c.user_id LEFT JOIN auth_mfa m ON m.user_id = u.id WHERE c.token_hash = $1 AND c.expires_at > NOW() FOR UPDATE OF c, u",
        [digest(token, jwtSecret)]
      );
      const challenge = result.rows[0];
      if (!challenge || challenge.attempts >= MAX_CHALLENGE_ATTEMPTS || !challenge.email_verified) {
        await connection.query('ROLLBACK');
        return res.status(400).json({ message: 'This verification session is invalid or expired. Sign in again.' });
      }
      const enrollment = challenge.purpose === 'enroll_totp';
      if (!enrollment && (challenge.purpose !== 'login_totp' || !challenge.totp_enabled || !challenge.totp_secret)) {
        await connection.query('ROLLBACK');
        return res.status(400).json({ message: 'This verification session is invalid or expired. Sign in again.' });
      }
      const encryptedSecret = enrollment ? challenge.secret : challenge.totp_secret;
      if (!encryptedSecret) {
        await connection.query('ROLLBACK');
        return res.status(400).json({ message: 'This verification session is invalid or expired. Sign in again.' });
      }
      const secret = decryptSecret(encryptedSecret);
      const step = matchTotp(secret, code, Date.now(), enrollment ? -1 : Number(challenge.last_totp_step));
      let recoveryCodeUsed = false;
      if (step === null && !enrollment && /^[A-F0-9]{16}$/.test(code)) {
        const removed = await connection.query(
          'DELETE FROM auth_recovery_codes WHERE user_id = $1 AND code_hash = $2 RETURNING code_hash',
          [challenge.user_id, digest(code, jwtSecret)]
        );
        recoveryCodeUsed = removed.rowCount === 1;
      }
      if (step === null && !recoveryCodeUsed) {
        await connection.query('UPDATE auth_challenges SET attempts = attempts + 1 WHERE token_hash = $1', [challenge.token_hash]);
        await connection.query('COMMIT');
        return res.status(400).json({ message: 'The code is invalid or expired. Try again.' });
      }
      if (enrollment) {
        const recoveryCodes = newRecoveryCodes();
        await connection.query('UPDATE auth_mfa SET totp_enabled = TRUE, last_totp_step = $2 WHERE user_id = $1', [challenge.user_id, step]);
        for (const recoveryCode of recoveryCodes) {
          await connection.query('INSERT INTO auth_recovery_codes (user_id, code_hash) VALUES ($1, $2)', [challenge.user_id, digest(recoveryCode, jwtSecret)]);
        }
        await connection.query('DELETE FROM auth_challenges WHERE user_id = $1', [challenge.user_id]);
        await connection.query('COMMIT');
        const user = { id: challenge.id, name: challenge.name, phone: challenge.phone, email: challenge.email };
        return res.json({ message: 'Two-step verification is enabled. Save these recovery codes somewhere safe.', token: jwt.sign(user, jwtSecret, { expiresIn: '7d' }), user: sanitizeUser(user), recoveryCodes });
      }
      if (step !== null) await connection.query('UPDATE auth_mfa SET last_totp_step = $2 WHERE user_id = $1', [challenge.user_id, step]);
      await connection.query('DELETE FROM auth_challenges WHERE token_hash = $1', [challenge.token_hash]);
      await connection.query('COMMIT');
      const user = { id: challenge.id, name: challenge.name, phone: challenge.phone, email: challenge.email };
      return res.json({ message: 'Welcome back.', token: jwt.sign(user, jwtSecret, { expiresIn: '7d' }), user: sanitizeUser(user), recoveryCodeUsed });
    } catch (error) {
      if (connection) await connection.query('ROLLBACK').catch(() => {});
      return failClosed(error, res, 'Unable to verify that code. Please try again.');
    } finally {
      if (connection) connection.release();
    }
  });
}

installAuthMfa.base32Encode = base32Encode;
installAuthMfa.base32Decode = base32Decode;
installAuthMfa.totpAt = totpAt;
installAuthMfa.matchTotp = matchTotp;
installAuthMfa.encryptSecret = encryptSecret;
installAuthMfa.decryptSecret = decryptSecret;
installAuthMfa.newTotpSecret = newTotpSecret;

module.exports = installAuthMfa;
