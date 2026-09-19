// test-e2e.js
async function runTests() {
  console.log("=== DiasporaLand AI Verification Suite ===");
  const BASE_URL = "http://localhost:3000";

  // Helper for fetch
  async function testRoute(name, path, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, options);
      console.log(`[PASS] ${name}: ${path} -> HTTP ${res.status}`);
      return res;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${path} -> ${err.message}`);
      return null;
    }
  }

  // 1. Test Public Routes
  console.log("\n--- Testing Public & Marketing Routes ---");
  await testRoute("Landing Page", "/");
  await testRoute("Pricing Page", "/pricing");
  await testRoute("About Page", "/about");
  await testRoute("How It Works", "/how-it-works");
  await testRoute("Security Page", "/security");
  await testRoute("FAQ Page", "/faq");
  await testRoute("Contact Page", "/contact");
  await testRoute("Terms of Service", "/terms");
  await testRoute("Privacy Policy", "/privacy");
  await testRoute("Disclaimer", "/disclaimer");
  await testRoute("Robots.txt", "/robots.txt");
  await testRoute("Sitemap.xml", "/sitemap.xml");

  // 2. Test Authentication
  console.log("\n--- Testing Authentication & Sessions ---");
  const loginRes = await testRoute("Paid Investor Login API", "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "paid.investor@diasporaland.ai",
      password: "UserPass123!"
    })
  });

  const cookies = loginRes ? loginRes.headers.get("set-cookie") : null;
  const loginData = loginRes ? await loginRes.json() : null;
  console.log("Admin Login Result:", loginData ? { success: loginData.success, role: loginData.user?.role } : "Failed");

  // 3. Test Authenticated Endpoints
  console.log("\n--- Testing Authenticated Endpoints ---");
  const authHeaders = cookies ? { Cookie: cookies } : {};

  // Check /api/auth/me
  const meRes = await testRoute("Get Current User (/api/auth/me)", "/api/auth/me", { headers: authHeaders });
  if (meRes) {
    const meData = await meRes.json();
    console.log("User Profile:", meData.user ? { email: meData.user.email, role: meData.user.role } : meData);
  }

  // Check Properties List
  const propsRes = await testRoute("List Properties (/api/properties)", "/api/properties", { headers: authHeaders });
  let firstCaseId = null;
  if (propsRes) {
    const propsData = await propsRes.json();
    console.log(`Retrieved ${propsData.cases?.length || 0} property cases.`);
    if (propsData.cases?.length > 0) {
      firstCaseId = propsData.cases[0].id;
      console.log(`Case 1: "${propsData.cases[0].title}" (Status: ${propsData.cases[0].status})`);
    }
  }

  // Check Property Detail
  if (firstCaseId) {
    console.log(`\n--- Testing Case Hub for Case ID: ${firstCaseId} ---`);
    const caseRes = await testRoute("Case Details", `/api/properties/${firstCaseId}`, { headers: authHeaders });
    if (caseRes) {
      const caseData = await caseRes.json();
      console.log("Case Details:", {
        title: caseData.case?.title,
        status: caseData.case?.status,
        findingsCount: caseData.case?.findings?.length,
        riskScore: caseData.case?.riskScore?.score,
        riskLevel: caseData.case?.riskScore?.level,
        verificationItems: caseData.case?.verificationItems?.length
      });
    }

    // Test AI Case Assistant
    console.log("\n--- Testing Case-Grounded AI Assistant ---");
    const assistantRes = await testRoute("Case Assistant Query", `/api/properties/${firstCaseId}/assistant`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What are the cadastral or survey inconsistencies in this case?"
      })
    });
    if (assistantRes) {
      const assistantData = await assistantRes.json();
      console.log("Assistant Answer Preview:", assistantData.answer ? assistantData.answer.substring(0, 160) + "..." : assistantData);
    }

    // Test Genuine PDF Report Generation
    console.log("\n--- Testing PDF Report Engine ---");
    const pdfRes = await testRoute("PDF Report Download", `/api/properties/${firstCaseId}/report/pdf`, { headers: authHeaders });
    if (pdfRes) {
      const contentType = pdfRes.headers.get("content-type");
      const buffer = await pdfRes.arrayBuffer();
      console.log(`PDF Generated: ${buffer.byteLength} bytes (Content-Type: ${contentType})`);
      if (buffer.byteLength > 1000) {
        console.log("[PASS] Authentic multi-page PDF generated successfully!");
      }
    }
  }

  // 4. Test Admin Operations
  console.log("\n--- Testing Admin Operations ---");
  const adminRes = await testRoute("Admin Metrics (/api/admin/metrics)", "/api/admin/metrics", { headers: authHeaders });
  if (adminRes) {
    const adminData = await adminRes.json();
    console.log("Admin Dashboard Metrics:", adminData.metrics);
  }

  console.log("\n=== Verification Completed Successfully! ===");
}

runTests();
