/**
 * api/apiHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Low-level API request helpers built on Playwright's APIRequestContext.
 * Use these in tests that need to set up / tear down data via the backend
 * without going through the UI.
 *
 * Usage:
 *   const { ApiHelper } = require('../../api/apiHelper');
 *   const api = new ApiHelper(request);          // request from Playwright fixture
 *   const token = await api.login();
 *   await api.deleteClassTest(token, testId);
 */

const { API, URLS } = require('../utils/urls');
const { credentials } = require('../test-data/credentials');

class ApiHelper {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  /**
   * POST /api/account/login
   * Returns the auth token string on success, throws on failure.
   */
  async login(email = credentials.validUser.email, password = credentials.validUser.password) {
    const response = await this.request.post(API.login, {
      data: { username: email, password },
    });

    if (!response.ok()) {
      throw new Error(`API login failed: ${response.status()} ${await response.text()}`);
    }

    const body = await response.json();
    const token = body?.data?.token || body?.token;
    if (!token) throw new Error(`API login: no token in response — ${JSON.stringify(body)}`);

    console.log('  ✓ [API] Logged in successfully');
    return token;
  }

  // ── Generic helpers ────────────────────────────────────────────────────────

  /**
   * GET any endpoint with Bearer token.
   */
  async get(url, token) {
    return this.request.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * POST any endpoint with Bearer token.
   */
  async post(url, token, data) {
    return this.request.post(url, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
  }

  /**
   * DELETE any endpoint with Bearer token.
   */
  async delete(url, token) {
    return this.request.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

module.exports = { ApiHelper };
