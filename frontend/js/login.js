// =========================================================
// API BASE URL
// =========================================================

const API_BASE_URL =
    window.API_BASE_URL || "http://127.0.0.1:8000";


// =========================================================
// LOGIN ELEMENTS
// =========================================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // -------------------------------------------------
            // GET INPUT
            // -------------------------------------------------

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (!email || !password) {

                showLoginMessage(
                    "Please enter email and password.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // LOGIN BUTTON
            // -------------------------------------------------

            const loginButton =
                loginForm.querySelector("button");


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.innerHTML =
                    "Logging in...";
            }


            if (loginMessage) {

                loginMessage.textContent =
                    "";
            }


            try {

                // -------------------------------------------------
                // LOGIN API
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email:
                                    email,

                                password:
                                    password

                            })
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
                        "Invalid server response:",
                        jsonError
                    );
                }


                console.log(
                    "Login response:",
                    data
                );


                // -------------------------------------------------
                // LOGIN SUCCESS
                // -------------------------------------------------

                if (response.ok) {


                    // ---------------------------------------------
                    // CHECK USER DATA
                    // ---------------------------------------------

                    if (!data.user_id) {

                        showLoginMessage(
                            "Login successful, but user information is missing.",
                            "error"
                        );

                        return;
                    }


                    // ---------------------------------------------
                    // GET ROLE
                    // ---------------------------------------------

                    const role =
                        String(
                            data.role || "employee"
                        )
                        .trim()
                        .toLowerCase();


                    // ---------------------------------------------
                    // SAVE COMPLETE USER DATA
                    // ---------------------------------------------

                    localStorage.setItem(
                        "user",
                        JSON.stringify({
                            user_id:
                                data.user_id,

                            name:
                                data.name || "",

                            email:
                                data.email || email,

                            role:
                                role
                        })
                    );


                    console.log(
                        "Logged-in user:",
                        data.name
                    );

                    console.log(
                        "Logged-in email:",
                        data.email
                    );

                    console.log(
                        "Logged-in role:",
                        role
                    );


                    // ---------------------------------------------
                    // SUCCESS MESSAGE
                    // ---------------------------------------------

                    showLoginMessage(
                        "Login successful!",
                        "success"
                    );


                    // ---------------------------------------------
                    // ROLE BASED REDIRECT
                    // ---------------------------------------------

                    if (role === "admin") {

                        window.location.replace(
                            "admin.html"
                        );

                    } else {

                        window.location.replace(
                            "employee.html"
                        );
                    }


                    return;
                }


                // -------------------------------------------------
                // LOGIN FAILED
                // -------------------------------------------------

                const errorMessage =
                    data.detail ||
                    data.message ||
                    "Invalid email or password.";


                showLoginMessage(
                    errorMessage,
                    "error"
                );


            } catch (error) {

                // -------------------------------------------------
                // CONNECTION ERROR
                // -------------------------------------------------

                console.error(
                    "Login error:",
                    error
                );


                showLoginMessage(
                    "Unable to connect to backend server. Please make sure FastAPI is running.",
                    "error"
                );


            } finally {

                // -------------------------------------------------
                // RESTORE BUTTON
                // -------------------------------------------------

                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.innerHTML =
                        'Login <span>→</span>';
                }
            }

        }
    );
}


// =========================================================
// SHOW LOGIN MESSAGE
// =========================================================

function showLoginMessage(
    message,
    type
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        message;


    if (type === "success") {

        loginMessage.style.color =
            "#16a34a";

    } else {

        loginMessage.style.color =
            "#dc2626";
    }
}