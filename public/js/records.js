/* Downloadable training records (PDF).
   Learners download their own record; organization admins download a report for their own organization.
   The PDF is built in the browser from the same data the portal already shows, so nothing new is sent anywhere. */
import { getCourseQuiz } from "./courses.js";
import { getVideoPercent } from "./video.js";

const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const ORG_NAME = () => window.companyPortal?.name || "";

let jsPdfPromise = null;
function loadJsPdf() {
  jsPdfPromise ??= new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
    const script = document.createElement("script");
    script.src = JSPDF_URL;
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => {
      jsPdfPromise = null;
      reject(new Error("The PDF tool could not be loaded. Check your connection and try again."));
    };
    document.head.append(script);
  });
  return jsPdfPromise;
}

function formatDate(value) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not recorded"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function slug(text) {
  return String(text || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
}

/** A short "what you learned" overview for a course, built from its description and what its quiz checked. */
function courseOverview(course) {
  const description = String(course?.description || "").trim();
  const topics = getCourseQuiz(course || {})
    .map((question) => question.prompt.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5);
  return { description, topics };
}

function resolveCompleted(profile, courses) {
  const byId = new Map(courses.map((course) => [course.id, course]));
  const byTitle = new Map(courses.map((course) => [String(course.title || "").trim().toLowerCase(), course]));
  const dates = profile.completionDates || {};
  const seen = new Set();
  const completed = [];
  for (const raw of Array.isArray(profile.completedCourseIds) ? profile.completedCourseIds : []) {
    const key = String(raw || "").trim();
    const course = byId.get(key) || byTitle.get(key.toLowerCase()) || { id: key, title: key };
    if (!key || seen.has(course.id)) continue;
    seen.add(course.id);
    completed.push({ course, date: dates[course.id] || dates[key] || "" });
  }
  return completed.sort((a, b) => String(a.course.title).localeCompare(String(b.course.title)));
}

/** Small layout helper: wraps text, adds pages as needed. */
function createWriter(PDF, headerText) {
  const pdf = new PDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - 60;
  let y = margin;

  const footer = () => {
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.text(`${headerText}  |  Page ${page} of ${pages}`, margin, pdf.internal.pageSize.getHeight() - 30);
    }
  };

  const ensure = (height) => {
    if (y + height > bottom) {
      pdf.addPage();
      y = margin;
    }
  };

  const write = (text, { size = 10.5, bold = false, color = 30, gap = 4, indent = 0 } = {}) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(String(text), width - indent);
    const lineHeight = size * 1.35;
    for (const line of lines) {
      ensure(lineHeight);
      pdf.text(line, margin + indent, y + size);
      y += lineHeight;
    }
    y += gap;
  };

  const rule = () => {
    ensure(10);
    pdf.setDrawColor(200);
    pdf.line(margin, y, margin + width, y);
    y += 10;
  };

  return { pdf, write, rule, footer, space: (n) => { y += n; }, ensure, newPage: () => { pdf.addPage(); y = margin; } };
}

function writeLearner(writer, { name, email, orgName, profile, courses, resourcesTotal, videoPercents }) {
  const completed = resolveCompleted(profile, courses);
  const readCount = Array.isArray(profile.readResourceIds) ? profile.readResourceIds.length : 0;

  writer.write(name || "Learner", { size: 15, bold: true, gap: 2 });
  writer.write([email, orgName].filter(Boolean).join("  |  "), { size: 9.5, color: 110, gap: 6 });
  writer.write(
    `${completed.length} of ${courses.length} courses completed  |  ${readCount} of ${resourcesTotal} reading guides marked as read`,
    { size: 10, bold: true, gap: 8 }
  );

  if (!completed.length) {
    writer.write("No courses have been completed yet.", { color: 110, gap: 10 });
    return;
  }

  for (const { course, date } of completed) {
    writer.ensure(70);
    writer.write(course.title || "Untitled course", { size: 12, bold: true, gap: 1 });
    const watched = videoPercents?.[course.id];
    const detail = [
      `Completed ${formatDate(date)}`,
      "Quiz passed (all questions answered correctly)",
      watched ? `Video watched: ${watched}%` : ""
    ].filter(Boolean).join("  |  ");
    writer.write(detail, { size: 9, color: 110, gap: 4 });

    const { description, topics } = courseOverview(course);
    writer.write("What you learned", { size: 10, bold: true, gap: 1 });
    if (description) writer.write(description, { gap: 3 });
    if (topics.length) {
      writer.write("Skills checked in the quiz:", { size: 9.5, color: 90, gap: 1 });
      topics.forEach((topic) => writer.write(`•  ${topic}`, { size: 9.5, indent: 10, gap: 1 }));
    }
    writer.space(8);
  }
}

