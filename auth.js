const form = document.getElementById("accessForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const authMessage = document.getElementById("authMessage");
const signOutBtn = document.getElementById("signOutBtn");
const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupConfirmPassword = document.getElementById("signupConfirmPassword");
const signupMessage = document.getElementById("signupMessage");
const loginTabBtn = document.getElementById("loginTabBtn");
const signupTabBtn = document.getElementById("signupTabBtn");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");

function setMessage(text, success = false) {
  if (!authMessage) return;
  authMessage.textContent = text;
  authMessage.classList.toggle("success", success);
}

function setSignupMessage(text, success = false) {
  if (!signupMessage) return;
  signupMessage.textContent = text;
  signupMessage.classList.toggle("success", success);
}

function isValidCorporateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toFriendlyAuthError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid work email address.";
    case "auth/user-disabled":
      return "Your account has been disabled. Contact an administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/email-already-in-use":
      return "That email is already registered. Please sign in instead.";
    case "auth/weak-password":
      return "Please choose a stronger password (minimum 8 characters).";
    default:
      return "Sign-in failed. Please verify your Firebase account credentials.";
  }
}

function waitForFirebaseAuthApi() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100;
    const intervalId = window.setInterval(() => {
      if (window.grapheneAuth) {
        window.clearInterval(intervalId);
        resolve(window.grapheneAuth);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
        reject(new Error("Firebase auth API not initialized."));
      }
    }, 30);
  });
}

function setActiveAuthTab(mode) {
  const isLogin = mode === "login";

  if (loginTabBtn) {
    loginTabBtn.classList.toggle("active", isLogin);
    loginTabBtn.setAttribute("aria-selected", String(isLogin));
  }

  if (signupTabBtn) {
    signupTabBtn.classList.toggle("active", !isLogin);
    signupTabBtn.setAttribute("aria-selected", String(!isLogin));
  }

  if (loginPanel) {
    loginPanel.classList.toggle("hidden-panel", !isLogin);
    loginPanel.setAttribute("aria-hidden", String(!isLogin));
  }

  if (signupPanel) {
    signupPanel.classList.toggle("hidden-panel", isLogin);
    signupPanel.setAttribute("aria-hidden", String(isLogin));
  }
}

function setupAuthTabs() {
  if (!loginTabBtn || !signupTabBtn || !loginPanel || !signupPanel) {
    return;
  }

  setActiveAuthTab("login");

  loginTabBtn.addEventListener("click", () => setActiveAuthTab("login"));
  signupTabBtn.addEventListener("click", () => setActiveAuthTab("signup"));
}

async function protectDashboardRoute(api) {
  if (!window.location.pathname.toLowerCase().includes("portal-access.html")) {
    return;
  }

  api.observeAuthState((user) => {
    if (!user) {
      window.location.replace("index.html");
    }
  });
}

async function setupLoginPage(api) {
  if (!form) {
    return;
  }

  api.observeAuthState((user) => {
    if (user) {
      window.location.replace("portal-access.html");
    }
  });

  form.addEventListener("submit", async (event) => {
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

    try {
      await api.login(email, password, Boolean(rememberMe?.checked));
      setMessage("Access granted. Redirecting to GrapheneX Academy…", true);
      window.setTimeout(() => {
        window.location.replace("portal-access.html");
      }, 450);
    } catch (error) {
      setMessage(toFriendlyAuthError(error?.code));
    }
  });
}

function setupSignupPage(api) {
  if (!signupForm) {
    return;
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = signupName?.value.trim() ?? "";
    const email = signupEmail?.value.trim().toLowerCase() ?? "";
    const password = signupPassword?.value ?? "";
    const confirmPassword = signupConfirmPassword?.value ?? "";

    if (!fullName) {
      setSignupMessage("Please enter your full name.");
      return;
    }

    if (!isValidCorporateEmail(email)) {
      setSignupMessage("Please enter a valid work email address.");
      return;
    }

    if (password.length < 8) {
      setSignupMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setSignupMessage("Passwords do not match.");
      return;
    }

    try {
      await api.register(email, password, true);
      setSignupMessage("Account created successfully. Redirecting to portal…", true);
      window.setTimeout(() => {
        window.location.replace("portal-access.html");
      }, 500);
    } catch (error) {
      setSignupMessage(toFriendlyAuthError(error?.code));
    }
  });
}

function setupPortalSignOut(api) {
  if (!signOutBtn) {
    return;
  }

  signOutBtn.addEventListener("click", async () => {
    signOutBtn.disabled = true;
    const originalLabel = signOutBtn.textContent;
    signOutBtn.textContent = "Signing out...";

    try {
      await api.logout();
      window.location.replace("index.html");
    } catch (error) {
      signOutBtn.disabled = false;
      signOutBtn.textContent = originalLabel;
      console.error(error);
      window.alert("Unable to sign out right now. Please try again.");
    }
  });
}

(async () => {
  try {
    const api = await waitForFirebaseAuthApi();
  setupAuthTabs();
    await protectDashboardRoute(api);
    await setupLoginPage(api);
    setupSignupPage(api);
    setupPortalSignOut(api);
  } catch (error) {
    setMessage("Authentication is unavailable. Please refresh and try again.");
    console.error(error);
  }
})();
