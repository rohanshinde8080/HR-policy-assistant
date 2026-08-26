// =========================================================
// API BASE URL
// =========================================================

const API_BASE_URL =
    window.API_BASE_URL || "http://127.0.0.1:8000";


// =========================================================
// GET LOGGED-IN USER
// =========================================================

function getLoggedInUser() {

    const storedUser =
        localStorage.getItem("user");


    if (!storedUser) {

        console.log(
            "No logged-in user found."
        );

        return null;
    }


    try {

        const user =
            JSON.parse(storedUser);


        console.log(
            "Logged-in user:",
            user
        );


        return user;

    } catch (error) {

        console.error(
            "Invalid user data:",
            error
        );


        localStorage.removeItem(
            "user"
        );


        return null;
    }
}


// =========================================================
// CHECK ADMIN LOGIN
// =========================================================

function checkAdminLogin() {

    const user =
        getLoggedInUser();


    // -------------------------------------------------
    // USER NOT LOGGED IN
    // -------------------------------------------------

    if (!user) {

        window.location.replace(
            "login.html"
        );

        return null;
    }


    // -------------------------------------------------
    // CHECK ROLE
    // -------------------------------------------------

    const role =
        String(
            user.role || ""
        )
        .trim()
        .toLowerCase();


    console.log(
        "Current user role:",
        role
    );


    // -------------------------------------------------
    // NON-ADMIN
    // -------------------------------------------------

    if (role !== "admin") {

        alert(
            "Access denied. Admin account required."
        );


        window.location.replace(
            "employee.html"
        );


        return null;
    }


    return user;
}


// =========================================================
// DISPLAY ADMIN INFORMATION
// =========================================================

function displayAdminInfo() {

    const admin =
        checkAdminLogin();


    if (!admin) {
        return;
    }


    // -------------------------------------------------
    // ADMIN NAME
    // -------------------------------------------------

    const adminName =
        document.getElementById(
            "adminName"
        );


    if (adminName) {

        adminName.textContent =
            admin.name ||
            admin.email ||
            "Admin";
    }


    // -------------------------------------------------
    // ADMIN ROLE
    // -------------------------------------------------

    const adminRole =
        document.getElementById(
            "adminRole"
        );


    if (adminRole) {

        adminRole.textContent =
            "Administrator";
    }


    // -------------------------------------------------
    // ADMIN AVATAR
    // -------------------------------------------------

    const adminAvatar =
        document.getElementById(
            "adminAvatar"
        );


    if (adminAvatar) {

        const name =
            admin.name ||
            admin.email ||
            "Admin";


        adminAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }

    // Dynamic Human Greeting & Live Date
    const hour = new Date().getHours();
    let greetingText = "Good morning";
    let greetingEmoji = "☀️";
    if (hour >= 12 && hour < 17) {
        greetingText = "Good afternoon";
        greetingEmoji = "🌤️";
    } else if (hour >= 17) {
        greetingText = "Good evening";
        greetingEmoji = "🌙";
    }

    const timeGreeting = document.getElementById("timeGreeting");
    if (timeGreeting) {
        timeGreeting.textContent = `${greetingText} ${greetingEmoji}`;
    }

    const heroAdminTitle = document.getElementById("heroAdminTitle");
    if (heroAdminTitle) {
        const firstName = (admin.name || "Admin").split(" ")[0];
        heroAdminTitle.textContent = `${greetingText}, ${firstName}!`;
    }

    const topCenterAdminName = document.getElementById("topCenterAdminName");
    if (topCenterAdminName) {
        topCenterAdminName.textContent = admin.name || "Administrator";
    }

    const liveDate = document.getElementById("liveDate");
    if (liveDate) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        liveDate.textContent = new Date().toLocaleDateString('en-US', options);
    }

    console.log(
        "Admin dashboard loaded for:",
        admin.name
    );
}


// =========================================================
// ADMIN LOGOUT
// =========================================================

const adminLogoutBtn =
    document.getElementById(
        "adminLogoutBtn"
    );


if (adminLogoutBtn) {

    adminLogoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "user"
            );


            window.location.replace(
                "login.html"
            );
        }
    );
}


// =========================================================
// PDF ELEMENTS
// =========================================================

