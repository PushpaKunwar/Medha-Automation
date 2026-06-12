/**
 * tests/api/api.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * API Test Suite — LMS Mafatlal Education
 *
 * Tests the backend REST API layer directly using Playwright's built-in
 * APIRequestContext (`request` fixture). No browser or UI interaction occurs.
 *
 * Covered scenarios:
 *   API01 — Login with valid credentials returns HTTP 200 and a JWT token
 *   API02 — Login with invalid credentials returns HTTP 400 or 401
 *   API03 — Dashboard page (unauthenticated) responds with HTTP 200
 *   API04 — Authenticated GET to /api/account/getProfileDetails returns HTTP 200
 *   API05 — Login API response time is under 5000 ms
 *
 * Dependencies:
 *   - api/apiHelper.js    (ApiHelper class)
 *   - utils/urls.js       (URLS, API, BASE_DOMAIN)
 *   - test-data/credentials.js  (credentials.validUser)
 */

'use strict';

const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../../api/apiHelper');
const { API, URLS } = require('../../utils/urls');
const { credentials } = require('../../test-data/credentials');

// ── Constants ──────────────────────────────────────────────────────────────

const PROFILE_DETAILS_URL =
  'https://api.mafatlaleducation.com/webapigateway/api/account/getProfileDetails';

// ── Suite ──────────────────────────────────────────────────────────────────

test.describe('API Test Suite — LMS Mafatlal Education', () => {
  test.setTimeout(30000);

  // ── API01 ──────────────────────────────────────────────────────────────

  test('API01: POST /api/account/login with valid credentials returns 200 and token', async ({
    request,
  }) => {
    console.log('[API01] Testing login with valid credentials...');

    const response = await request.post(API.login, {
      data: {
        username: credentials.validUser.email,
        password: credentials.validUser.password,
      },
    });

    const status = response.status();
    console.log(`[API01] Response status: ${status}`);

    expect(status).toBe(200);

    const body = await response.json();
    console.log('[API01] Response body keys:', Object.keys(body));

    const token = body?.data?.token || body?.token;
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    console.log(`[API01] Token received (first 20 chars): ${token.substring(0, 20)}...`);
    console.log('[API01] PASSED — valid login returns 200 with token');
  });

  // ── API02 ──────────────────────────────────────────────────────────────

  test('API02: POST /api/account/login with invalid credentials returns 400 or 401', async ({
    request,
  }) => {
    console.log('[API02] Testing login with invalid credentials...');

    const response = await request.post(API.login, {
      data: {
        username: 'invalid.user@example.com',
        password: 'WrongPassword123!',
      },
    });

    const status = response.status();
    console.log(`[API02] Response status: ${status}`);

    expect([400, 401]).toContain(status);

    const body = await response.text();
    console.log(`[API02] Response body (truncated): ${body.substring(0, 200)}`);
    console.log('[API02] PASSED — invalid login returns 400/401');
  });

  // ── API03 ──────────────────────────────────────────────────────────────

  test('API03: GET dashboard page responds with 200 (no auth needed for redirect)', async ({
    request,
  }) => {
    console.log(`[API03] Testing unauthenticated GET to dashboard: ${URLS.dashboard}`);

    const response = await request.get(URLS.dashboard);

    const status = response.status();
    console.log(`[API03] Response status: ${status}`);

    expect(status).toBe(200);

    const body = await response.text();
    console.log(`[API03] Response length: ${body.length} chars`);
    console.log('[API03] PASSED — dashboard page returned 200');
  });

  // ── API04 ──────────────────────────────────────────────────────────────

  test('API04: Authenticated GET to getProfileDetails returns 200', async ({ request }) => {
    console.log('[API04] Obtaining auth token via login...');

    const api = new ApiHelper(request);
    const token = await api.login();
    console.log('[API04] Token obtained successfully');

    console.log(`[API04] GET ${PROFILE_DETAILS_URL}`);
    const response = await api.get(PROFILE_DETAILS_URL, token);

    const status = response.status();
    console.log(`[API04] Response status: ${status}`);

    expect(status).toBe(200);

    const body = await response.json();
    console.log('[API04] Profile response keys:', Object.keys(body));
    console.log('[API04] PASSED — authenticated GET to protected endpoint returned 200');
  });

  // ── API05 ──────────────────────────────────────────────────────────────

  test('API05: Login API response time is under 5000ms', async ({ request }) => {
    console.log('[API05] Measuring login API response time...');

    const startTime = Date.now();

    const response = await request.post(API.login, {
      data: {
        username: credentials.validUser.email,
        password: credentials.validUser.password,
      },
    });

    const elapsed = Date.now() - startTime;
    const status = response.status();

    console.log(`[API05] Response status : ${status}`);
    console.log(`[API05] Response time   : ${elapsed}ms`);

    expect(status).toBe(200);
    expect(elapsed).toBeLessThan(5000);

    console.log('[API05] PASSED — login responded within 5000ms');
  });
});
