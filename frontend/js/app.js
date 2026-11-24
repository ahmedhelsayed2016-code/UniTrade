const registerForm = document.querySelector("#register");
const loginForm = document.querySelector("#login");
const authForms = document.querySelector("#auth-forms");
const signedIn = document.querySelector("#signed-in");
const studentName = document.querySelector("#student-name");
const authMessage = document.querySelector("#auth-message");
const logoutButton = document.querySelector("#logout");

async function authRequest(path, method = "GET", fields) {
    const options = { method, credentials: "include" };

    if (fields) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(fields);
    }

    const response = await fetch("/api/auth" + path, options);
    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message);
        error.status = response.status;
        throw error;
    }

    return data;
}

function showAccount(student) {
    authForms.hidden = Boolean(student);
    signedIn.hidden = !student;
    studentName.textContent = student ? `Signed in as ${student.firstName} ${student.lastName}` : "";
}

function updateOtherUniversity() {
    const isOther = registerForm.elements.university.value.trim().toLowerCase() === "other";
    const input = registerForm.elements.otherUniversity;

    document.querySelector("#other-university").hidden = !isOther;
    input.disabled = !isOther;
    input.required = isOther;
}

registerForm.elements.university.addEventListener("input", updateOtherUniversity);

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(registerForm));

    try {
        const data = await authRequest("/register", "POST", fields);
        registerForm.reset();
        updateOtherUniversity();
        loginForm.elements.email.value = fields.email.trim();
        loginForm.elements.password.focus();
        authMessage.textContent = data.message;
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(loginForm));

    try {
        const data = await authRequest("/login", "POST", fields);
        loginForm.reset();
        showAccount(data.student);
        authMessage.textContent = data.message;
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        const data = await authRequest("/logout", "POST");
        showAccount(null);
        authMessage.textContent = data.message;
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

async function restoreSession() {
    try {
        const data = await authRequest("/me");
        showAccount(data.student);
    } catch (error) {
        showAccount(null);
        if (error.status !== 401) {
            authMessage.textContent = error.message;
        }
    }
}

restoreSession();
