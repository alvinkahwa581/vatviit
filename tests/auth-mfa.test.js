'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mfa = require('../auth-mfa');

test('TOTP matches the RFC 6238 vector and rejects invalid codes', () => {
  const secret = mfa.base32Encode(Buffer.from('12345678901234567890'));
  const result = mfa.totpAt(secret, 59000);
  assert.equal(result.code, '287082');
  assert.equal(mfa.matchTotp(secret, result.code, 59000), 1);
  assert.equal(mfa.matchTotp(secret, 'abcdef', 59000), null);
});

test('TOTP verifier accepts small clock drift and rejects replayed time steps', () => {
  const secret = mfa.newTotpSecret();
  const now = 1780000000000;
  const previous = mfa.totpAt(secret, now - 30000);
  assert.equal(mfa.matchTotp(secret, previous.code, now, previous.step - 1), previous.step);
  assert.equal(mfa.matchTotp(secret, previous.code, now, previous.step), null);
});

test('authenticator secrets are encrypted and round-trip with a 32-byte key', () => {
  const key = Buffer.alloc(32, 7);
  const secret = mfa.newTotpSecret();
  const encrypted = mfa.encryptSecret(secret, key);
  assert.notEqual(encrypted, secret);
  assert.equal(mfa.decryptSecret(encrypted, key), secret);
  assert.throws(() => mfa.decryptSecret(encrypted, Buffer.alloc(32, 8)));
});
