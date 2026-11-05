/* Demo countdown and paywall. Firestore rules do the real enforcement; this is the visible side. */
let currentAccess = null;
let plansPromise = null;

async function callAccess(body = {}) {
  const token = await window.grapheneAuth.getCurrentUser().getIdToken();
  const response = await fetch("/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to check your access.");
  return data;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatPrice(plan) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: plan.amount % 100 ? 2 : 0
  }).format(plan.amount / 100);
}

function loadPlans() {
  plansPromise ??= fetch("/api/plans")
    .then((response) => (response.ok ? response.json() : { plans: [] }))
    .then((data) => data.plans || [])
    .catch(() => []);
  return plansPromise;
}

async function startCheckout(plan, orgName, message, button) {
  message.textContent = "";
  button.disabled = true;
  try {
    const token = await window.grapheneAuth.getCurrentUser().getIdToken();
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: plan.key, orgName })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || "Unable to start checkout.");
    window.location.assign(data.url);
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
}

async function openBilling(button) {
  button.disabled = true;
  try {
    const token = await window.grapheneAuth.getCurrentUser().getIdToken();
    const response = await fetch("/api/billing-portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || "Unable to open billing.");
    window.location.assign(data.url);
  } catch (error) {
    button.textContent = error.message;
  }
}

function planCard(plan, message) {
  const card = element("article", "access-plan");
  const suffix = plan.interval ? `/${plan.interval}` : "";
  card.append(element("h3", "", plan.label), element("strong", "access-plan-price", `${formatPrice(plan)}${suffix}`));
  const term = plan.interval === "month"
    ? "Billed monthly. Cancel anytime"
    : plan.interval === "year"
      ? "Billed yearly"
      : "One payment for 12 months of access";
  card.append(element("p", "", plan.seats ? `${term}. Up to ${plan.seats} people` : term));
  card.append(element("p", "", plan.kind === "organization"
    ? "Includes cybersecurity support and 1 free training every quarter: in person in Michigan. Elsewhere in the US: live virtual, or in person planned 3 months in advance with a $1,500 travel fee per trip (Alaska and Hawaii quoted separately)"
    : "Includes cybersecurity support and 1 live virtual session every quarter"));

  let orgInput = null;
  const canRenewOrg = Boolean(currentAccess?.organization?.joinCode);
  if (plan.kind === "organization" && !canRenewOrg) {
    orgInput = element("input", "access-input");
    orgInput.type = "text";
    orgInput.maxLength = 80;
    orgInput.placeholder = "Organization name";
    orgInput.setAttribute("aria-label", `Organization name for ${plan.label}`);
    card.append(orgInput);
  }

  card.append(element("p", "", "Sales tax added at checkout where it applies"));

  const button = element("button", "primary-btn", "Buy now");
  button.type = "button";
  button.addEventListener("click", () => startCheckout(plan, orgInput?.value, message, button));
  card.append(button);
  return card;
}

async function plansSection(message) {
  const plans = await loadPlans();
  if (!plans.length) {
    const fallback = element("p", "access-copy", "To buy access, email ");
    const link = element("a", "", "software@bioglytchstudios.tech");
    link.href = "mailto:software@bioglytchstudios.tech?subject=GrapheneX%20Academy%20access";
    fallback.append(link, ".");
    return fallback;
  }
  const grid = element("div", "access-plans");
  grid.append(...plans.map((plan) => planCard(plan, message)));
  return grid;
}

function joinForm() {
  const form = element("form", "access-join");
  const label = element("label", "", "Have an organization code?");
  label.htmlFor = "accessJoinCode";
  const row = element("div", "access-join-row");
  const input = element("input", "access-input");
  input.id = "accessJoinCode";
  input.autocomplete = "off";
  input.placeholder = "Enter code";
  const button = element("button", "outline-btn", "Join");
  button.type = "submit";
  const message = element("p", "access-message");
  message.setAttribute("role", "status");
  row.append(input, button);
  form.append(label, row, message);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    message.textContent = "";
    try {
      await callAccess({ joinCode: input.value });
      window.location.reload();
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
  return form;
}

export async function showUpgradeDialog() {
  let dialog = document.getElementById("accessUpgradeDialog");
  if (!dialog) {
    dialog = element("dialog", "access-dialog");
    dialog.id = "accessUpgradeDialog";
    document.body.append(dialog);
  }
  const close = element("button", "outline-btn access-close", "Close");
  close.type = "button";
  close.addEventListener("click", () => dialog.close());
  const message = element("p", "access-message");
  message.setAttribute("role", "alert");
  dialog.replaceChildren(close, element("h2", "", "Get full access"), element("p", "access-copy", "Loading plans…"));
  dialog.showModal();
  const plans = await plansSection(message);
  dialog.replaceChildren(close, element("h2", "", "Get full access"), plans, message, joinForm());
}

function showDemoBanner(access) {
  const banner = element("div", "access-banner");
  banner.setAttribute("role", "status");
  const days = access.daysLeft === 1 ? "1 day" : `${access.daysLeft} days`;
  banner.append(element("span", "", `Free demo: ${days} left`));
  const button = element("button", "primary-btn", "Get full access");
  button.type = "button";
  button.addEventListener("click", showUpgradeDialog);
  banner.append(button);
  document.querySelector("main")?.prepend(banner);
}

async function showPaywall(access) {
  document.body.classList.add("access-locked");
  const wall = element("section", "access-paywall container-shell");
  wall.setAttribute("aria-labelledby", "accessPaywallTitle");
  const title = element(
    "h1",
    "",
    access.organization ? "Your organization's license has ended" : "Your free demo has ended"
  );
  title.id = "accessPaywallTitle";
  const message = element("p", "access-message");
  message.setAttribute("role", "alert");
  wall.append(
    title,
    element("p", "access-copy", "Choose a plan to unlock all of the courses, quizzes and drills. Your progress is saved."),
    element("p", "access-copy", "Loading plans…"),
    message
  );
  document.querySelector("main")?.before(wall);
  wall.children[2].replaceWith(await plansSection(message));
  wall.append(joinForm());
}

async function waitForPayment() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const access = await callAccess();
    if (access.state === "paid") return access;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return callAccess();
}

export function showAdminOrganization() {
  const details = document.getElementById("masterOrgDetails");
  const organization = currentAccess?.organization;
  if (!details || !organization?.joinCode) return;
  const seats = organization.seatLimit
    ? `${organization.seatCount} of ${organization.seatLimit} seats used`
    : `${organization.seatCount} seats used`;
  const expires = new Date(organization.joinCodeExpiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  details.textContent = `${organization.name}: ${seats}. New staff join with code ${organization.joinCode}, valid through ${expires}. A new code appears here after that.`;
  details.hidden = false;
}

export async function ensureAccess() {
  if (currentAccess) return currentAccess;
  try {
    const params = new URLSearchParams(window.location.search);
    currentAccess = params.get("checkout") === "success" ? await waitForPayment() : await callAccess();
    if (params.has("checkout")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  } catch (error) {
    console.error("Unable to check access:", error);
    return null;
  }

  window.grapheneAccessState = currentAccess.state;
  window.grapheneUpgrade = showUpgradeDialog;
  document.dispatchEvent(new CustomEvent("access-ready", { detail: currentAccess }));

  if (currentAccess.state === "demo") showDemoBanner(currentAccess);
  if (currentAccess.state === "paid" && currentAccess.canManageBilling) {
    const banner = element("div", "access-banner");
    const button = element("button", "outline-btn", "Manage billing");
    button.type = "button";
    button.addEventListener("click", () => openBilling(button));
    banner.append(button);
    document.querySelector("main")?.prepend(banner);
  }
  if (currentAccess.state === "expired") await showPaywall(currentAccess);
  return currentAccess;
}
