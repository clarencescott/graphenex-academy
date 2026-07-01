// Load courses from Firebase
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { db } from "./firebase.js";

const container = document.getElementById("coursesContainer");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadCourses() {
  if (!container) {
    return;
  }

  container.innerHTML = '<div class="empty-state">Loading courses from Firebase...</div>';

  try {
    const querySnapshot = await getDocs(collection(db, "courses"));

    if (querySnapshot.empty) {
      container.innerHTML = '<div class="empty-state">No courses found in Firebase yet.</div>';
      return;
    }

    container.innerHTML = "";

    querySnapshot.forEach((docSnapshot) => {
      const course = docSnapshot.data();
      const card = document.createElement("article");
      card.className = "card firebase-course-card";

      card.innerHTML = `
        <h4>${escapeHtml(course.title ?? "Untitled Course")}</h4>
        <p>${escapeHtml(course.description ?? "No description provided.")}</p>
        <div class="firebase-course-meta">
          <span class="badge">Level: ${escapeHtml(course.level ?? "N/A")}</span>
          <span class="badge">Duration: ${escapeHtml(course.duration ?? "N/A")}</span>
          <span class="badge">Instructor: ${escapeHtml(course.instructor ?? "N/A")}</span>
        </div>
        ${course.link ? `<a class="btn btn-primary" href="${escapeHtml(course.link)}" target="_blank" rel="noopener noreferrer">Go to Course</a>` : ""}
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading courses:", error);
    container.innerHTML = '<div class="empty-state">Unable to load courses right now. Please try again later.</div>';
  }
}

loadCourses();
