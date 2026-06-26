const baseModules = [
  {
    id: "it-helpdesk-foundations",
    category: "it",
    title: "IT Helpdesk Foundations",
    description: "Master ticket workflows, device setup, and first-contact troubleshooting for common incidents.",
    duration: "40 mins",
    difficulty: "Beginner",
    tools: ["Service Desk", "Active Directory", "Remote Assist"],
    lessons: [
      "Prioritize and classify incident tickets accurately",
      "Perform structured root-cause triage for user issues",
      "Use remote support safely with proper user consent"
    ],
    quiz: {
      question: "What should you confirm before closing a support ticket?",
      options: [
        "The device rebooted successfully",
        "The user confirms the issue is resolved",
        "The ticket has been open for 24 hours",
        "A manager has viewed the ticket"
      ],
      answerIndex: 1
    }
  },
  {
    id: "it-network-essentials",
    category: "it",
    title: "Network Essentials for Staff",
    description: "Understand core network concepts to diagnose connectivity and performance issues quickly.",
    duration: "35 mins",
    difficulty: "Intermediate",
    tools: ["VPN Client", "DNS Utilities", "Endpoint Monitor"],
    lessons: [
      "Differentiate DNS, DHCP, and gateway-related failures",
      "Validate VPN access paths and split-tunneling behavior",
      "Apply a standard checklist for latency and packet loss"
    ],
    quiz: {
      question: "If a website fails by name but works by IP, what's most likely affected?",
      options: ["Firewall rule", "DNS resolution", "CPU throttling", "Display driver"],
      answerIndex: 1
    }
  },
  {
    id: "cyber-phishing-defense",
    category: "cybersecurity",
    title: "Phishing Defense Lab",
    description: "Practice spotting phishing signs in email, chat, and collaboration tools.",
    duration: "30 mins",
    difficulty: "Beginner",
    tools: ["Secure Mail", "Threat Reporter", "MFA"],
    lessons: [
      "Identify suspicious sender patterns and URL mismatches",
      "Use safe preview techniques before clicking links",
      "Report incidents with complete evidence and context"
    ],
    quiz: {
      question: "Which action is best when you suspect a phishing email?",
      options: [
        "Forward it to all teammates as a warning",
        "Reply asking if the request is valid",
        "Use the reporting tool and avoid interacting",
        "Delete it immediately without reporting"
      ],
      answerIndex: 2
    }
  },
  {
    id: "cyber-endpoint-hygiene",
    category: "cybersecurity",
    title: "Endpoint Security Hygiene",
    description: "Keep company devices resilient with patching, least privilege, and secure usage practices.",
    duration: "45 mins",
    difficulty: "Intermediate",
    tools: ["EDR Console", "Patch Manager", "Privilege Portal"],
    lessons: [
      "Recognize endpoint compromise indicators early",
      "Apply update cycles with minimal operational disruption",
      "Use role-based access and avoid privileged overreach"
    ],
    quiz: {
      question: "What is the principle of least privilege?",
      options: [
        "Give users broad access to speed workflows",
        "Grant only access needed to perform assigned tasks",
        "Allow temporary admin rights for all users",
        "Block all external software including approved apps"
      ],
      answerIndex: 1
    }
  },
  {
    id: "office365-teams-sharepoint",
    category: "office365",
    title: "Office365 Collaboration Flow",
    description: "Coordinate work with Teams, SharePoint, and OneDrive while maintaining data governance.",
    duration: "38 mins",
    difficulty: "Beginner",
    tools: ["Microsoft Teams", "SharePoint", "OneDrive"],
    lessons: [
      "Choose the right workspace for files and conversations",
      "Manage version history and file permissions safely",
      "Set collaboration norms for channels and meeting artifacts"
    ],
    quiz: {
      question: "Where should team-owned documents usually live?",
      options: ["Personal Downloads folder", "SharePoint team site", "Desktop shortcuts", "Email drafts"],
      answerIndex: 1
    }
  },
  {
    id: "office365-excel-insights",
    category: "office365",
    title: "Excel Insights for Operations",
    description: "Use formulas, pivots, and data validation to improve reporting accuracy and speed.",
    duration: "42 mins",
    difficulty: "Intermediate",
    tools: ["Excel", "Power Query", "Power Pivot"],
    lessons: [
      "Build reliable calculations with clear naming and structure",
      "Summarize large datasets with pivot tables and filters",
      "Create repeatable import pipelines with Power Query"
    ],
    quiz: {
      question: "Which feature helps automate repeat data imports in Excel?",
      options: ["Mail Merge", "Power Query", "Track Changes", "Format Painter"],
      answerIndex: 1
    }
  },
  {
    id: "company-tools-erp-basics",
    category: "company-tools",
    title: "Company ERP Workflow Basics",
    description: "Learn core internal ERP flows for request approvals, status tracking, and process visibility.",
    duration: "50 mins",
    difficulty: "Advanced",
    tools: ["Internal ERP", "Approval Matrix", "Workflow Dashboard"],
    lessons: [
      "Navigate process stages without bypassing controls",
      "Use approval routes correctly to avoid process delays",
      "Track exceptions and document actions for compliance"
    ],
    quiz: {
      question: "What improves traceability in ERP actions?",
      options: [
        "Skipping comments for speed",
        "Documenting action reason and context",
        "Using shared credentials",
        "Moving requests outside workflow"
      ],
      answerIndex: 1
    }
  },
  {
    id: "company-tools-analytics-dashboard",
    category: "company-tools",
    title: "Internal Analytics Dashboard",
    description: "Turn internal data into decisions with KPI interpretation and dashboard storytelling.",
    duration: "33 mins",
    difficulty: "Intermediate",
    tools: ["Company BI", "KPI Catalog", "Reporting Portal"],
    lessons: [
      "Interpret KPI trends using context and threshold awareness",
      "Avoid false conclusions from incomplete data slices",
      "Communicate insights with concise operational summaries"
    ],
    quiz: {
      question: "What's a good first step before sharing a KPI trend insight?",
      options: [
        "Confirm data freshness and source scope",
        "Format charts in bright colors",
        "Export to PDF immediately",
        "Hide outliers by default"
      ],
      answerIndex: 0
    }
  }
];

