// Load courses from Firebase
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { db } from "./firebase.js";

const container = document.getElementById("coursesContainer");
window.firebaseCourses = [];
window.firebaseCoursesReady = Promise.resolve();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "Unknown date";
  if (typeof value?.toDate === "function") {
    value = value.toDate();
  }
  if (value instanceof Date) {
    return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return String(value);
}

function getYouTubeVideoId(source) {
  const raw = String(source ?? "").trim();
  if (!raw) return "";
  const urlMatch = raw.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : "";
}

async function loadCourses() {
  if (!container) {
    return;
  }

  container.innerHTML = '<div class="empty-state">Loading courses from Firebase...</div>';

  const coursesPromise = (async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "courses"));

      if (querySnapshot.empty) {
        container.innerHTML = '<div class="empty-state">No courses found in Firebase yet.</div>';
        return [];
      }

      container.innerHTML = "";
      const loadedCourses = [];

      querySnapshot.forEach((docSnapshot) => {
        const course = docSnapshot.data();
        const courseRecord = {
          id: docSnapshot.id,
          ...course
        };

        loadedCourses.push(courseRecord);

        const createdAtText = formatDate(course.createdAt);
        const courseStatus = course.isPublished === true ? "Published" : "Draft";
        const rawVideo = String(course.videoID ?? "").trim();
        const videoId = getYouTubeVideoId(rawVideo);
        const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawVideo;
        const videoPreview = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
        const metadataTabsHtml = `
          <div class="firebase-course-meta">
            <span class="badge">Level: ${escapeHtml(course.level ?? "N/A")}</span>
            <span class="badge">Duration: ${escapeHtml(course.duration ?? "N/A")}</span>
            <span class="badge">Instructor: ${escapeHtml(course.instructor ?? "N/A")}</span>
            <span class="badge">Status: ${escapeHtml(courseStatus)}</span>
            <span class="badge">Modules: ${escapeHtml(String(course.totalModules ?? "N/A"))}</span>
            <span class="badge">Added: ${escapeHtml(createdAtText)}</span>
          </div>
        `;
        const videoPreviewHtml = videoPreview
          ? `<a class="course-video-link" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">
              <div class="course-video-preview">
                <img src="${escapeHtml(videoPreview)}" alt="Video thumbnail for ${escapeHtml(course.title ?? "course video")}" />
                <div class="video-meta-overlay">${metadataTabsHtml}</div>
                <div class="video-overlay"><span>Watch Intro</span></div>
              </div>
            </a>`
          : "";

        const card = document.createElement("article");
        card.className = "card firebase-course-card";

        card.innerHTML = `
          <h4>${escapeHtml(course.title ?? "Untitled Course")}</h4>
          ${videoPreviewHtml}
          <p>${escapeHtml(course.description ?? "No description provided.")}</p>
          ${videoPreview ? "" : metadataTabsHtml}
        `;

        container.appendChild(card);
      });

      return loadedCourses;
    } catch (error) {
      console.error("Error loading courses:", error);
      container.innerHTML = '<div class="empty-state">Unable to load courses right now. Please try again later.</div>';
      return [];
    }
  })();

  window.firebaseCoursesReady = coursesPromise.then((courses) => {
    window.firebaseCourses = courses;
    return courses;
  });

  await window.firebaseCoursesReady;
}

loadCourses();
