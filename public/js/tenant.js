const companies = {
  angle: {
    id: "ANGLE",
    slug: "angle",
    name: "Angle The Agency",
    logo: "/assets/images/angle-logo.jpeg",
    colors: {
      primary: "196 100% 41%",
      primaryForeground: "0 0% 100%",
      accent: "67 68% 51%",
      background: "195 100% 97%",
      foreground: "218 25% 14%",
      card: "0 0% 100%",
      secondary: "195 72% 90%",
      border: "195 35% 82%"
    }
  },
  fpl: {
    id: "FPL",
    slug: "fpl",
    name: "Flint Public Library",
    logo: "/assets/images/fpl-logo.svg",
    colors: {
      primary: "196 100% 41%",
      primaryForeground: "0 0% 100%",
      accent: "67 68% 51%",
      background: "195 100% 97%",
      foreground: "218 25% 14%",
      card: "0 0% 100%",
      secondary: "195 72% 90%",
      border: "195 35% 82%"
    }
  }
};

const companiesById = Object.fromEntries(
  Object.values(companies).map((company) => [company.id, company])
);
const pathname = window.location.pathname;
const pathSegments = pathname.split("/").filter(Boolean);
const routeSlug = pathSegments[0]?.toLowerCase();
const querySlug = new URLSearchParams(window.location.search).get("company")?.toLowerCase();
const company = companies[routeSlug] || companies[querySlug] || null;

window.companyPortal = company;
window.companyPortalsById = companiesById;

window.getCompanyPortalPath = (companyId) => {
  const assignedCompany = companiesById[String(companyId || "").trim()];
  return assignedCompany ? `/${assignedCompany.slug}/portal` : null;
};

if (company) {
  const applyColors = (element) => {
    element.dataset.companyPortal = company.slug;
    element.style.setProperty("--primary", company.colors.primary);
    element.style.setProperty("--primary-foreground", company.colors.primaryForeground);
    element.style.setProperty("--accent", company.colors.accent);
    element.style.setProperty("--background", company.colors.background);
    element.style.setProperty("--foreground", company.colors.foreground);
    element.style.setProperty("--card", company.colors.card);
    element.style.setProperty("--secondary", company.colors.secondary);
    element.style.setProperty("--border", company.colors.border);
  };

  applyColors(document.documentElement);
  document.title = `${company.name} | Learning Portal`;

  document.addEventListener("DOMContentLoaded", () => {
    applyColors(document.body);

    const profileLogo = document.querySelector(".profile-avatar-box");
    if (profileLogo) {
      profileLogo.innerHTML = `<img src="${company.logo}" alt="${company.name} logo" />`;
      profileLogo.setAttribute("aria-label", `${company.name} logo`);
      profileLogo.removeAttribute("aria-hidden");
    }

    const brandmark = document.querySelector(".brandmark-shell");
    if (brandmark) {
      brandmark.innerHTML = `<img src="${company.logo}" alt="${company.name} logo" />`;
      brandmark.setAttribute("aria-label", `${company.name} logo`);
    }

    document.querySelectorAll(".brand-word").forEach((brandWord) => {
      brandWord.hidden = true;
    });

    const topbarBadge = document.querySelector(".topbar-badge");
    if (topbarBadge) {
      topbarBadge.textContent = "Learning Portal";
    }

    const heroTitle = document.querySelector("#hero-title");
    if (heroTitle) {
      heroTitle.textContent = `${company.name} Learning Portal`;
    }

    const heroLabel = document.querySelector(".hero-label span:first-child");
    if (heroLabel) {
      heroLabel.textContent = `${company.name} // Learning Portal`;
    }

    const heroCopy = document.querySelector(".hero-subcopy");
    if (heroCopy) {
      heroCopy.textContent = "Build practical digital safety skills with focused courses and hands-on practice.";
    }

    const portalTitle = document.querySelector(".portal-hero h1");
    if (portalTitle) {
      portalTitle.textContent = `${company.name} Learning Portal`;
    }

    const portalCopy = document.querySelector(".portal-subcopy");
    if (portalCopy) {
      portalCopy.textContent = "Learn, practice, and build safer digital habits with your organization’s training.";
    }

    const authTitle = document.getElementById("authTitle");
    if (authTitle) {
      authTitle.textContent = `Welcome to ${company.name}`;
    }

    const footerCopy = document.querySelector(".footer-copy");
    if (footerCopy) {
      footerCopy.textContent = `${company.name} staff learning and digital safety training.`;
    }

    const profileLabel = document.querySelector(".profile-card p");
    if (profileLabel) {
      profileLabel.textContent = company.name.toUpperCase();
    }

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = `${company.name} learning portal for staff training and digital safety courses.`;
    }
  });
}
