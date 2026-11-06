'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const installAuthMfa = require('../auth-mfa');

const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.JWT_SECRET ||= 'mfa-integration-test-jwt-secret';
process.env.MFA_ENCRYPTION_KEY ||= testKey;
process.env.RESEND_API_KEY ||= 'mfa-integration-test-resend-key';
process.env.WAITLIST_FROM_EMAIL ||= 'VaTViT <auth-test@example.test>';

test('email verification, authenticator enrollment, login, and recovery are required', { skip: !process.env.DATABASE_URL }, async () => {
  const database = new Pool({ connectionString: process.env.DATABASE_URL });
  const originalFetch = global.fetch;
  let emailedCode;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    const message = JSON.parse(options.body).text;
    emailedCode = message.match(/code is (\d{6})/)[1];
    return { ok: true, status: 200 };
  };

  const app = express();
  app.use(express.json());
  installAuthMfa(app, {
    database,
    bcrypt,
    jwt,
    jwtSecret: process.env.JWT_SECRET,
    sanitizeUser: user => ({ id: user.id, name: user.name, email: user.email, phone: user.phone })
  });
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const post = async (route, body) => originalFetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  try {
    await database.query('DROP TABLE IF EXISTS auth_rate_limits, auth_recovery_codes, auth_challenges, auth_mfa, users CASCADE');
    await database.query(`CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )`);

    const credentials = {
      name: 'Test User',
      phone: '+10000000000',
      email: `mfa-${Date.now()}@example.test`,
      password: 'a-long-test-password-123'
    };
    let response = await post('/api/register', credentials);
    let data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.stage, 'verify_email');
    assert.equal(data.token, undefined);
    assert.ok(emailedCode);

    response = await post('/api/auth/verify-email', { challengeToken: data.challengeToken, code: emailedCode });
    data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.stage, 'enroll_totp');
    assert.ok(data.secret);
    assert.match(data.otpauthUrl, /^otpauth:\/\/totp\//);
    const authenticatorSecret = data.secret;

    const initialTotp = installAuthMfa.totpAt(authenticatorSecret);
    response = await post('/api/auth/verify-totp', { challengeToken: data.challengeToken, code: initialTotp.code });
    data = await response.json();
    assert.equal(response.status, 200);
    assert.ok(data.token);
    assert.equal(data.recoveryCodes.length, 10);
    assert.equal(jwt.verify(data.token, process.env.JWT_SECRET).email, credentials.email);
    const recoveryCode = data.recoveryCodes[0];

    response = await post('/api/login', { email: credentials.email, password: credentials.password });
    data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.stage, 'verify_totp');
    assert.equal(data.token, undefined);

    const nextStep = Math.max(Math.floor(Date.now() / 30000), initialTotp.step) + 1;
    response = await post('/api/auth/verify-totp', {
      challengeToken: data.challengeToken,
      code: installAuthMfa.totpAt(authenticatorSecret, nextStep * 30000).code
    });
    data = await response.json();
    assert.equal(response.status, 200);
    assert.ok(data.token);

    response = await post('/api/login', { email: credentials.email, password: credentials.password });
    data = await response.json();
    assert.equal(data.stage, 'verify_totp');
    response = await post('/api/auth/verify-totp', { challengeToken: data.challengeToken, code: recoveryCode });
    data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.recoveryCodeUsed, true);

    response = await post('/api/login', { email: credentials.email, password: credentials.password });
    data = await response.json();
    response = await post('/api/auth/verify-totp', { challengeToken: data.challengeToken, code: recoveryCode });
    data = await response.json();
    assert.equal(response.status, 400);
    assert.equal(data.token, undefined);
  } finally {
    global.fetch = originalFetch;
    await new Promise(resolve => server.close(resolve));
    await database.query('DROP TABLE IF EXISTS auth_rate_limits, auth_recovery_codes, auth_challenges, auth_mfa, users CASCADE').catch(() => {});
    await database.end();
  }
});
