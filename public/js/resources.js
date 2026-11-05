/* Resources tab: short readable guides that learners read and mark as read.
   Read state is saved on the learner's own profile (readResourceIds) and mirrored in the browser. */

export const RESOURCES = [
  {
    id: "spot-phishing",
    title: "How to spot a phishing message",
    category: "Cybersecurity",
    minutes: 4,
    summary: "The signs that a message is trying to trick you, and what to do next.",
    body: [
      "Phishing is a message designed to make you act before you think. It can arrive by email, text, phone call, chat or a social media message, and it usually pretends to be someone you trust: your bank, a coworker, a delivery company or IT support.",
      "Look at who it is really from. Check the full sender address, not just the display name. Look-alike domains swap or add letters, such as a hyphen or an extra word. Hover over a link (or press and hold on a phone) to see where it goes before you click.",
      "Notice the pressure. Urgent deadlines, threats of a locked account, surprise prizes and requests to keep something secret are all tricks to rush you. Real organizations give you time and a way to verify.",
      "Be careful with attachments and sign-in pages. Unexpected invoices, shared documents and \"verify your account\" pages are common ways to steal passwords or install malware."
    ],
    takeaways: [
      "Check the real sender address and where links lead.",
      "Urgency and secrecy are warning signs.",
      "When unsure, don't click. Contact the sender using a number or address you already know.",
      "Report the message using your organization's reporting method, then delete it."
    ]
  },
  {
    id: "passwords-mfa",
    title: "Passwords, passphrases and multi-factor authentication",
    category: "Cybersecurity",
    minutes: 4,
    summary: "How to protect your accounts even when a password leaks.",
    body: [
      "Most account break-ins start with a stolen or guessed password. Attackers reuse passwords leaked from one site to try others, so reusing a password turns one breach into many.",
      "Length beats complexity. A passphrase of four or more unrelated words is both stronger and easier to remember than a short password with symbols. Use a different one for every account, and let a password manager create and store them for you.",
      "Multi-factor authentication (MFA) adds a second proof, such as an app prompt or security key, so a stolen password alone is not enough. Turn it on for email, banking, work accounts and anything that holds personal data. App-based codes or security keys are stronger than text messages.",
      "Never share a one-time code with anyone. Support teams do not need it. If someone asks for it, that is an attack."
    ],
    takeaways: [
      "Use a unique passphrase for every account.",
      "Store them in a password manager.",
      "Turn on MFA wherever it is offered.",
      "Never read a verification code to anyone."
    ]
  },
  {
    id: "report-incident",
    title: "What to do if you think something went wrong",
    category: "Incident response",
    minutes: 3,
    summary: "Clicked a bad link or lost a device? Speed and honesty matter more than perfection.",
    body: [
      "Everyone makes mistakes. The damage from a mistake is usually decided by how quickly it is reported, so report early even if you are not sure.",
      "If you clicked a suspicious link or opened an attachment, disconnect from the network if you can, do not enter any information, and tell your IT contact straight away. If you already typed a password, change it from a different device and report that too.",
      "If a laptop, phone or badge is lost or stolen, report it immediately so access can be shut off. Do not wait to see if it turns up.",
      "Write down what happened while it is fresh: what you saw, what you clicked and when. Do not try to investigate or clean it up yourself."
    ],
    takeaways: [
      "Report quickly, even if you are unsure.",
      "Disconnect and stop. Do not try to fix it yourself.",
      "Change passwords from a different, clean device.",
      "Note the time and what you did."
    ]
  },
  {
    id: "social-engineering",
    title: "Social engineering: when the attacker is a person",
    category: "Cybersecurity",
    minutes: 4,
    summary: "How callers, visitors and chat messages talk their way past good technology.",
    body: [
      "Social engineering is manipulation that gets people to hand over access or information. The attacker might phone pretending to be IT, wear a high-visibility vest and walk in behind you, or message you on chat as a new coworker who needs help.",
      "They rely on a few levers: authority (\"I'm from IT\"), urgency (\"your account will be locked\"), helpfulness (\"can you hold the door?\") and familiarity (using names they found online).",
      "Slow the conversation down. Verify who someone is through a channel you trust, such as calling the help desk number from your directory. A real colleague will understand. Do not read out codes, passwords or personal details to an inbound caller.",
      "In the office, politely ask visitors to sign in and escort them, and do not let strangers follow you through badge doors."
    ],
    takeaways: [
      "Verify identity on a channel you chose, not one they gave you.",
      "Pressure to skip steps is a red flag.",
      "Never share codes or passwords with an inbound caller.",
      "It is fine to say \"let me call you back\"."
    ]
  },
  {
    id: "safe-networks",
    title: "Working safely on public Wi-Fi and while travelling",
    category: "Everyday safety",
    minutes: 3,
    summary: "Simple habits that keep your data private away from the office.",
    body: [
      "Public Wi-Fi in cafes, hotels and airports is shared with strangers, and attackers can set up fake networks with convincing names. Treat any network you do not control as untrusted.",
      "Use your phone's hotspot when you can. If you must use public Wi-Fi, connect through your organization's VPN, make sure sites use HTTPS, and avoid signing in to sensitive accounts until you are on a trusted connection.",
      "Keep your screen private, lock your device whenever you step away and never leave it unattended in a vehicle or at a table. Keep software and apps updated before you travel."
    ],
    takeaways: [
      "Prefer your phone hotspot over public Wi-Fi.",
      "Use the company VPN on untrusted networks.",
      "Lock your screen and keep devices with you.",
      "Install updates before you travel."
    ]
  },
  {
    id: "data-handling",
    title: "Handling sensitive data and sharing files safely",
    category: "Data protection",
    minutes: 4,
    summary: "Know what counts as sensitive and share it only with the right people.",
    body: [
      "Sensitive data includes customer or patient details, payment information, employee records, passwords and anything your organization is required to protect. When in doubt, treat information as sensitive.",
      "Share only what is needed with the people who need it. Use approved tools for sharing and set links to specific people rather than \"anyone with the link\". Double-check the recipient before you press send, especially with autocomplete.",
      "Do not store sensitive files on personal devices or personal cloud accounts. Do not email passwords. Shred or securely delete what you no longer need according to your retention rules."
    ],
    takeaways: [
      "Share the minimum with only the people who need it.",
      "Use approved tools and named recipients, not open links.",
      "Keep work data off personal accounts and devices.",
      "Check the recipient before sending."
    ]
  },
  {
    id: "updates-devices",
    title: "Keeping your devices updated and secure",
    category: "Everyday safety",
    minutes: 3,
    summary: "Updates, locks and backups are the cheapest protection you have.",
    body: [
      "Updates fix security holes that attackers actively exploit. Install them promptly on your computer, phone and apps, and turn on automatic updates where you can.",
      "Lock your devices with a strong PIN or passphrase and enable automatic screen lock. Turn on device encryption so a lost laptop or phone does not expose your data.",
      "Back up important work to an approved location. A backup that is kept separate from your device is the best protection against ransomware and accidental loss."
    ],
    takeaways: [
      "Install updates quickly or enable automatic updates.",
      "Use a screen lock and device encryption.",
      "Back up important files to an approved location.",
      "Only install software from approved sources."
    ]
  },
  {
    id: "report-and-reach-out",
    title: "Who to contact and how to get help",
    category: "Getting help",
    minutes: 2,
    summary: "A quick reminder of where to take questions and security concerns.",
    body: [
      "If you are unsure about a message, a request or a link, ask before you act. Asking is never a bad idea and it helps protect everyone.",
      "For security questions or to report a concern, contact your organization's administrator or IT contact first. Your administrator can see your organization's training progress and can arrange support.",
      "GrapheneX Academy support is available through software@bioglytchstudios.tech for questions about the training platform, and your plan includes cybersecurity support from BioGlytch Studios."
    ],
    takeaways: [
      "Ask first when something feels off.",
      "Report concerns to your administrator or IT contact.",
      "Platform and plan questions: software@bioglytchstudios.tech."
    ]
  }
];

