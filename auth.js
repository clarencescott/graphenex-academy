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
const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const profileEmail = document.getElementById("profileEmail");
const profileDepartment = document.getElementById("profileDepartment");
const profileAccessLevel = document.getElementById("profileAccessLevel");
const accountSettingsForm = document.getElementById("accountSettingsForm");
const settingsUserName = document.getElementById("settingsUserName");
const settingsEmail = document.getElementById("settingsEmail");
const settingsRole = document.getElementById("settingsRole");
const settingsDepartment = document.getElementById("settingsDepartment");
const settingsAccessLevel = document.getElementById("settingsAccessLevel");
const settingsCurrentPassword = document.getElementById("settingsCurrentPassword");
const settingsNewPassword = document.getElementById("settingsNewPassword");
const settingsConfirmPassword = document.getElementById("settingsConfirmPassword");
const settingsMessage = document.getElementById("settingsMessage");

let activePortalUser = null;
let activePortalProfile = null;

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

function setSettingsMessage(text, success = false) {
  if (!settingsMessage) return;
  settingsMessage.textContent = text;
  settingsMessage.classList.toggle("success", success);
}

function isValidCorporateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toFriendlyAuthError(errorCode) {
  switch (errorCode) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid work email address.";
    case "auth/user-disabled":
      return "Your account has been disabled. Contact an administrator.";
    case "auth/network-request-failed":
      return "Network issue while connecting to Firebase. Check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in your Firebase Authentication settings.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication. Add it in your Firebase console authorized domains.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid. Verify your project configuration in firebase.js.";
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

function toFriendlySettingsError(error) {
  const code = error?.code || "";

  if (code === "permission-denied") {
    return "Update blocked by Firestore rules (permission denied).";
  }

  if (code === "auth/requires-recent-login") {
    return "For security, please sign in again before changing email or password.";
  }

  if (code === "auth/wrong-password") {
    return "Current password is incorrect.";
  }

  return toFriendlyAuthError(code);
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

function setupAuthModal() {
  const openAuthBtn = document.getElementById("openAuthBtn");
  const authModal = document.getElementById("authModal");
  const closeButtons = document.querySelectorAll("[data-close-modal]");
  const navAuthButtons = document.querySelectorAll("[data-auth-mode]");

  if (!authModal) {
    return;
  }

  const toggleModal = (visible) => {
    authModal.classList.toggle("hidden-panel", !visible);
    authModal.setAttribute("aria-hidden", String(!visible));
    if (visible) {
      document.body.style.overflow = "hidden";
      const firstField = document.querySelector("#email");
      firstField?.focus();
    } else {
      document.body.style.overflow = "";
    }
  };

  const openModalForMode = (mode) => {
    setActiveAuthTab(mode);
    toggleModal(true);
  };

  if (openAuthBtn) {
    openAuthBtn.addEventListener("click", () => openModalForMode("login"));
  }

  navAuthButtons.forEach((button) => {
    const mode = button.dataset.authMode === "signup" ? "signup" : "login";
    button.addEventListener("click", () => openModalForMode(mode));
  });

  closeButtons.forEach((button) => button.addEventListener("click", () => toggleModal(false)));
  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      toggleModal(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !authModal.classList.contains("hidden-panel")) {
      toggleModal(false);
    }
  });
}

function applyPortalProfile(user, profileData) {
  if (!profileName && !profileRole && !profileEmail && !profileDepartment && !profileAccessLevel) {
    return;
  }

  const fullName =
    profileData?.userName ||
    profileData?.name ||
    profileData?.fullName ||
    profileData?.displayName ||
    user?.displayName ||
    "Learner";
  const role = profileData?.role || profileData?.title || "Team Member";
  const email = profileData?.email || profileData?.userEmail || user?.email || "-";
  const department = profileData?.department || "Not specified";
  const accessLevel = profileData?.accessLevel || profileData?.level || "Standard Learner";

  if (profileName) profileName.textContent = fullName;
  if (profileRole) profileRole.textContent = role;
  if (profileEmail) profileEmail.textContent = email;
  if (profileDepartment) profileDepartment.textContent = department;
  if (profileAccessLevel) profileAccessLevel.textContent = accessLevel;

  if (settingsUserName) settingsUserName.value = fullName;
  if (settingsEmail) settingsEmail.value = email !== "-" ? email : "";
  if (settingsRole) settingsRole.value = role !== "Team Member" ? role : "";
  if (settingsDepartment) settingsDepartment.value = department !== "Not specified" ? department : "";
  if (settingsAccessLevel) settingsAccessLevel.value = accessLevel !== "Standard Learner" ? accessLevel : "";
}

