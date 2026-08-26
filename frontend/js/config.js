// =========================================================
// HR POLICY ASSISTANT - GLOBAL CONFIGURATION
// =========================================================

(function () {
    // ---------------------------------------------------------
    // 1. LIVE PRODUCTION BACKEND URL
    // Replace this with your deployed backend URL (e.g., on Render or Railway)
    // Example: "https://hr-policy-assistant-api.onrender.com"
    // ---------------------------------------------------------
    const PRODUCTION_BACKEND_URL = "https://your-backend-api.onrender.com";

    // ---------------------------------------------------------
    // 2. DETECT LOCAL DEVELOPMENT ENVIRONMENT
    // ---------------------------------------------------------
    const isLocalhost = Boolean(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:" ||
        window.location.hostname === ""
    );

    // ---------------------------------------------------------
    // 3. SET GLOBAL API BASE URL
    // ---------------------------------------------------------
    if (isLocalhost) {
        window.API_BASE_URL = "http://127.0.0.1:8000";
    } else {
        // If PRODUCTION_BACKEND_URL is set, use it; otherwise fallback to current origin
        window.API_BASE_URL = (PRODUCTION_BACKEND_URL && !PRODUCTION_BACKEND_URL.includes("your-backend-api"))
            ? PRODUCTION_BACKEND_URL.replace(/\/+$/, "")
            : window.location.origin.replace(/\/+$/, "");
    }

    console.log("🚀 Connected API Base URL:", window.API_BASE_URL);
})();

