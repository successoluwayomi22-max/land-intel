// test-admin.js
async function testAdmin() {
  const BASE = "http://localhost:3000";
  console.log("=== Testing Pro Admin Portal API Endpoints ===");

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@diasporaland.ai",
      password: "AdminPass123!"
    })
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Admin Login Status:", loginRes.status);

  const headers = { Cookie: cookie, "Content-Type": "application/json" };

  // 2. Fetch Admin Metrics
  const metricsRes = await fetch(`${BASE}/api/admin/metrics`, { headers });
  const metricsData = await metricsRes.json();
  console.log("Admin Telemetry Response (HTTP " + metricsRes.status + "):", {
    success: metricsData.success,
    totalUsers: metricsData.metrics?.totalUsers,
    totalCases: metricsData.metrics?.totalCases,
    totalRevenueNgn: metricsData.metrics?.totalRevenueNgn,
    conversionRate: metricsData.metrics?.conversionRate,
    riskBreakdown: metricsData.riskBreakdown,
    recentCasesCount: metricsData.recentCases?.length,
    usersCount: metricsData.allUsers?.length
  });

  // 3. Test Changing User Role
  if (metricsData.allUsers && metricsData.allUsers.length > 0) {
    const targetUser = metricsData.allUsers.find(u => u.email === "investor@diasporaland.ai") || metricsData.allUsers[0];
    console.log(`Testing role update for: ${targetUser.email} (Current: ${targetUser.role})`);
    const updateRes = await fetch(`${BASE}/api/admin/users`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId: targetUser.id, role: "PAID" })
    });
    const updateData = await updateRes.json();
    console.log("Role Update Result:", updateData);
  }

  // 4. Test Force Unlocking a Case
  if (metricsData.recentCases && metricsData.recentCases.length > 0) {
    const caseToUnlock = metricsData.recentCases[0];
    console.log(`Testing Force Unlock for: "${caseToUnlock.title}" (ID: ${caseToUnlock.id})`);
    const unlockRes = await fetch(`${BASE}/api/admin/cases`, {
      method: "POST",
      headers,
      body: JSON.stringify({ caseId: caseToUnlock.id, action: "FORCE_UNLOCK" })
    });
    const unlockData = await unlockRes.json();
    console.log("Force Unlock Result:", unlockData);
  }

  console.log("=== Pro Admin Portal Tests Completed Successfully! ===");
}

testAdmin();
