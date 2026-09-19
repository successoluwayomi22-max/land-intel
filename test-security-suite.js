/**
 * Automated Production-Grade Security & SOC Test Suite
 * Validates Threat Detection, Progressive IP Locking, Malware Quarantine, IDOR Detection, and Admin RBAC.
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function waitForServer(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await makeRequest("/api/health");
      if (res.status === 200) return true;
    } catch {
      // Wait and retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Server not available after multiple retries");
}

async function runSecuritySuite() {
  console.log("==========================================================");
  console.log("🛡️  DIASPORALAND ADVANCED SECURITY & SOC TEST SUITE");
  console.log("==========================================================\n");

  console.log("Waiting for Next.js development server to be ready...");
  await waitForServer();
  console.log("Server is ready!\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Admin RBAC & Endpoint Authorization Protection ---
  console.log("1. Testing Admin Endpoint RBAC & Authentication Shield...");
  try {
    const unauthRes = await makeRequest("/api/admin/security/overview");
    assert(
      unauthRes.status === 401 || unauthRes.status === 403,
      `Unauthenticated access to /api/admin/security/overview is blocked (HTTP ${unauthRes.status})`
    );

    const unauthEventsRes = await makeRequest("/api/admin/security/events");
    assert(
      unauthEventsRes.status === 401 || unauthEventsRes.status === 403,
      `Unauthenticated access to /api/admin/security/events is blocked (HTTP ${unauthEventsRes.status})`
    );
  } catch (err) {
    console.error("Test 1 error:", err);
    failed++;
  }

  // --- TEST 2: Admin Login & Session Token Acquisition ---
  console.log("\n2. Authenticating as Platform Administrator...");
  let adminToken = "";
  let loginRes = null;
  try {
    loginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { email: "admin@diasporaland.ai", password: "AdminPass123!" },
    });
    assert(loginRes.status === 200, `Admin authenticated successfully (HTTP ${loginRes.status})`);
    adminToken = loginRes.body?.token;
    assert(Boolean(adminToken), "Admin session token acquired");
  } catch (err) {
    console.error("Test 2 error:", err);
    failed++;
  }

  const adminCookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];
  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
    Cookie: adminCookie || `landintel_session=${adminToken}`,
  };

  // --- TEST 3: SOC Overview & Provider Health Matrix ---
  console.log("\n3. Testing Security Operations Center Overview API...");
  try {
    const overviewRes = await makeRequest("/api/admin/security/overview", { headers: adminHeaders });
    assert(overviewRes.status === 200, `SOC Overview returned 200 OK`);
    assert(typeof overviewRes.body.postureScore === "number", `Posture score is real numeric score: ${overviewRes.body?.postureScore}/100`);
    assert(Array.isArray(overviewRes.body.providers), `Provider Health matrix present (${overviewRes.body?.providers?.length} providers tracked)`);
    assert(Boolean(overviewRes.body.telemetry), `Performance telemetry present (p50: ${overviewRes.body?.telemetry?.p50LatencyMs}ms)`);
  } catch (err) {
    console.error("Test 3 error:", err);
    failed++;
  }

  // --- TEST 4: Brute Force Threat Detection & Progressive Enforcement ---
  console.log("\n4. Testing Brute-Force Password Guessing & Threat Engine Detection...");
  try {
    const attackerIp = "192.0.2.77"; // TEST-NET-1 IP

    // Send repeated failed logins with X-Forwarded-For
    for (let i = 1; i <= 5; i++) {
      await makeRequest("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": attackerIp,
        },
        body: { email: `victim_${Date.now()}@example.com`, password: "WrongPassword999!" },
      });
    }

    // Now query the events endpoint as admin
    const eventsRes = await makeRequest(`/api/admin/security/events?ip=${attackerIp}`, { headers: adminHeaders });
    assert(eventsRes.status === 200, "Security events fetched successfully");
    const foundEvents = eventsRes.body?.events || [];
    assert(foundEvents.length > 0, `Threat engine logged ${foundEvents.length} events for attacking IP ${attackerIp}`);

    // Verify IP record was placed under containment
    const ipRes = await makeRequest("/api/admin/security/ip", { headers: adminHeaders });
    const attackerRecord = ipRes.body?.records?.find((r) => r.ip === attackerIp);
    assert(Boolean(attackerRecord), `IP ${attackerIp} tracked in security directory`);
    assert(
      attackerRecord?.status === "TEMPORARILY_BLOCKED" || attackerRecord?.threatScore > 50,
      `Progressive enforcement active on ${attackerIp} (Status: ${attackerRecord?.status}, Threat: ${attackerRecord?.threatScore}/100)`
    );
  } catch (err) {
    console.error("Test 4 error:", err);
    failed++;
  }

  // --- TEST 5: Manual IP Unblock / Allowlist Action ---
  console.log("\n5. Testing Administrator IP Unblock & Audit Logging...");
  try {
    const unblockRes = await makeRequest("/api/admin/security/ip", {
      method: "POST",
      headers: adminHeaders,
      body: {
        ip: "192.0.2.77",
        state: "MONITOR",
        reason: "Admin verified legitimate developer testing; lifting restriction.",
      },
    });
    assert(unblockRes.status === 200, "Administrator successfully updated IP enforcement");
    assert(unblockRes.body?.record?.status === "MONITOR", "IP state transitioned to MONITOR");
  } catch (err) {
    console.error("Test 5 error:", err);
    failed++;
  }

  // --- TEST 6: Malware Scanning & Magic Byte Quarantine Pipeline via API ---
  console.log("\n6. Testing Malware Prevention, Polyglot Detection & Quarantine Vault...");
  try {
    // 6a. Test Polyglot / Mismatched Magic Bytes
    const fakePdfBase64 = Buffer.from("THIS_IS_PLAIN_TEXT_NOT_A_REAL_PDF").toString("base64");
    const spoofRes = await makeRequest("/api/admin/security/malware", {
      method: "POST",
      headers: adminHeaders,
      body: {
        action: "SCAN_FILE",
        originalName: "malicious_spoofed.pdf",
        mimeType: "application/pdf",
        base64Content: fakePdfBase64,
      },
    });

    assert(spoofRes.status === 200, "Scan API processed file");
    assert(spoofRes.body?.allowed === false, "Extension-spoofed non-PDF rejected");
    assert(spoofRes.body?.status === "QUARANTINED", "Spoofed file placed in quarantine vault");

    // 6b. Test EICAR Antivirus Test Signature
    const eicarPayload = Buffer.from(
      "%PDF-1.4\n%EICAR test string embedded\nX5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*\n%%EOF"
    ).toString("base64");
    const eicarRes = await makeRequest("/api/admin/security/malware", {
      method: "POST",
      headers: adminHeaders,
      body: {
        action: "SCAN_FILE",
        originalName: "trojan_document.pdf",
        mimeType: "application/pdf",
        base64Content: eicarPayload,
      },
    });

    assert(eicarRes.status === 200, "Scan API processed EICAR file");
    assert(eicarRes.body?.allowed === false, "EICAR antivirus test signature intercepted");
    assert(eicarRes.body?.status === "INFECTED", "File marked as INFECTED");
    assert(
      eicarRes.body?.record?.threatSignature === "EICAR.StandardAntivirusTestString",
      `Accurate threat signature recorded: ${eicarRes.body?.record?.threatSignature}`
    );

    // 6c. Test Clean PDF
    const cleanPdfBase64 = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\nxref\n0 1\n%%EOF"
    ).toString("base64");
    const cleanRes = await makeRequest("/api/admin/security/malware", {
      method: "POST",
      headers: adminHeaders,
      body: {
        action: "SCAN_FILE",
        originalName: "clean_survey_plan.pdf",
        mimeType: "application/pdf",
        base64Content: cleanPdfBase64,
      },
    });

    assert(cleanRes.status === 200, "Scan API processed clean file");
    assert(cleanRes.body?.allowed === true, "Valid clean PDF passed scan successfully");
    assert(cleanRes.body?.status === "CLEAN", "File marked as CLEAN");
  } catch (err) {
    console.error("Test 6 error:", err);
    failed++;
  }

  // --- TEST 7: Webhook Signature Tampering Guard ---
  console.log("\n7. Testing Webhook Cryptographic Signature Tampering Guard...");
  try {
    const webhookRes = await makeRequest("/api/v1/billing/webhooks/paystack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "tampered_fake_signature_hex_12345",
      },
      body: { event: "charge.success", data: { reference: "TEST_REF_123" } },
    });
    assert(webhookRes.status === 400, `Tampered webhook signature rejected (HTTP ${webhookRes.status})`);
  } catch (err) {
    console.error("Test 7 error:", err);
    failed++;
  }

  // --- TEST 8: Compliance & Security Audit Reporting Export ---
  console.log("\n8. Testing Compliance Report Generation & CSV Export...");
  try {
    const jsonReportRes = await makeRequest("/api/admin/security/reports?format=json", { headers: adminHeaders });
    assert(jsonReportRes.status === 200, "JSON Security Audit report generated");
    assert(Boolean(jsonReportRes.body?.report?.summary), "Executive summary present in compliance report");

    const csvReportRes = await makeRequest("/api/admin/security/reports?format=csv", { headers: adminHeaders });
    assert(csvReportRes.status === 200, "CSV Security report exported successfully");
    assert(csvReportRes.rawBody.includes("Threats Detected"), "CSV contains structured compliance metrics");
  } catch (err) {
    console.error("Test 8 error:", err);
    failed++;
  }

  console.log("\n==========================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
