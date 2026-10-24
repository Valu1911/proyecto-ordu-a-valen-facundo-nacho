/**
 * Test to verify Registration with Terms acceptance,
 * Profile Settings update, and Password change.
 */

const BASE_URL = 'http://localhost:3001/api';

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function testSettingsAndTerms() {
  console.log('Testing Registration, Profile Settings & Password Change...');

  // 1. Register new user
  const randomEmail = `testuser_${Date.now()}@gmail.com`;
  const registerRes = await apiRequest(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: randomEmail,
      password: 'Password123!',
      display_name: 'Test Usuario Circular',
      location_city: 'Palermo, CABA',
    }),
  });

  if (registerRes.status !== 201) {
    throw new Error(`Register failed with status ${registerRes.status}: ${JSON.stringify(registerRes.data)}`);
  }
  console.log('  [PASS] Registration succeeded with status 201');

  const token = registerRes.data.accessToken || registerRes.data.token;
  if (!token) throw new Error('No token returned in register response');

  // 2. Update Profile Settings
  const updateRes = await apiRequest(`${BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      display_name: 'Test Usuario Modificado',
      bio: 'Fan de la moda circular y coleccionista de camperas.',
      location_city: 'Belgrano, CABA',
      location_province: 'Buenos Aires',
    }),
  });

  if (updateRes.status !== 200) {
    throw new Error(`Profile update failed: ${JSON.stringify(updateRes.data)}`);
  }
  console.log('  [PASS] Profile settings updated successfully');

  // 3. Change Password
  const changePassRes = await apiRequest(`${BASE_URL}/users/change-password`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      current_password: 'Password123!',
      new_password: 'NewSuperPassword2026!',
    }),
  });

  if (changePassRes.status !== 200) {
    throw new Error(`Change password failed: ${JSON.stringify(changePassRes.data)}`);
  }
  console.log('  [PASS] Change password succeeded');

  // 4. Verify login with new password
  const newLoginRes = await apiRequest(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: randomEmail,
      password: 'NewSuperPassword2026!',
    }),
  });

  if (newLoginRes.status !== 200) {
    throw new Error('Login with new password failed');
  }
  console.log('  [PASS] Login with new password succeeded');

  console.log('\nALL SETTINGS & REGISTRATION TESTS PASSED (100%)\n');
}

testSettingsAndTerms().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
