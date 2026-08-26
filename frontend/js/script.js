// =========================================================
// HR POLICY ASSISTANT
// EMPLOYEE DASHBOARD JAVASCRIPT
// =========================================================


// =========================================================
// API BASE URL
// =========================================================

const API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const chatForm = document.getElementById("chatForm");

const questionInput =
    document.getElementById("questionInput");

const chatMessages =
    document.getElementById("chatMessages");

const employeeName =
    document.getElementById("employeeName");

const employeeAvatar =
    document.getElementById("employeeAvatar");

const employeeRole =
    document.getElementById("employeeRole");

const logoutBtn =
    document.getElementById("logoutBtn");

const chatHistory =
    document.getElementById("chatHistory");

const sendButton =
    document.getElementById("sendQuestion");


// =========================================================
// GET LOGGED-IN USER
// =========================================================

function getLoggedInUser() {

    const storedUser =
        localStorage.getItem("user");

    if (!storedUser) {
        return null;
    }

    try {

        return JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Invalid user data:",
            error
        );

        localStorage.removeItem("user");

        return null;
    }
}


// =========================================================
// CHECK EMPLOYEE LOGIN
// =========================================================

function checkEmployeeLogin() {

    const user =
        getLoggedInUser();

    // No login
    if (!user) {

        window.location.replace(
            "login.html"
        );

        return null;
    }


    // User ID required
    if (!user.user_id) {

        console.error(
            "User ID missing."
        );

        localStorage.removeItem("user");

        window.location.replace(
            "login.html"
        );

        return null;
    }


    // Admin cannot access employee dashboard
    const role =
        String(
            user.role || "employee"
        )
        .trim()
        .toLowerCase();


    if (role === "admin") {

        window.location.replace(
            "admin.html"
        );

        return null;
    }


    return user;
}


// =========================================================
// DISPLAY EMPLOYEE INFORMATION
// =========================================================

function displayEmployeeInfo() {

    const user =
        checkEmployeeLogin();

    if (!user) {
        return;
    }


    // Employee name
    if (employeeName) {

        employeeName.textContent =
            user.name ||
            user.username ||
            user.email ||
            "Employee";
    }


    // Employee avatar
    if (employeeAvatar) {

        const displayName =
            user.name ||
            user.email ||
            "Employee";

        employeeAvatar.textContent =
            displayName
                .charAt(0)
                .toUpperCase();
    }


    // Employee role
    if (employeeRole) {

        employeeRole.textContent =
            "Employee Account";
    }
}


// =========================================================
// LOGOUT
// =========================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
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
// SCROLL CHAT TO BOTTOM
// =========================================================

function scrollChatToBottom() {

    if (chatMessages) {

        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }
}


// =========================================================
// ADD USER MESSAGE
// =========================================================

function addUserMessage(question) {

    if (!chatMessages) {
        return;
    }


    const message =
        document.createElement("div");

    message.className =
        "user-message";


    message.innerHTML = `

        <div class="message-content user-content">

            <span class="message-name">
                You
            </span>

            <p></p>

        </div>

    `;


    message
        .querySelector("p")
        .textContent =
        question;


    chatMessages.appendChild(
        message
    );


    scrollChatToBottom();
}


// =========================================================
// ADD AI MESSAGE
// =========================================================

function formatAIResponse(text) {
    if (!text) return "";
    let clean = text.trim();
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-highlight">$1</strong>');
    const lines = clean.split('\n');
    const rendered = [];
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
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

function addAIMessage(answer) {

    if (!chatMessages) {
        return;
    }

    const message =
        document.createElement("div");

    message.className =
        "assistant-message";

    message.innerHTML = `
        <div class="message-avatar">
            AI
        </div>
        <div class="message-content">
            <span class="message-name">
                HR Assistant
            </span>
            <div class="ai-response-body">${formatAIResponse(answer)}</div>
        </div>
    `;

    chatMessages.appendChild(
        message
    );

    scrollChatToBottom();
}


// =========================================================
// ADD LOADING MESSAGE
// =========================================================

function addLoadingMessage() {

    if (!chatMessages) {
        return;
    }


    removeLoadingMessage();


    const message =
        document.createElement("div");

    message.id =
        "aiLoadingMessage";

    message.className =
        "assistant-message";


    message.innerHTML = `

        <div class="message-avatar">
            AI
        </div>

        <div class="message-content">

            <span class="message-name">
                HR Assistant
            </span>

            <p>
                Thinking...
            </p>

        </div>

    `;


    chatMessages.appendChild(
        message
    );


    scrollChatToBottom();
}


// =========================================================
// REMOVE LOADING MESSAGE
// =========================================================

function removeLoadingMessage() {

    const loading =
        document.getElementById(
            "aiLoadingMessage"
        );


    if (loading) {

        loading.remove();
    }
}


// =========================================================
// ASK HR QUESTION
// =========================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Check login
            const user =
                checkEmployeeLogin();

            if (!user) {
                return;
            }


            // Get question
            const question =
                questionInput.value.trim();


            if (!question) {
                return;
            }


            // Show question
            addUserMessage(
                question
            );


            // Clear input
            questionInput.value =
                "";


            // Disable input
            questionInput.disabled =
                true;


            if (sendButton) {

                sendButton.disabled =
                    true;

                sendButton.textContent =
                    "...";
            }


            // Show loading
            addLoadingMessage();


            try {

                // =================================================
                // ASK API
                // =================================================

                const response =
                    await fetch(
                        `${API_BASE_URL}/ask`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                question:
                                    question,

                                user_id:
                                    user.user_id

                            })
                        }
                    );


                // =================================================
                // READ RESPONSE
                // =================================================

                let data = {};

                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    console.error(
                        "Invalid API response:",
                        jsonError
                    );
                }


                // Remove loading
                removeLoadingMessage();


                // =================================================
                // SUCCESS
                // =================================================

                if (response.ok) {

                    const answer =
                        data.answer ||
                        data.response ||
                        data.message ||
                        "I couldn't find an answer to your question.";


                    addAIMessage(
                        answer
                    );


                    // Refresh history
                    await loadChatHistory();

                }

                // =================================================
                // ERROR
                // =================================================

                else {

                    const errorMessage =
                        data.detail ||
                        data.message ||
                        "Unable to get answer.";

                    addAIMessage(
                        "Sorry, " +
                        errorMessage
                    );
                }


            } catch (error) {

                console.error(
                    "Chat API error:",
                    error
                );


                removeLoadingMessage();


                addAIMessage(
                    "Unable to connect to the HR Assistant server. Please make sure the FastAPI backend is running."
                );

            }


            // =================================================
            // RESTORE INPUT
            // =================================================

            finally {

                questionInput.disabled =
                    false;


                if (sendButton) {

                    sendButton.disabled =
                        false;

                    sendButton.textContent =
                        "→";
                }


                questionInput.focus();
            }

        }
    );
}


