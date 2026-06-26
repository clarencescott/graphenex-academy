const form = document.getElementById("accessForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const authMessage = document.getElementById("authMessage");

const SESSION_KEY = "graphenex-user-session";

function setMessage(text, success = false) {
  authMessage.textContent = text;
  authMessage.classList.toggle("success", success);
}

function isValidCorporateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    setMessage("Please enter both email and password.");
    return;
  }

  if (!isValidCorporateEmail(email)) {
    setMessage("Please enter a valid work email address.");
    return;
  }

  if (password.length < 8) {
    setMessage("Password must be at least 8 characters.");
    return;
  }

  const sessionData = {
    email,
    authenticatedAt: new Date().toISOString(),
    remember: rememberMe.checked
  };

  const storage = rememberMe.checked ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(sessionData));

  setMessage("Access granted. Redirecting to GrapheneX Academy…", true);

  window.setTimeout(() => {
    window.location.href = "portal-access.html";
  }, 700);
});