async function loadPortalProfile(api, user) {
  try {
    const profileData = await api.getUserProfileForAuthUser(user);
    activePortalUser = user;
    activePortalProfile = profileData;
    applyPortalProfile(user, profileData);
  } catch (error) {
    console.error("Unable to fetch profile by UID:", error);
    activePortalUser = user;
    activePortalProfile = null;
    applyPortalProfile(user, null);
  }
}

async function protectDashboardRoute(api) {
  if (!window.location.pathname.toLowerCase().includes("portal-access.html")) {
    return;
  }

  api.observeAuthState(async (user) => {
    if (!user) {
      window.location.replace("index.html");
      return;
    }

    await loadPortalProfile(api, user);
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
      const userCredential = await api.register(email, password, true);
      await api.upsertUserProfile(userCredential.user.uid, {
        email,
        name: fullName,
        userName: fullName,
        role: "Learner",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      setSignupMessage("Account created successfully. Redirecting to portal…", true);
      window.setTimeout(() => {
        window.location.replace("portal-access.html");
      }, 500);
    } catch (error) {
      setSignupMessage(toFriendlyAuthError(error?.code));
    }
  });
}

function setupPortalSettings(api) {
  if (!accountSettingsForm) {
    return;
  }

  accountSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activePortalUser) {
      setSettingsMessage("No authenticated user found.");
      return;
    }

    const requestedUserName = settingsUserName?.value.trim() ?? "";
    const requestedEmailRaw = settingsEmail?.value.trim() ?? "";
    const requestedRole = settingsRole?.value.trim() ?? "";
    const requestedDepartment = settingsDepartment?.value.trim() ?? "";
    const requestedAccessLevel = settingsAccessLevel?.value.trim() ?? "";
    const requestedEmail = requestedEmailRaw.toLowerCase();
    const currentPassword = settingsCurrentPassword?.value ?? "";
    const newPassword = settingsNewPassword?.value ?? "";
    const confirmPassword = settingsConfirmPassword?.value ?? "";

    if (!requestedUserName) {
      setSettingsMessage("Username cannot be blank.");
      return;
    }

    if (!isValidCorporateEmail(requestedEmail)) {
      setSettingsMessage("Please enter a valid email address.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setSettingsMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsMessage("New password and confirmation do not match.");
      return;
    }

    const currentEmail = (activePortalUser.email || "").toLowerCase();
    const emailChanged = requestedEmail !== currentEmail;
    const passwordChanged = Boolean(newPassword);

    if ((emailChanged || passwordChanged) && !currentPassword) {
      setSettingsMessage("Current password is required to change email or password.");
      return;
    }

    try {
      if (emailChanged) {
        await api.updateCurrentUserEmail(requestedEmail, currentPassword);
      }

      if (passwordChanged) {
        await api.updateCurrentUserPassword(newPassword, currentPassword);
      }

      await api.upsertUserProfile(activePortalUser.uid, {
        email: requestedEmail,
        userName: requestedUserName,
        name: activePortalProfile?.name || requestedUserName,
        role: requestedRole || activePortalProfile?.role || "Learner",
        department: requestedDepartment || activePortalProfile?.department || "Not specified",
        accessLevel: requestedAccessLevel || activePortalProfile?.accessLevel || "Standard Learner",
        lastLogin: new Date().toISOString()
      });

      const refreshedUser = api.getCurrentUser() || activePortalUser;
      activePortalUser = refreshedUser;
      activePortalProfile = {
        ...(activePortalProfile || {}),
        email: requestedEmail,
        userName: requestedUserName,
        name: activePortalProfile?.name || requestedUserName,
        role: requestedRole || activePortalProfile?.role || "Learner",
        department: requestedDepartment || activePortalProfile?.department || "Not specified",
        accessLevel: requestedAccessLevel || activePortalProfile?.accessLevel || "Standard Learner"
      };

      applyPortalProfile(activePortalUser, activePortalProfile);
      if (settingsCurrentPassword) settingsCurrentPassword.value = "";
      if (settingsNewPassword) settingsNewPassword.value = "";
      if (settingsConfirmPassword) settingsConfirmPassword.value = "";

      setSettingsMessage("Settings updated successfully.", true);
    } catch (error) {
      console.error(error);
      setSettingsMessage(toFriendlySettingsError(error));
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
    setupAuthModal();
    await protectDashboardRoute(api);
    await setupLoginPage(api);
    setupSignupPage(api);
    setupPortalSettings(api);
    setupPortalSignOut(api);
  } catch (error) {
    setMessage("Authentication is unavailable. Please refresh and try again.");
    console.error(error);
  }
})();