const DEMO_RESOURCE_LIMIT = 2;
const LOCAL_PREFIX = "graphenex.resourcesRead.";
let readIds = new Set();
let openId = "";

function uid() {
  return window.grapheneAuth?.getCurrentUser?.()?.uid || "";
}

function readLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}${uid()}`) || "[]");
    if (Array.isArray(stored)) stored.forEach((id) => readIds.add(String(id)));
  } catch {
    // Browser storage is only a backup.
  }
}

function writeLocal() {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${uid()}`, JSON.stringify([...readIds]));
  } catch {
    // Browser storage may be unavailable.
  }
}

function isLocked(index) {
  return window.grapheneAccessState === "demo" && index >= DEMO_RESOURCE_LIMIT;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  const root = document.getElementById("resourcesRoot");
  if (!root) return;
  const readCount = RESOURCES.filter((resource) => readIds.has(resource.id)).length;
  const percent = Math.round((readCount / RESOURCES.length) * 100);

  const header = element("div", "resources-header");
  const heading = element("div");
  heading.append(element("div", "mono-label", "Resources"), element("h2", "", "Read and mark as read"));
  const progress = element("div", "resources-progress");
  progress.append(element("span", "mono-label", `${readCount} of ${RESOURCES.length} read`));
  const track = element("div", "resources-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", "Resources read");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(percent));
  const fill = element("span");
  fill.style.width = `${percent}%`;
  track.append(fill);
  progress.append(track);
  header.append(heading, progress);

  const list = element("div", "resources-list");
  RESOURCES.forEach((resource, index) => {
    const card = element("article", "resource-card");
    const read = readIds.has(resource.id);
    const locked = isLocked(index);
    if (read) card.classList.add("is-read");
    if (locked) card.classList.add("is-locked");

    const top = element("button", "resource-toggle");
    top.type = "button";
    top.setAttribute("aria-expanded", String(openId === resource.id && !locked));
    const titleBlock = element("span", "resource-title-block");
    titleBlock.append(
      element("span", "mono-label", `${resource.category} · ${resource.minutes} min read`),
      element("strong", "", resource.title),
      element("span", "resource-summary", resource.summary)
    );
    const status = element("span", "resource-status", locked ? "Locked" : read ? "Read ✓" : "Unread");
    top.append(titleBlock, status);
    top.addEventListener("click", () => {
      if (locked) {
        window.grapheneUpgrade?.();
        return;
      }
      openId = openId === resource.id ? "" : resource.id;
      render();
    });
    card.append(top);

    if (openId === resource.id && !locked) {
      const body = element("div", "resource-body");
      resource.body.forEach((paragraph) => body.append(element("p", "", paragraph)));
      const keys = element("div", "resource-takeaways");
      keys.append(element("strong", "", "Key takeaways"));
      const items = element("ul");
      resource.takeaways.forEach((item) => items.append(element("li", "", item)));
      keys.append(items);
      body.append(keys);

      const message = element("p", "resource-message");
      message.setAttribute("role", "status");
      const button = element("button", read ? "outline-btn" : "primary-btn", read ? "Marked as read" : "Mark as read");
      button.type = "button";
      button.disabled = read;
      button.addEventListener("click", async () => {
        button.disabled = true;
        readIds.add(resource.id);
        writeLocal();
        try {
          await window.grapheneAuth.recordResourceRead(resource.id);
        } catch (error) {
          console.error("Unable to save reading progress:", error);
        }
        document.dispatchEvent(new CustomEvent("resources-updated"));
        render();
      });
      body.append(button, message);
      card.append(body);
    }
    list.append(card);
  });

  root.replaceChildren(header, list);
}

