// =========================================================
// HR POLICY ASSISTANT - GLOBAL CONFIGURATION
// =========================================================

(function () {
    // ---------------------------------------------------------
    // 1. LIVE PRODUCTION BACKEND URL
    // Replace this with your deployed backend URL (e.g., on Render or Railway)
    // Example: "https://hr-policy-assistant-api.onrender.com"
    // ---------------------------------------------------------
    const PRODUCTION_BACKEND_URL = "https://hr-policy-assistant-486o.onrender.com";

    // ---------------------------------------------------------
    // 2. SET GLOBAL API BASE URL
    // Connect to the Live Render Backend
    // ---------------------------------------------------------
    window.API_BASE_URL = PRODUCTION_BACKEND_URL.replace(/\/+$/, "");

    console.log("🚀 Connected API Base URL:", window.API_BASE_URL);
})();