function buildAdditionalModules(targetTotal, existingModules) {
  const needed = Math.max(targetTotal - existingModules.length, 0);
  if (!needed) {
    return [];
  }

  const categoryConfigs = {
    it: {
      titles: [
        "Identity and Access Operations",
        "Device Enrollment and Baselines",
        "Endpoint Backup and Recovery",
        "Printer and Peripheral Support",
        "Patch Scheduling Essentials",
        "Remote Workforce IT Support",
        "IT Knowledge Base Writing",
        "SLA Management for Service Desk",
        "Secure Wi-Fi Onboarding",
        "Hardware Inventory Auditing",
        "Windows Performance Tuning",
        "Software Deployment Basics"
      ],
      tools: ["Intune", "ServiceNow", "Active Directory", "Endpoint Manager", "Remote Assist"],
      question: "Which action best improves first-contact IT resolution rates?",
      options: [
        "Escalate all tickets immediately",
        "Use a consistent triage checklist and knowledge articles",
        "Close tickets after one response",
        "Limit documentation to high-severity incidents"
      ],
      answerIndex: 1
    },
    cybersecurity: {
      titles: [
        "Secure Password and Passkey Practices",
        "SOC Alert Triage Fundamentals",
        "Data Loss Prevention Essentials",
        "Insider Threat Awareness",
        "Incident Response Playbook Basics",
        "Cloud Security Configuration Review",
        "Zero Trust Access Principles",
        "Secure Browsing and Download Hygiene",
        "Ransomware Containment Readiness",
        "Third-Party Risk Screening",
        "Log Analysis for Threat Hunting",
        "Mobile Device Security Controls"
      ],
      tools: ["SIEM", "DLP Console", "MFA", "EDR", "Secure Gateway"],
      question: "What is the best first response to a suspected account compromise?",
      options: [
        "Ignore until a second alert appears",
        "Reset credentials, revoke sessions, and document actions",
        "Publish usernames to warn everyone",
        "Disable all business applications indefinitely"
      ],
      answerIndex: 1
    },
    office365: {
      titles: [
        "Outlook Productivity and Rules",
        "Teams Meeting Governance",
        "SharePoint Site Permission Management",
        "OneNote Knowledge Capture",
        "PowerPoint for Executive Briefings",
        "Word Templates and Document Controls",
        "Forms and Approvals Automation",
        "Planner and To Do Coordination",
        "OneDrive Sharing Safety",
        "Excel Dashboards for Supervisors",
        "Power Automate Workflow Starter",
        "Co-authoring and Version Control"
      ],
      tools: ["Outlook", "Teams", "SharePoint", "Excel", "Power Automate"],
      question: "Which practice is safest for sharing Office365 documents externally?",
      options: [
        "Use anonymous links with edit access",
        "Use least-privilege permissions with expiration controls",
        "Attach files directly in every email thread",
        "Keep one global link for all partners"
      ],
      answerIndex: 1
    },
    "company-tools": {
      titles: [
        "Internal CRM Process Flow",
        "Procurement Portal Navigation",
        "HR System Data Accuracy",
        "Compliance Workflow Tracking",
        "Manufacturing Dashboard Interpretation",
        "Quality Incident Logging",
        "Internal Ticket Escalation Standards",
        "Approval Matrix Deep Dive",
        "Operational KPI Scorecards",
        "Digital Forms and Audit Trails",
        "Policy Acknowledgment Workflow",
        "Project Intake Tool Fundamentals"
      ],
      tools: ["Internal ERP", "Company BI", "Workflow Portal", "Approval Matrix", "Compliance Hub"],
      question: "What most improves reliability of company-tool reporting?",
      options: [
        "Skipping validation to save time",
        "Consistent data entry standards and timestamped updates",
        "Manual edits without change notes",
        "Using shared admin credentials"
      ],
      answerIndex: 1
    }
  };

  const categoryOrder = ["it", "cybersecurity", "office365", "company-tools"];
  const difficulties = ["Beginner", "Intermediate", "Advanced"];
  const durations = ["28 mins", "32 mins", "36 mins", "40 mins", "44 mins", "48 mins"];

  const usedIds = new Set(existingModules.map((module) => module.id));
  const additional = [];

  for (let i = 0; i < needed; i += 1) {
    const category = categoryOrder[i % categoryOrder.length];
    const config = categoryConfigs[category];
    const title = config.titles[Math.floor(i / categoryOrder.length) % config.titles.length];
    const toolA = config.tools[i % config.tools.length];
    const toolB = config.tools[(i + 1) % config.tools.length];
    const toolC = config.tools[(i + 2) % config.tools.length];

    let id = `${category}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    let dedupe = 2;
    while (usedIds.has(id)) {
      id = `${id}-${dedupe}`;
      dedupe += 1;
    }
    usedIds.add(id);

    additional.push({
      id,
      category,
      title,
      description: `Build practical confidence in ${title.toLowerCase()} and apply it to day-to-day operations.`,
      duration: durations[i % durations.length],
      difficulty: difficulties[i % difficulties.length],
      tools: [toolA, toolB, toolC],
      lessons: [
        `Understand the core workflow for ${title.toLowerCase()}`,
        `Identify common failure points and preventive controls`,
        `Apply a repeatable checklist for consistent execution`
      ],
      quiz: {
        question: config.question,
        options: config.options,
        answerIndex: config.answerIndex
      }
    });
  }

  return additional;
}

const modules = [...baseModules, ...buildAdditionalModules(50, baseModules)];

const STORAGE_KEY = "cyberbyte-learning-progress";

const state = {
  selectedFilter: "all",
  searchText: "",
  selectedModuleId: null,
  completedIds: new Set(loadProgress())
};

const el = {
  profileSidebar: document.getElementById("profileSidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarClose: document.getElementById("sidebarClose"),
  sidebarNavLinks: Array.from(document.querySelectorAll("[data-sidebar-nav]")),
  moduleGrid: document.getElementById("moduleGrid"),
  resultCount: document.getElementById("resultCount"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: Array.from(document.querySelectorAll(".chip")),
  modal: document.getElementById("moduleModal"),
  closeModal: document.getElementById("closeModal"),
  modalCategory: document.getElementById("modalCategory"),
  modalTitle: document.getElementById("modalTitle"),
  modalDescription: document.getElementById("modalDescription"),
  modalDuration: document.getElementById("modalDuration"),
  modalDifficulty: document.getElementById("modalDifficulty"),
  modalToolset: document.getElementById("modalToolset"),
  lessonList: document.getElementById("lessonList"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizOptions: document.getElementById("quizOptions"),
  quizFeedback: document.getElementById("quizFeedback"),
  markCompleteBtn: document.getElementById("markCompleteBtn"),
  overallProgressBar: document.getElementById("overallProgressBar"),
  overallProgressText: document.getElementById("overallProgressText"),
  completedCount: document.getElementById("completedCount"),
  remainingCount: document.getElementById("remainingCount"),
  avgDifficulty: document.getElementById("avgDifficulty"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  year: document.getElementById("year"),
  recommendedText: document.getElementById("recommendedText"),
  openRecommendation: document.getElementById("openRecommendation"),
  jumpToRecommendations: document.getElementById("jumpToRecommendations")
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id) => modules.some((module) => module.id === id));
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.completedIds)));
}

function getFilteredModules() {
  const search = state.searchText.trim().toLowerCase();

  return modules.filter((module) => {
    const byCategory = state.selectedFilter === "all" || module.category === state.selectedFilter;

    if (!byCategory) {
      return false;
    }

    if (!search) {
      return true;
    }

    const searchable = [
      module.title,
      module.description,
      ...module.lessons,
      ...module.tools,
      module.category
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(search);
  });
}

function renderModules() {
  const filtered = getFilteredModules();
  el.resultCount.textContent = `${filtered.length} module${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    el.moduleGrid.innerHTML = `<div class="empty-state">No modules match your current filter or search. Try broadening your criteria.</div>`;
    return;
  }

  el.moduleGrid.innerHTML = filtered
    .map((module) => {
      const isDone = state.completedIds.has(module.id);
      const categoryLabel = formatCategory(module.category);

      return `
        <article class="card module-card">
          <span class="tag">${escapeHtml(categoryLabel)}</span>
          <h4>${escapeHtml(module.title)}</h4>
          <p>${escapeHtml(module.description)}</p>
          <div class="module-meta">
            <span class="badge">${escapeHtml(module.duration)}</span>
            <span class="badge">${escapeHtml(module.difficulty)}</span>
            <span class="badge">${escapeHtml(module.tools[0])}</span>
          </div>
          <div class="module-actions">
            <div class="module-action-buttons">
              <button class="btn btn-primary" data-open-module="${module.id}" type="button">Open Module</button>
              <button class="btn" data-view-material="${module.id}" type="button">View Material</button>
            </div>
            <span class="done-state">${isDone ? "✓ Completed" : "In progress"}</span>
          </div>
        </article>
      `;
    })
    .join("");

  const openButtons = el.moduleGrid.querySelectorAll("[data-open-module]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => openModule(button.dataset.openModule));
  });

  const materialButtons = el.moduleGrid.querySelectorAll("[data-view-material]");
  materialButtons.forEach((button) => {
    button.addEventListener("click", () => openModule(button.dataset.viewMaterial));
  });
}