const policyFile =
    document.getElementById(
        "policyFile"
    );


const selectedFile =
    document.getElementById(
        "selectedFile"
    );


const uploadPolicyBtn =
    document.getElementById(
        "uploadPolicyBtn"
    );


const uploadMessage =
    document.getElementById(
        "uploadMessage"
    );


// =========================================================
// SELECT PDF
// =========================================================

if (policyFile) {

    policyFile.addEventListener(
        "change",
        function () {

            const file =
                policyFile.files[0];


            // -------------------------------------------------
            // NO FILE
            // -------------------------------------------------

            if (!file) {

                if (selectedFile) {

                    selectedFile.textContent =
                        "No file selected";
                }

                return;
            }


            // -------------------------------------------------
            // CHECK PDF
            // -------------------------------------------------

            const isPDF =
                file.type === "application/pdf" ||
                file.name
                    .toLowerCase()
                    .endsWith(".pdf");


            if (!isPDF) {

                if (selectedFile) {

                    selectedFile.textContent =
                        "Please select a PDF file.";
                }


                policyFile.value =
                    "";


                return;
            }


            // -------------------------------------------------
            // SHOW FILE NAME
            // -------------------------------------------------

            if (selectedFile) {

                selectedFile.textContent =
                    file.name;
            }
        }
    );
}


// =========================================================
// UPLOAD PDF
// =========================================================

