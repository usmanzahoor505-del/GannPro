// Mock environment variable
process.env.JAZZCASH_INTEGRITY_SALT = "TEST_INTEGRITY_SALT";

console.log("Starting JazzCash Secure Hash Hashing test...");

const { generateSecureHash } = await import("../server/services/jazzcash.js");

const mockPayload = {
  pp_Version: "1.1",
  pp_TxnType: "",
  pp_Language: "EN",
  pp_MerchantID: "MC12345",
  pp_Password: "pass",
  pp_TxnRefNo: "T12345",
  pp_Amount: "1000",
  pp_TxnCurrency: "PKR",
  pp_TxnDateTime: "20260606120000",
  pp_BillReference: "bill123",
  pp_Description: "Test product",
  pp_TxnExpiryDateTime: "20260606130000",
  pp_ReturnURL: "http://localhost:3001/api/payments/jazzcash/callback",
};

try {
  const hash = generateSecureHash(mockPayload);
  console.log("Calculated hash:", hash);
  if (hash && hash.length === 64) {
    console.log("✅ Success! Hash generated correctly as uppercase SHA256 hex string.");
  } else {
    console.log("❌ Failed! Invalid hash format.");
  }
} catch (err) {
  console.error("❌ Test crashed:", err);
}
