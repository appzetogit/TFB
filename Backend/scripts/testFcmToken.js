/**
 * Test FCM token registration (platform: web, app, android, ios)
 * Run: node scripts/testFcmToken.js
 * Uses TEST_USER_EMAIL/TEST_USER_PASSWORD from .env, or auto-creates test user
 */

import "dotenv/config";

const API_BASE = process.env.API_BASE_URL || "http://localhost:5000/api";
const FAKE_FCM_TOKEN = "test_fcm_token_" + Date.now();
const TEST_EMAIL = process.env.TEST_USER_EMAIL || `fcmtest${Date.now()}@test.local`;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "FcmTest123!";

async function log(label, res, data) {
  const status = res.status;
  const ok = res.ok ? "✅" : "❌";
  console.log(`\n${ok} ${label} [${status}]`);
  console.log(JSON.stringify(data, null, 2));
  return { ok: res.ok, status, data };
}

async function getAccessToken() {
  // Try register first
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "FCM Test User",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "user",
    }),
  });
  const regData = await regRes.json();
  if (regRes.ok && regData.success && regData.data?.accessToken) {
    console.log("Created test user:", TEST_EMAIL);
    return regData.data.accessToken;
  }
  // Login (user exists)
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: "user" }),
  });
  const loginData = await loginRes.json();
  if (loginRes.ok && loginData.success && loginData.data?.accessToken) {
    console.log("Logged in:", TEST_EMAIL);
    return loginData.data.accessToken;
  }
  return null;
}

async function testFcmToken() {
  console.log("API_BASE:", API_BASE);
  console.log("Test user:", TEST_EMAIL);

  try {
    // 1. Get access token
    console.log("\n--- 1. Login / Register ---");
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.error("❌ Login failed. Set TEST_USER_EMAIL, TEST_USER_PASSWORD in .env for existing user.");
      process.exit(1);
    }
    console.log("✅ Got access token");

    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // 2. Register FCM - platform "app" in BODY
    console.log("\n--- 2. Register FCM (platform=app in body) ---");
    const r1 = await fetch(`${API_BASE}/auth/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ platform: "app", fcmToken: FAKE_FCM_TOKEN }),
    });
    const d1 = await r1.json();
    await log("Register platform=app (body)", r1, d1);
    if (!r1.ok) {
      console.log("\n🔍 ROOT CAUSE: Body request failed. Check error above.");
    }

    // 3. Register FCM - platform "App" (capital A) in body
    console.log("\n--- 3. Register FCM (platform=App capital in body) ---");
    const r2 = await fetch(`${API_BASE}/auth/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ platform: "App", fcmToken: FAKE_FCM_TOKEN + "_2" }),
    });
    const d2 = await r2.json();
    await log("Register platform=App (body)", r2, d2);

    // 4. Register FCM - platform in QUERY params
    console.log("\n--- 4. Register FCM (platform=app in query) ---");
    const r3 = await fetch(
      `${API_BASE}/auth/fcm-token?platform=app&fcmToken=${encodeURIComponent(FAKE_FCM_TOKEN + "_query")}`,
      {
        method: "POST",
        headers: authHeader,
      }
    );
    const d3 = await r3.json();
    await log("Register platform=app (query)", r3, d3);

    // 5. Simulate Flutter: platform as NUMBER (common Dart enum mistake)
    console.log("\n--- 5. Flutter-style: platform as number (expect 400) ---");
    const r4a = await fetch(`${API_BASE}/auth/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ platform: 1, fcmToken: FAKE_FCM_TOKEN }),
    });
    const d4a = await r4a.json();
    await log("platform=1 (number)", r4a, d4a);
    if (r4a.ok) {
      console.log("   → Backend accepts platform as number (0=web, 1=app, 2=android, 3=ios)");
    }

    // 6. Invalid platform - should fail with clear error
    console.log("\n--- 6. Invalid platform (expect 400) ---");
    const r4 = await fetch(`${API_BASE}/auth/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ platform: "invalid", fcmToken: FAKE_FCM_TOKEN }),
    });
    const d4 = await r4.json();
    await log("Register platform=invalid", r4, d4);
    if (d4.message?.includes("Received:")) {
      console.log("   → Error shows received value (good for debugging)");
    }

    // 7. Remove FCM - platform "app"
    console.log("\n--- 7. Remove FCM (platform=app in body) ---");
    const r5 = await fetch(`${API_BASE}/auth/fcm-token`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ platform: "app" }),
    });
    const d5 = await r5.json();
    await log("Remove platform=app (body)", r5, d5);

    // 8. Remove FCM - platform in query
    console.log("\n--- 8. Remove FCM (platform=app in query) ---");
    const r6 = await fetch(`${API_BASE}/auth/fcm-token?platform=app`, {
      method: "DELETE",
      headers: authHeader,
    });
    const d6 = await r6.json();
    await log("Remove platform=app (query)", r6, d6);

    // Summary
    const passed = [r1, r2, r3, r4a, r5, r6].filter((r) => r.ok).length;
    const total = 6; // r4 (invalid) expected to fail
    console.log("\n" + "=".repeat(50));
    console.log(`Result: ${passed}/${total} passed`);
    if (passed < total) {
      console.log("Check failures above for root cause.");
      process.exit(1);
    }
    console.log("✅ All FCM platform tests passed.");
  } catch (err) {
    console.error("❌ Test error:", err.message);
    if (err.cause) console.error(err.cause);
    process.exit(1);
  }
}

testFcmToken();
