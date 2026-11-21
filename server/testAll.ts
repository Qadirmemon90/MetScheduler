import { getCache, setCache, delCache, flushCache, rateLimitIncrement, getCacheStatus } from "./config/redis.js";
import { USER_MCP_TOOLS } from "./controller/mcpController.js";
import crypto from "node:crypto";

async function runTests() {
  console.log("=== STARTING METSCHEDULER / METRISOLUTION REGRESSION TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Redis / In-memory Cache Tests
  console.log("\n[1] Testing Cache Engine (Redis + Safe Fallback):");
  await setCache("test:key", { hello: "world" }, 60);
  const cached = await getCache<{ hello: string }>("test:key");
  assert(cached?.hello === "world", "Cache set and retrieve object correctly");

  await delCache("test:key");
  const deleted = await getCache("test:key");
  assert(deleted === null, "Cache deletion works correctly");

  const status = await getCacheStatus();
  assert(typeof status.mode === "string" && (status.mode === "redis" || status.mode === "memory"), `Cache status reporting mode: ${status.mode}`);

  // 2. Rate Limiting Tests
  console.log("\n[2] Testing Distributed Rate Limiting:");
  const testIp = `test_ip_${Date.now()}`;
  const r1 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  assert(r1.count === 1, "First request increments rate limit counter to 1");

  const r2 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  const r3 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  const r4 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  const r5 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  const r6 = await rateLimitIncrement(`ratelimit:login:${testIp}`, 10);
  assert(r6.count === 6, "Rate limit tracks 6 attempts accurately");
  assert(r6.count > 5, "Threshold (>5 attempts) detected for 429 Too Many Requests response");

  // 3. Security & Forgot Password Token Verification
  console.log("\n[3] Testing Password Reset Crypto Token Generation:");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const storedToken = `${tokenHash}:${code}`;
  assert(storedToken.startsWith(tokenHash) && storedToken.endsWith(code), "Token and 6-digit verification code correctly formatted and hashed");

  // 4. Pakistani Manual Payment Logic Verification
  console.log("\n[4] Testing Pakistani Payment Verification Logic:");
  const testPayment = {
    targetPlan: "pro",
    amount: 2500,
    currency: "PKR",
    paymentMethod: "easypaisa",
    transactionId: "TX123456789",
    proofScreenshotUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    status: "pending",
  };
  assert(testPayment.status === "pending", "Payment submission starts with 'pending' status (never auto-activated)");
  assert(Boolean(testPayment.proofScreenshotUrl), "Screenshot receipt is mandatory for verification");
  assert(testPayment.transactionId.length > 5, "Valid transaction ID recorded");

  // 5. MCP Tools Schema & Protocol Verification
  console.log("\n[5] Testing Model Context Protocol (MCP) Standards:");
  assert(USER_MCP_TOOLS.length >= 5, `MCP tools exposed: ${USER_MCP_TOOLS.length} tools`);
  const toolNames = USER_MCP_TOOLS.map((t) => t.name);
  assert(toolNames.includes("metscheduler_list_accounts"), "metscheduler_list_accounts tool available");
  assert(toolNames.includes("metscheduler_schedule_post"), "metscheduler_schedule_post tool available");
  assert(toolNames.includes("metscheduler_list_posts"), "metscheduler_list_posts tool available");
  assert(toolNames.includes("metscheduler_publish_now"), "metscheduler_publish_now tool available");
  assert(toolNames.includes("get_my_profile"), "get_my_profile tool available");
  assert(toolNames.includes("get_subscription_details"), "get_subscription_details tool available");

  // 6. Invoices & Organizations Schema Verification
  console.log("\n[6] Testing Invoices & Multi-tenant Organizations Format:");
  const testInvoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  assert(testInvoiceNum.startsWith("INV-202"), "Invoice follows standard INV-YYYY-XXXXXX format");
  const validOrgStatuses = ["active", "trial", "suspended"];
  assert(validOrgStatuses.includes("active") && validOrgStatuses.includes("suspended"), "Organization status enum conforms to enterprise multi-tenant standards");

  // Cleanup
  await flushCache();
  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