function updateStats() {
  const completed = state.completedIds.size;
  const total = modules.length;
  const remaining = Math.max(total - completed, 0);
  const percent = total ? Math.round((completed / total) * 100) : 0;

  el.overallProgressBar.style.width = `${percent}%`;
  el.overallProgressText.textContent = `${percent}% completed`;
  el.completedCount.textContent = String(completed);
  el.remainingCount.textContent = String(remaining);
  el.avgDifficulty.textContent = averageDifficulty(completed);
}

function averageDifficulty() {
  if (!state.completedIds.size) {
    return "-";
  }

  const map = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3
  };

  const values = modules
    .filter((module) => state.completedIds.has(module.id))
    .map((module) => map[module.difficulty] || 2);

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  if (average < 1.5) return "Beginner";
  if (average < 2.5) return "Intermediate";
  return "Advanced";
}

function formatCategory(category) {
  switch (category) {
    case "it":
      return "IT";
    case "cybersecurity":
      return "Cybersecurity";
    case "office365":
      return "Office365";
    case "company-tools":
      return "Company Tools";
    default:
      return category;
  }
}

function openModule(moduleId) {
  const module = modules.find((item) => item.id === moduleId);
  if (!module) {
    return;
  }

  state.selectedModuleId = module.id;
  el.modalCategory.textContent = formatCategory(module.category);
  el.modalTitle.textContent = module.title;
  el.modalDescription.textContent = module.description;
  el.modalDuration.textContent = `Duration: ${module.duration}`;
  el.modalDifficulty.textContent = `Difficulty: ${module.difficulty}`;
  el.modalToolset.textContent = `Tools: ${module.tools.join(", ")}`;

  el.lessonList.innerHTML = module.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("");
  renderQuiz(module);

  el.markCompleteBtn.textContent = state.completedIds.has(module.id) ? "Completed ✓" : "Mark as Completed";
  el.markCompleteBtn.disabled = state.completedIds.has(module.id);

  el.modal.classList.remove("hidden");
  el.modal.setAttribute("aria-hidden", "false");
}

