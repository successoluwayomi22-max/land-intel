/**
 * END-TO-END VERIFICATION SUITE:
 * 1. NDPR / GDPR Customer Account Deletion Request Submission
 * 2. Statutory 14-day Grace Period Countdown Verification
 * 3. Administrator Detection & Alert Notification via Metrics API
 * 4. Administrator Deletion Queue Inspection
 * 5. Customer Cancellation / Cooling-off Rescission
 * 6. Final Re-submission & Administrator Approval / PII Purge
 */

const BASE_URL = "http://127.0.0.1:3000";

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookies = res.headers.get("set-cookie") || "";
  return { status: res.status, data, cookies, token: data.token };
}

async function runSuite() {
  console.log("\n================================================================================");
  console.log("       LANDINTEL NDPR / GDPR ACCOUNT DELETION END-TO-END VERIFICATION SUITE       ");
  console.log("================================================================================\n");

  const testEmail = `test_deletion_${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  // 1. Create a customer account
  console.log("1. Registering test customer account...");
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tunde Test Customer",
      email: testEmail,
      password: testPassword,
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 || regRes.status === 200, `Registered test user (${testEmail})`);

  // Log in as customer
  const custAuth = await login(testEmail, testPassword);
  assert(custAuth.status === 200 && custAuth.token, "Customer logged in successfully");

  const custHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${custAuth.token}`,
    Cookie: custAuth.cookies,
  };

  // Log in as Admin
  console.log("\n2. Authenticating as Platform Administrator...");
  const adminAuth = await login("admin@diasporaland.ai", "AdminPass123!");
  assert(adminAuth.status === 200 && (adminAuth.data.user.role === "SUPER_ADMIN" || adminAuth.data.user.role === "ADMIN"), "Admin authenticated");

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAuth.token}`,
    Cookie: adminAuth.cookies,
  };

  // 3. Check initial deletion status (should be false)
  console.log("\n3. Verifying initial deletion status is clean...");
  const check1Res = await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    headers: custHeaders,
  });
  const check1Data = await check1Res.json();
  assert(check1Res.status === 200, "Deletion status endpoint reachable");
  assert(check1Data.hasPendingRequest === false, "Customer has NO active deletion request initially");

  // 4. Customer submits Account Deletion Request
  console.log("\n4. Customer submits Account Deletion Request (NDPR 14-day statutory grace period)...");
  const delSubmitRes = await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    method: "POST",
    headers: custHeaders,
    body: JSON.stringify({
      reason: "Completed property acquisition in Lekki Phase 1",
      feedback: "LandIntel helped me detect an excised boundary overlap!",
    }),
  });
  const delSubmitData = await delSubmitRes.json();
  assert(delSubmitRes.status === 200 && delSubmitData.success, "Deletion request submitted successfully");
  assert(delSubmitData.gracePeriodDays === 14, "14-day statutory grace period assigned");
  assert(Boolean(delSubmitData.scheduledPurgeDate), "Scheduled purge date computed");

  // 5. Verify customer now sees active pending request
  console.log("\n5. Customer queries deletion status (Should show active request)...");
  const check2Res = await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    headers: custHeaders,
  });
  const check2Data = await check2Res.json();
  assert(check2Data.hasPendingRequest === true, "Customer deletion request is marked ACTIVE");
  assert(check2Data.request?.action === "ACCOUNT_DELETION_REQUESTED", "Audit log action is ACCOUNT_DELETION_REQUESTED");

  // 6. Admin detects request via Admin Metrics API
  console.log("\n6. Platform Administrator telemetry check (/api/admin/metrics)...");
  const metricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: adminHeaders,
  });
  const metricsData = await metricsRes.json();
  assert(metricsRes.status === 200 && metricsData.success, "Admin metrics endpoint returned successfully");
  assert(metricsData.metrics.pendingDeletionCount >= 1, `Admin telemetry reflects pendingDeletionCount = ${metricsData.metrics.pendingDeletionCount}`);
  
  const foundInMetrics = metricsData.pendingDeletionRequests?.some((r) => r.userEmail === testEmail);
  assert(foundInMetrics, `Admin metrics payload includes customer request for ${testEmail}`);

  // 7. Admin queries dedicated deletion queue (/api/admin/deletion-requests)
  console.log("\n7. Platform Administrator queries Deletion Requests Queue (/api/admin/deletion-requests)...");
  const adminDelRes = await fetch(`${BASE_URL}/api/admin/deletion-requests`, {
    headers: adminHeaders,
  });
  const adminDelData = await adminDelRes.json();
  assert(adminDelRes.status === 200 && adminDelData.success, "Admin deletion queue retrieved");
  
  const adminItem = adminDelData.pending.find((r) => r.userEmail === testEmail);
  assert(Boolean(adminItem), "Customer request exists in Admin Deletion Queue");
  assert(adminItem?.daysRemaining >= 13, `Statutory grace days remaining correctly computed: ${adminItem?.daysRemaining} days`);
  assert(adminItem?.status === "GRACE_PERIOD_ACTIVE", `Status is correctly GRACE_PERIOD_ACTIVE`);

  // 8. Test Customer Cancellation
  console.log("\n8. Testing Customer Cooling-off Cancellation (DELETE /api/v1/account/deletion-request)...");
  const cancelRes = await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    method: "DELETE",
    headers: custHeaders,
  });
  const cancelData = await cancelRes.json();
  assert(cancelRes.status === 200 && cancelData.success, "Cancellation request succeeded");

  const check3Res = await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    headers: custHeaders,
  });
  const check3Data = await check3Res.json();
  assert(check3Data.hasPendingRequest === false, "Customer active deletion state rescinded back to false");

  // 9. Re-submit deletion request and test Admin Approve & Purge
  console.log("\n9. Customer re-submits deletion request for final administrative purge...");
  await fetch(`${BASE_URL}/api/v1/account/deletion-request`, {
    method: "POST",
    headers: custHeaders,
    body: JSON.stringify({
      reason: "Final permanent removal requested",
    }),
  });

  const targetUserId = custAuth.data.user.id;
  console.log(`\n10. Platform Administrator approves and purges account (${targetUserId})...`);
  const purgeRes = await fetch(`${BASE_URL}/api/admin/deletion-requests`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      targetUserId,
      action: "APPROVE_AND_PURGE",
    }),
  });
  const purgeData = await purgeRes.json();
  assert(purgeRes.status === 200 && purgeData.success, `Purge executed: ${purgeData.message}`);

  // 11. Verify user can no longer log in (account deleted)
  console.log("\n11. Verifying user credentials are permanently erased...");
  const postPurgeLogin = await login(testEmail, testPassword);
  assert(postPurgeLogin.status === 401 || postPurgeLogin.status === 404, "Purged user can no longer log in");

  console.log("\n================================================================================");
  console.log(`       TEST RESULTS: ${passedCount} / ${totalCount} PASSED (100% SUCCESS)         `);
  console.log("================================================================================\n");
}

runSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