// =========================================================
// SUGGESTED QUESTIONS
// =========================================================

const suggestionButtons =
    document.querySelectorAll(
        ".suggestion-btn"
    );


suggestionButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                if (!questionInput) {
                    return;
                }


                questionInput.value =
                    button.textContent.trim();


                questionInput.focus();
            }
        );
    }
);


// =========================================================
// LOAD USER-SPECIFIC CHAT HISTORY
// =========================================================

async function loadChatHistory() {

    if (!chatHistory) {
        return;
    }


    const user =
        getLoggedInUser();


    // User not available
    if (!user || !user.user_id) {

        chatHistory.innerHTML = `

            <div class="empty-history">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Please login again
                </h3>

                <p>
                    User information is not available.
                </p>

            </div>

        `;

        return;
    }


    try {

        // =================================================
        // CHAT HISTORY API
        // =================================================

        const response =
            await fetch(
                `${API_BASE_URL}/chat-history?user_id=${encodeURIComponent(
                    user.user_id
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load chat history"
            );
        }


        const data =
            await response.json();


        // Clear previous history
        chatHistory.innerHTML =
            "";


        // =================================================
        // NO HISTORY
        // =================================================

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            chatHistory.innerHTML = `

                <div class="empty-history">

                    <div class="empty-icon">
                        ◷
                    </div>

                    <h3>
                        No recent conversations
                    </h3>

                    <p>
                        Your HR questions and answers
                        will appear here.
                    </p>

                </div>

            `;

            return;
        }


        // =================================================
        // DISPLAY HISTORY
        // =================================================

        data.forEach(
            function (item) {

                const historyItem =
                    document.createElement("div");


                historyItem.className =
                    "history-item";


                historyItem.innerHTML = `

                    <div class="history-question">

                        <div class="history-icon">
                            ?
                        </div>

                        <div>

                            <span>
                                Your Question
                            </span>

                            <p class="history-question-text"></p>

                            <small class="history-date"></small>

                        </div>

                    </div>


                    <div class="history-answer">

                        <div class="history-ai-icon">
                            AI
                        </div>

                        <div>

                            <span>
                                HR Assistant
                            </span>

                            <p class="history-answer-text"></p>

                        </div>

                    </div>

                `;


                // Question
                const questionElement =
                    historyItem.querySelector(
                        ".history-question-text"
                    );


                questionElement.textContent =
                    item.question ||
                    "No question available";


                // Answer
                const answerElement =
                    historyItem.querySelector(
                        ".history-answer-text"
                    );


                answerElement.textContent =
                    item.answer ||
                    "No answer available";


                // Date
                const dateElement =
                    historyItem.querySelector(
                        ".history-date"
                    );


                if (item.created_at) {

                    const date =
                        new Date(
                            item.created_at
                        );


                    if (
                        !isNaN(
                            date.getTime()
                        )
                    ) {

                        dateElement.textContent =
                            date.toLocaleString();

                    } else {

                        dateElement.textContent =
                            item.created_at;
                    }

                } else {

                    dateElement.textContent =
                        "";
                }


                chatHistory.appendChild(
                    historyItem
                );

            }
        );


    } catch (error) {

        console.error(
            "Chat history error:",
            error
        );


        chatHistory.innerHTML = `

            <div class="empty-history">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Unable to load history
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>

        `;
    }
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Display logged-in employee
        displayEmployeeInfo();


        // Load user-specific history
        loadChatHistory();

    }
);