if (uploadPolicyBtn) {

    uploadPolicyBtn.addEventListener(
        "click",
        async function () {

            // -------------------------------------------------
            // CHECK ADMIN
            // -------------------------------------------------

            const admin =
                checkAdminLogin();


            if (!admin) {
                return;
            }


            // -------------------------------------------------
            // CHECK FILE
            // -------------------------------------------------

            const file =
                policyFile &&
                policyFile.files
                    ? policyFile.files[0]
                    : null;


            if (!file) {

                showUploadMessage(
                    "Please select a PDF file.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // CHECK PDF
            // -------------------------------------------------

            const isPDF =
                file.type === "application/pdf" ||
                file.name
                    .toLowerCase()
                    .endsWith(".pdf");


            if (!isPDF) {

                showUploadMessage(
                    "Only PDF files are allowed.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // DISABLE BUTTON
            // -------------------------------------------------

            uploadPolicyBtn.disabled =
                true;


            uploadPolicyBtn.innerHTML =
                "Processing PDF...";


            showUploadMessage(
                "Uploading and processing PDF...",
                "loading"
            );


            try {

                // -------------------------------------------------
                // FORM DATA
                // -------------------------------------------------

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                // -------------------------------------------------
                // UPLOAD API
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/upload-policy?email=${encodeURIComponent(
                            admin.email
                        )}`,
                        {
                            method: "POST",

                            body: formData
                        }
                    );


                // -------------------------------------------------
                // READ RESPONSE
                // -------------------------------------------------

                let data = {};

                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    console.error(
                        "Invalid upload response:",
                        jsonError
                    );
                }


                console.log(
                    "Upload response:",
                    data
                );


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (response.ok) {

                    showUploadMessage(
                        data.message ||
                        "Policy uploaded successfully.",
                        "success"
                    );


                    // -------------------------------------------------
                    // UPDATE POLICY STATUS
                    // -------------------------------------------------

                    const policyStatus =
                        document.getElementById(
                            "policyStatus"
                        );


                    if (policyStatus) {

                        policyStatus.textContent =
                            "Updated";
                    }


                    // -------------------------------------------------
                    // RESET FILE INPUT
                    // -------------------------------------------------

                    policyFile.value =
                        "";


                    if (selectedFile) {

                        selectedFile.textContent =
                            "No file selected";
                    }

                    // Refresh active policy card
                    await loadCurrentPolicy();


                } else {

                    showUploadMessage(
                        data.detail ||
                        data.message ||
                        "Policy upload failed.",
                        "error"
                    );
                }


            } catch (error) {

                console.error(
                    "PDF upload error:",
                    error
                );


                showUploadMessage(
                    "Unable to connect to backend server.",
                    "error"
                );


            } finally {

                // -------------------------------------------------
                // ENABLE BUTTON
                // -------------------------------------------------

                uploadPolicyBtn.disabled =
                    false;


                uploadPolicyBtn.innerHTML =
                    'Upload & Process <span>→</span>';
            }
        }
    );
}


// =========================================================
// SHOW UPLOAD MESSAGE
// =========================================================

function showUploadMessage(
    message,
    type
) {

    if (!uploadMessage) {
        return;
    }


    uploadMessage.textContent =
        message;


    if (type === "success") {

        uploadMessage.style.color =
            "#16a34a";

    } else if (type === "loading") {

        uploadMessage.style.color =
            "#2563eb";

    } else {

        uploadMessage.style.color =
            "#dc2626";
    }
}


// =========================================================
// LOAD CURRENT ACTIVE POLICY
// =========================================================

async function loadCurrentPolicy() {
    const currentPolicyName = document.getElementById("currentPolicyName");
    const currentPolicySize = document.getElementById("currentPolicySize");
    const currentPolicyChunks = document.getElementById("currentPolicyChunks");
    const currentPolicyDate = document.getElementById("currentPolicyDate");
    const viewPolicyBtn = document.getElementById("viewPolicyBtn");

    if (!currentPolicyName) return;

    try {
        const response = await fetch(`${API_BASE_URL}/current-policy`);
        if (!response.ok) {
            throw new Error("Unable to fetch policy info");
        }

        const data = await response.json();
        if (data.has_policy && data.latest_policy) {
            const policy = data.latest_policy;
            currentPolicyName.textContent = policy.filename;
            if (currentPolicySize) currentPolicySize.textContent = policy.size || "-";
            if (currentPolicyChunks) currentPolicyChunks.textContent = `${data.total_chunks || 0} chunks`;
            if (currentPolicyDate) currentPolicyDate.textContent = policy.modified_at || "-";

            const statName = document.getElementById("currentPolicyStatName");
            const statChunks = document.getElementById("currentPolicyStatChunks");
            const chatActiveDoc = document.getElementById("chatActiveDocName");
            if (statName) statName.textContent = policy.filename;
            if (statChunks) statChunks.textContent = `${data.total_chunks || 0} Vectors Indexed`;
            if (chatActiveDoc) chatActiveDoc.textContent = policy.filename;

            if (viewPolicyBtn) {
                viewPolicyBtn.href = `${API_BASE_URL}/view-policy/${encodeURIComponent(policy.filename)}`;
                viewPolicyBtn.style.display = "inline-flex";
            }
        } else {
            currentPolicyName.textContent = "No policy document uploaded yet.";
            const statName = document.getElementById("currentPolicyStatName");
            const statChunks = document.getElementById("currentPolicyStatChunks");
            if (statName) statName.textContent = "None Uploaded";
            if (statChunks) statChunks.textContent = "0 Vectors";
            if (viewPolicyBtn) viewPolicyBtn.style.display = "none";
        }
    } catch (err) {
        console.error("Error loading policy info:", err);
        currentPolicyName.textContent = "Unable to load active policy.";
    }
}


// =========================================================
// SETUP DRAG & DROP
// =========================================================

function setupDragAndDrop() {
    const dropZone = document.getElementById("dropZone");
    const policyFileInput = document.getElementById("policyFile");
    const selectedFileDisplay = document.getElementById("selectedFile");

    if (!dropZone || !policyFileInput) return;

    dropZone.addEventListener("click", () => policyFileInput.click());

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("dragover");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("dragover");
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            policyFileInput.files = files;
            const file = files[0];
            if (file.name.toLowerCase().endsWith(".pdf")) {
                const sizeKb = (file.size / 1024).toFixed(1);
                selectedFileDisplay.innerHTML = `📄 <strong>${file.name}</strong> (${sizeKb} KB) ready to upload`;
                selectedFileDisplay.style.color = "#16a34a";
            } else {
                selectedFileDisplay.textContent = "Only PDF files are supported.";
                selectedFileDisplay.style.color = "#dc2626";
            }
        }
    });

    policyFileInput.addEventListener("change", () => {
        const file = policyFileInput.files[0];
        if (file && selectedFileDisplay) {
            const sizeKb = (file.size / 1024).toFixed(1);
            selectedFileDisplay.innerHTML = `📄 <strong>${file.name}</strong> (${sizeKb} KB) ready to upload`;
            selectedFileDisplay.style.color = "#16a34a";
        }
    });
}


// =========================================================
// FORMAT MARKDOWN & BULLETS FOR CLEAN DISPLAY
// =========================================================

function formatAIResponse(text) {
    if (!text) return "";

    let clean = text.trim();

    // Convert markdown bold: **text** -> <strong>text</strong>
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-highlight">$1</strong>');

    // Split on bullet points or lines
    const lines = clean.split('\n');
    const rendered = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Check if line is a bullet item or contains inline bullets
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const item = line.replace(/^[\*\-]\s+/, '');
            rendered.push(`<li class="ai-bullet-item"><span class="ai-bullet-icon">✦</span><div>${item}</div></li>`);
        } else if (line.includes('* <strong') || line.includes('* <strong>')) {
            const parts = line.split(/\s*\*\s+/);
            if (parts[0]) rendered.push(`<p class="ai-intro-text">${parts[0]}</p>`);
            for (let i = 1; i < parts.length; i++) {
                if (parts[i]) {
                    rendered.push(`<li class="ai-bullet-item"><span class="ai-bullet-icon">✦</span><div>${parts[i]}</div></li>`);
                }
            }
        } else {
            rendered.push(`<p class="ai-para">${line}</p>`);
        }
    }

    let resultHtml = rendered.join('');
    resultHtml = resultHtml.replace(/(<li class="ai-bullet-item">.*?<\/li>)+/gs, '<ul class="ai-bullet-list">$&</ul>');
    return resultHtml;
}


// =========================================================
// SETUP QUICK POLICY TESTER & INTERACTIVE CHAT SIMULATOR
// =========================================================

function setupQuickTester() {
    const testInput = document.getElementById("adminTestInput");
    const testBtn = document.getElementById("adminTestBtn");
    const chatStream = document.getElementById("chatStream");
    const clearChatBtn = document.getElementById("clearChatBtn");

    if (!testBtn || !testInput || !chatStream) return;

    const admin = getLoggedInUser();
    const userInitial = (admin && admin.name) ? admin.name.charAt(0).toUpperCase() : "A";

    function scrollChat() {
        chatStream.scrollTop = chatStream.scrollHeight;
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            const activeDoc = document.getElementById("currentPolicyStatName");
            const docName = activeDoc ? activeDoc.textContent : "active policy";
            chatStream.innerHTML = `
                <div class="chat-msg bot-msg">
                    <div class="msg-avatar bot-avatar">🤖</div>
                    <div class="msg-body">
                        <p>Chat cleared! Ready for new questions based on <strong>${docName}</strong>. What would you like to know?</p>
                    </div>
                </div>
            `;
            scrollChat();
        });
    }

    async function runTest(question) {
        if (!question || !question.trim()) return;
        if (testBtn.disabled) return; // Prevent double trigger!

        const q = question.trim();
        testInput.value = "";

        // Remove any stale loading bubbles
        chatStream.querySelectorAll(".loading-bubble").forEach(el => {
            el.closest(".chat-msg")?.remove();
        });

        // 1. User Message
        const userMsgDiv = document.createElement("div");
        userMsgDiv.className = "chat-msg user-msg";
        userMsgDiv.innerHTML = `
            <div class="msg-body user-bubble">
                <p>${escapeHtml(q)}</p>
            </div>
            <div class="msg-avatar user-avatar">${userInitial}</div>
        `;
        chatStream.appendChild(userMsgDiv);

        // 2. Loading Bubble
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "chat-msg bot-msg";
        loadingDiv.innerHTML = `
            <div class="msg-avatar bot-avatar">🤖</div>
            <div class="msg-body loading-bubble">
                <span class="pulse-dot"></span> Searching FAISS & consulting Gemini AI...
            </div>
        `;
        chatStream.appendChild(loadingDiv);
        scrollChat();

        // Lock UI while thinking
        testBtn.disabled = true;
        testBtn.innerHTML = "Thinking... <span>⏳</span>";
        document.querySelectorAll(".preset-btn").forEach(b => {
            b.style.pointerEvents = "none";
            b.style.opacity = "0.5";
        });

        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s safety timeout

        try {
            const userId = admin ? admin.user_id : null;

            const response = await fetch(`${API_BASE_URL}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q, user_id: userId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const latency = ((performance.now() - startTime) / 1000).toFixed(2);

            // Always remove loading bubble
            loadingDiv.remove();

            if (response.ok) {
                const data = await response.json();
                const formattedAnswer = formatAIResponse(data.answer || "No answer returned.");

                let sourcesHtml = "";
                if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
                    const snippet = data.sources[0].trim();
                    sourcesHtml = `
                        <div class="source-snippet-box">
                            <div class="source-snippet-header">
                                <span>ⓘ Source Snippet (FAISS Grounding)</span>
                            </div>
                            <div class="source-snippet-content">
                                "${escapeHtml(snippet)}"
                            </div>
                        </div>
                    `;
                }

                const botMsgDiv = document.createElement("div");
                botMsgDiv.className = "chat-msg bot-msg";
                botMsgDiv.innerHTML = `
                    <div class="msg-avatar bot-avatar">🤖</div>
                    <div class="msg-body bot-bubble">
                        <div class="bot-answer-text">${formattedAnswer}</div>
                        ${sourcesHtml}
                        <div class="msg-action-bar">
                            <button type="button" class="action-btn copy-btn" data-text="${encodeURIComponent(data.answer || "")}">
                                📋 Copy Answer
                            </button>
                            <button type="button" class="action-btn speak-btn" data-text="${encodeURIComponent(data.answer || "")}">
                                🔊 Listen
                            </button>
                            <span class="latency-pill">⚡ Responded in ${latency}s</span>
                        </div>
                    </div>
                `;
                chatStream.appendChild(botMsgDiv);

                botMsgDiv.querySelector(".copy-btn")?.addEventListener("click", function () {
                    const raw = decodeURIComponent(this.dataset.text);
                    navigator.clipboard.writeText(raw).then(() => {
                        this.innerHTML = "✓ Copied!";
                        setTimeout(() => { this.innerHTML = "📋 Copy Answer"; }, 2000);
                    });
                });

                botMsgDiv.querySelector(".speak-btn")?.addEventListener("click", function () {
                    const raw = decodeURIComponent(this.dataset.text);
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(raw);
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;
                        window.speechSynthesis.speak(utterance);
                        this.innerHTML = "🔊 Speaking...";
                        utterance.onend = () => { this.innerHTML = "🔊 Listen"; };
                        utterance.onerror = () => { this.innerHTML = "🔊 Listen"; };
                    }
                });

            } else {
                const err = await response.json().catch(() => ({}));
                const errorDiv = document.createElement("div");
                errorDiv.className = "chat-msg bot-msg";
                errorDiv.innerHTML = `
                    <div class="msg-avatar bot-avatar">🤖</div>
                    <div class="msg-body bot-bubble error-bubble">
                        <p style="color: #dc2626; font-weight: 600;">Error: ${err.detail || "Failed to get AI answer."}</p>
                    </div>
                `;
                chatStream.appendChild(errorDiv);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            loadingDiv.remove();

            const isTimeout = error.name === "AbortError";
            const errDiv = document.createElement("div");
            errDiv.className = "chat-msg bot-msg";
            errDiv.innerHTML = `
                <div class="msg-avatar bot-avatar">🤖</div>
                <div class="msg-body bot-bubble error-bubble">
                    <p style="color: #dc2626; font-weight: 600;">
                        ${isTimeout ? "⏱ Request timed out. Please try again." : "Server connection error. Please check backend."}
                    </p>
                </div>
            `;
            chatStream.appendChild(errDiv);
        } finally {
            testBtn.disabled = false;
            testBtn.innerHTML = "Test Query <span>▷</span>";
            document.querySelectorAll(".preset-btn").forEach(b => {
                b.style.pointerEvents = "auto";
                b.style.opacity = "1";
            });
            scrollChat();
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    testBtn.addEventListener("click", () => runTest(testInput.value));

    testInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            runTest(testInput.value);
        }
    });

    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (testBtn.disabled) return;
            const q = btn.dataset.q;
            testInput.value = q;
            runTest(q);
        });
    });
}


// =========================================================
// ADMIN PAGE INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        displayAdminInfo();
        loadCurrentPolicy();
        setupDragAndDrop();
        setupQuickTester();
    }
);