async function loadContext() {
  await window.firebaseCoursesReady;
  const courses = (Array.isArray(window.firebaseCourses) ? window.firebaseCourses : []).filter((course) => course?.id);
  return { courses };
}

function resourceCount() {
  return window.graphenexResources?.length ?? 0;
}

function save(pdf, filename) {
  pdf.save(filename);
}

/** The signed-in learner's own record. */
export async function downloadMyRecord() {
  const PDF = await loadJsPdf();
  const { courses } = await loadContext();
  const user = window.grapheneAuth.getCurrentUser();
  const profile = (await window.grapheneAuth.getUserProfileForAuthUser(user)) || {};
  const videoPercents = Object.fromEntries(courses.map((course) => [course.id, getVideoPercent(course.id)]));
  const name = profile.userName || profile.name || user.displayName || "Learner";
  const orgName = ORG_NAME() || window.grapheneAccessState?.organization?.name || "";

  const writer = createWriter(PDF, "GrapheneX Academy training record");
  writer.write("GrapheneX Academy", { size: 11, bold: true, color: 90, gap: 0 });
  writer.write("Training Completion Record", { size: 20, bold: true, gap: 2 });
  writer.write(`Issued ${formatDate(new Date().toISOString())}  |  A BioGlytch Studios LLC product`, { size: 9, color: 110, gap: 8 });
  writer.rule();
  writeLearner(writer, { name, email: profile.email || user.email, orgName, profile, courses, resourcesTotal: resourceCount(), videoPercents });
  writer.footer();
  save(writer.pdf, `training-record-${slug(name)}.pdf`);
}

/** A report for every learner in the admin's own organization (the data comes from rules-protected queries). */
export async function downloadOrganizationReport() {
  const PDF = await loadJsPdf();
  const { courses } = await loadContext();
  const companyId = window.companyPortal?.id || (await window.grapheneAuth.getAssignedCompanyId());
  const learners = await window.grapheneAuth.getAllUserProgress(companyId);
  const orgName = ORG_NAME() || window.grapheneAccessState?.organization?.name || companyId;

  const writer = createWriter(PDF, `${orgName} training report`);
  writer.write("GrapheneX Academy", { size: 11, bold: true, color: 90, gap: 0 });
  writer.write(`${orgName} Training Report`, { size: 20, bold: true, gap: 2 });
  writer.write(`Issued ${formatDate(new Date().toISOString())}  |  ${learners.length} learner accounts`, { size: 9, color: 110, gap: 8 });
  writer.rule();

  const sorted = [...learners].sort((a, b) =>
    String(a.userName || a.name || "").localeCompare(String(b.userName || b.name || ""))
  );
  writer.write("Summary", { size: 13, bold: true, gap: 4 });
  sorted.forEach((learner) => {
    const done = resolveCompleted(learner, courses).length;
    const label = learner.userName || learner.name || learner.email || "Learner";
    writer.write(`${label}: ${done} of ${courses.length} courses completed`, { size: 10, gap: 1 });
  });

  sorted.forEach((learner) => {
    writer.newPage();
    writeLearner(writer, {
      name: learner.userName || learner.name || "Learner",
      email: learner.email || "",
      orgName,
      profile: learner,
      courses,
      resourcesTotal: resourceCount(),
      videoPercents: null
    });
  });

  writer.footer();
  save(writer.pdf, `${slug(orgName)}-training-report.pdf`);
}

function wire(button, action) {
  if (!button || button.dataset.recordWired) return;
  button.dataset.recordWired = "1";
  const label = button.textContent;
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Preparing PDF…";
    try {
      await action();
    } catch (error) {
      console.error("Unable to create the PDF:", error);
      button.textContent = "Could not create PDF. Try again.";
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
}

function init() {
  wire(document.getElementById("downloadMyRecord"), downloadMyRecord);
  wire(document.getElementById("downloadOrgReport"), downloadOrganizationReport);
}

init();
document.addEventListener("access-ready", init);