function setupTabs() {
  const tabs = document.querySelectorAll("[data-portal-tab]");
  if (!tabs.length) return;
  const panels = {
    courses: document.querySelector(".catalog-panel"),
    drills: document.querySelector(".mini-games-section"),
    resources: document.getElementById("resourcesSection")
  };
  const show = (name) => {
    const target = panels[name] ? name : "courses";
    Object.entries(panels).forEach(([key, panel]) => {
      if (panel) panel.hidden = key !== target;
    });
    tabs.forEach((tab) => {
      const active = tab.dataset.portalTab === target;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    if (window.location.hash.slice(1) !== target) {
      window.history.replaceState(null, "", target === "courses" ? window.location.pathname + window.location.search : `#${target}`);
    }
  };
  tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.portalTab)));
  show(window.location.hash.slice(1) || "courses");
}

window.graphenexResources = RESOURCES;
setupTabs();
render();
document.addEventListener("access-ready", render);

window.grapheneAuth?.observeAuthState?.(async (user) => {
  readIds = new Set();
  if (!user) {
    render();
    return;
  }
  readLocal();
  try {
    const profile = await window.grapheneAuth.getUserProfileForAuthUser(user);
    (Array.isArray(profile?.readResourceIds) ? profile.readResourceIds : []).forEach((id) => readIds.add(String(id)));
  } catch (error) {
    console.error("Unable to load reading progress:", error);
  }
  writeLocal();
  render();
});