function closeModuleModal() {
  el.modal.classList.add("hidden");
  el.modal.setAttribute("aria-hidden", "true");
  state.selectedModuleId = null;
  el.quizFeedback.textContent = "";
  el.quizFeedback.className = "quiz-feedback";
}

function renderQuiz(module) {
  el.quizQuestion.textContent = module.quiz.question;
  el.quizFeedback.textContent = "";
  el.quizFeedback.className = "quiz-feedback";

  el.quizOptions.innerHTML = module.quiz.options
    .map(
      (option, index) =>
        `<button class="btn quiz-option" data-answer-index="${index}" type="button">${escapeHtml(option)}</button>`
    )
    .join("");

  const answerButtons = el.quizOptions.querySelectorAll("[data-answer-index]");
  answerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const chosen = Number(button.dataset.answerIndex);
      const correct = chosen === module.quiz.answerIndex;

      if (correct) {
        el.quizFeedback.textContent = "Correct — great call. You’re building strong operational judgment.";
        el.quizFeedback.className = "quiz-feedback good";
      } else {
        const correctText = module.quiz.options[module.quiz.answerIndex];
        el.quizFeedback.textContent = `Not quite. Correct answer: ${correctText}`;
        el.quizFeedback.className = "quiz-feedback bad";
      }
    });
  });
}

