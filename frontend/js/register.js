// =========================================================
// API BASE URL
// =========================================================

const API_BASE_URL =
    window.API_BASE_URL || "http://127.0.0.1:8000";


// =========================================================
// REGISTER ELEMENTS
// =========================================================

const registerForm =
    document.getElementById("registerForm");

const registerMessage =
    document.getElementById("registerMessage");

const registerButton =
    document.getElementById("registerButton");


// =========================================================
// REGISTER
// =========================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // -------------------------------------------------
            // GET FORM VALUES
            // -------------------------------------------------

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

            const confirmPasswordInput =
                document.getElementById("confirmPassword");


            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";

            const confirmPassword =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : "";


            // -------------------------------------------------
            // CLEAR OLD MESSAGE
            // -------------------------------------------------

            if (registerMessage) {

                registerMessage.textContent = "";
            }


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                showRegisterMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // PASSWORD LENGTH
            // -------------------------------------------------

            if (password.length < 6) {

                showRegisterMessage(
                    "Password must be at least 6 characters.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // PASSWORD MATCH
            // -------------------------------------------------

            if (
                password !==
                confirmPassword
            ) {

                showRegisterMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // DISABLE BUTTON
            // -------------------------------------------------

            setRegisterLoading(true);


            try {

                // -------------------------------------------------
                // REGISTER API
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name:
                                    name,

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
                    "Registration response:",
                    data
                );


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (response.ok) {

                    showRegisterMessage(
                        data.message ||
                        "Registration successful!",
                        "success"
                    );


                    // Clear form

                    registerForm.reset();


                    // -------------------------------------------------
                    // FAST REDIRECT TO LOGIN
                    // -------------------------------------------------

                    setTimeout(
                        function () {

                            window.location.replace(
                                "login.html"
                            );

                        },
                        300
                    );


                    return;
                }


                // -------------------------------------------------
                // REGISTRATION FAILED
                // -------------------------------------------------

                const errorMessage =
                    data.detail ||
                    data.message ||
                    "Registration failed. Please try again.";


                showRegisterMessage(
                    errorMessage,
                    "error"
                );


            } catch (error) {

                // -------------------------------------------------
                // CONNECTION ERROR
                // -------------------------------------------------

                console.error(
                    "Registration error:",
                    error
                );


                showRegisterMessage(
                    "Unable to connect to backend server. Please make sure FastAPI is running.",
                    "error"
                );


            } finally {

                // -------------------------------------------------
                // ENABLE BUTTON
                // -------------------------------------------------

                setRegisterLoading(false);
            }

        }
    );
}


// =========================================================
// SHOW REGISTER MESSAGE
// =========================================================

function showRegisterMessage(
    message,
    type
) {

    if (!registerMessage) {
        return;
    }


    registerMessage.textContent =
        message;


    if (type === "success") {

        registerMessage.style.color =
            "#16a34a";

    } else {

        registerMessage.style.color =
            "#dc2626";
    }
}


// =========================================================
// REGISTER BUTTON LOADING
// =========================================================

function setRegisterLoading(
    loading
) {

    if (!registerButton) {
        return;
    }


    if (loading) {

        registerButton.disabled =
            true;

        registerButton.innerHTML =
            "Creating Account...";

    } else {

        registerButton.disabled =
            false;

        registerButton.innerHTML =
            'Create Account <span>→</span>';
    }
}