function markSelectedModuleComplete() {
  if (!state.selectedModuleId) {
    return;
  }

  state.completedIds.add(state.selectedModuleId);
  saveProgress();
  updateStats();
  renderModules();
  renderRecommendation();

  el.markCompleteBtn.textContent = "Completed ✓";
  el.markCompleteBtn.disabled = true;
}

function resetProgress() {
  state.completedIds.clear();
  saveProgress();
  updateStats();
  renderModules();
  renderRecommendation();
}

function renderRecommendation() {
  const pending = modules.filter((module) => !state.completedIds.has(module.id));

  if (!pending.length) {
    el.recommendedText.textContent = "Amazing work — you completed every module. Review any module for reinforcement.";
    el.openRecommendation.disabled = true;
    el.openRecommendation.dataset.targetModule = "";
    return;
  }

  const categoryWeight = {
    cybersecurity: 4,
    "company-tools": 3,
    office365: 2,
    it: 1
  };

  pending.sort((a, b) => {
    const byCategory = (categoryWeight[b.category] || 0) - (categoryWeight[a.category] || 0);
    if (byCategory !== 0) {
      return byCategory;
    }

    const difficultyWeight = { Advanced: 3, Intermediate: 2, Beginner: 1 };
    return (difficultyWeight[b.difficulty] || 0) - (difficultyWeight[a.difficulty] || 0);
  });

  const next = pending[0];
  el.recommendedText.textContent = `${next.title} (${formatCategory(next.category)}) — ${next.duration}, ${next.difficulty}`;
  el.openRecommendation.disabled = false;
  el.openRecommendation.dataset.targetModule = next.id;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  if (el.sidebarToggle) {
    el.sidebarToggle.setAttribute("aria-expanded", "true");
  }
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  if (el.sidebarToggle) {
    el.sidebarToggle.setAttribute("aria-expanded", "false");
  }
}

function toggleSidebar() {
  const isOpen = document.body.classList.contains("sidebar-open");
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function wireEvents() {
  el.searchInput.addEventListener("input", (event) => {
    state.searchText = event.target.value;
    renderModules();
  });

  el.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedFilter = button.dataset.filter;
      el.filterButtons.forEach((chip) => chip.classList.remove("active"));
      button.classList.add("active");
      renderModules();
    });
  });

  el.closeModal.addEventListener("click", closeModuleModal);
  el.modal.addEventListener("click", (event) => {
    if (event.target === el.modal) {
      closeModuleModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.modal.classList.contains("hidden")) {
      closeModuleModal();
      return;
    }

    if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  if (el.sidebarToggle) {
    el.sidebarToggle.addEventListener("click", toggleSidebar);
  }

  if (el.sidebarClose) {
    el.sidebarClose.addEventListener("click", closeSidebar);
  }

  if (el.sidebarNavLinks.length) {
    el.sidebarNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeSidebar();
      });
    });
  }

  el.markCompleteBtn.addEventListener("click", markSelectedModuleComplete);
  el.resetProgressBtn.addEventListener("click", resetProgress);

  el.openRecommendation.addEventListener("click", () => {
    const target = el.openRecommendation.dataset.targetModule;
    if (target) {
      openModule(target);
    }
  });

  el.jumpToRecommendations.addEventListener("click", () => {
    const panel = document.getElementById("recommendations");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

function init() {
  el.year.textContent = new Date().getFullYear();
  wireEvents();
  updateStats();
  renderModules();
  renderRecommendation();
}

init();
