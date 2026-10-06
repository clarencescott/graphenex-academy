// Load courses from Firebase
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { db } from "./firebase.js";

const container = document.getElementById("coursesContainer");
const quizModal = document.getElementById("courseQuizModal");
const quizModalTitle = document.getElementById("courseQuizModalTitle");
const quizModalContent = document.getElementById("courseQuizModalContent");
const masterDashboard = document.getElementById("masterDashboard");
const masterUsersBody = document.getElementById("masterUsersBody");
const masterDashboardMessage = document.getElementById("masterDashboardMessage");
const masterRefreshButton = document.getElementById("masterRefreshButton");
const masterUserCount = document.getElementById("masterUserCount");
const masterCompletionCount = document.getElementById("masterCompletionCount");
window.firebaseCourses = [];
window.firebaseCoursesReady = Promise.resolve([]);
window.courseCompletionIds = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function getCourseQuiz(course) {
  const rawQuiz = course.quiz;
  const rawQuestions = Array.isArray(rawQuiz)
    ? rawQuiz
    : Array.isArray(rawQuiz?.questions)
      ? rawQuiz.questions
      : Array.isArray(course.questions)
        ? course.questions
        : rawQuiz && typeof rawQuiz === "object" && !("question" in rawQuiz) && !("prompt" in rawQuiz)
          ? Object.entries(rawQuiz)
              .filter(([, value]) => Array.isArray(value))
              .map(([question, options]) => ({
                question,
                options,
                answerIndex: rawQuiz.answerIndex
              }))
          : [rawQuiz];

  const questions = rawQuestions.map((question) => {
    if (!question || typeof question !== "object") return null;
    const keyedOptions = Object.entries(question).find(
      ([key, value]) => key !== "answerIndex" && key !== "correctAnswerIndex" && Array.isArray(value)
    );
    const rawOptions = Array.isArray(question.options) ? question.options : keyedOptions?.[1];
    const options = Array.isArray(rawOptions)
      ? rawOptions.map((option) => String(option ?? "").trim())
      : [];
    const answerIndex = Number.isInteger(question.answerIndex)
      ? question.answerIndex
      : Number.isInteger(question.correctAnswerIndex)
        ? question.correctAnswerIndex
        : options.findIndex((option) => option === String(question.correctAnswer ?? "").trim());
    const prompt = String(question.question ?? question.prompt ?? keyedOptions?.[0] ?? "").trim();

    if (!prompt || options.length < 2 || answerIndex < 0 || answerIndex >= options.length || options.some((option) => !option)) {
      return null;
    }

    return { prompt, options, answerIndex };
  });

  return questions.length && questions.every(Boolean) ? questions : [];
}

function setCourseCompletionIds(ids, error = null) {
  window.courseCompletionIds = Array.from(new Set(ids.map((id) => String(id || "").trim()).filter(Boolean)));
  window.courseProgressError = error;
  document.dispatchEvent(new CustomEvent("course-progress-updated"));
}

function renderQuiz(panel, course) {
  const questions = getCourseQuiz(course);
  if (!questions.length) {
    panel.innerHTML = '<p class="course-quiz-message" role="status">A quiz has not been configured for this course yet.</p>';
    return;
  }

  let questionIndex = 0;
  let correctAnswers = 0;

  const renderQuestion = () => {
    const question = questions[questionIndex];
    panel.innerHTML = `
      <form class="course-quiz-form">
        <p class="course-quiz-count">Question ${questionIndex + 1} of ${questions.length}</p>
        <fieldset>
          <legend>${escapeHtml(question.prompt)}</legend>
          ${question.options.map((option, index) => `
            <label class="course-quiz-option">
              <input type="radio" name="course-answer" value="${index}" />
              <span>${escapeHtml(option)}</span>
            </label>
          `).join("")}
        </fieldset>
        <p class="course-quiz-message" role="status" aria-live="polite"></p>
        <button class="course-quiz-submit" type="submit">${questionIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}</button>
      </form>
    `;

    const form = panel.querySelector(".course-quiz-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const selected = form.querySelector('input[name="course-answer"]:checked');
      const message = form.querySelector(".course-quiz-message");
      if (!selected) {
        message.textContent = "Choose an answer to continue.";
        return;
      }

      if (Number(selected.value) !== question.answerIndex) {
        message.textContent = "That's not correct. Try another answer.";
        return;
      }

      questionIndex += 1;
      if (questionIndex < questions.length) {
        renderQuestion();
        return;
      }

      const submitButton = form.querySelector(".course-quiz-submit");
      submitButton.disabled = true;
      message.textContent = "Saving your course progress...";

      try {
        await window.grapheneAuth.recordCourseCompletion(course.id);
        setCourseCompletionIds([...window.courseCompletionIds, course.id]);
        panel.innerHTML = `
          <p class="course-quiz-result" role="status">Quiz complete—all answers correct. Your course progress has been saved.</p>
          <span class="course-completed-badge">Course completed</span>
        `;
      } catch (error) {
        console.error("Unable to save course completion:", error);
        panel.innerHTML = `
          <p class="course-quiz-message" role="alert">Your quiz is complete, but your progress could not be saved. Please try again.</p>
          <button class="course-quiz-submit" type="button">Retry saving progress</button>
        `;
        panel.querySelector(".course-quiz-submit").addEventListener("click", async () => {
          const retryButton = panel.querySelector(".course-quiz-submit");
          retryButton.disabled = true;
          retryButton.textContent = "Saving...";
          try {
            await window.grapheneAuth.recordCourseCompletion(course.id);
            setCourseCompletionIds([...window.courseCompletionIds, course.id]);
            panel.innerHTML = `
              <p class="course-quiz-result" role="status">Quiz complete—all answers correct. Your course progress has been saved.</p>
              <span class="course-completed-badge">Course completed</span>
            `;
          } catch (retryError) {
            console.error("Unable to retry saving course completion:", retryError);
            retryButton.disabled = false;
            retryButton.textContent = "Retry saving progress";
          }
        });
      }
    });
  };

  renderQuestion();
}

function renderCourse(course) {
  const rawVideo = String(course.videoID ?? "").trim();
  const videoId = getYouTubeVideoId(rawVideo);
  const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawVideo;
  const videoPreview = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  const videoPreviewHtml = videoPreview
    ? `<a class="course-video-link" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">
        <div class="course-video-preview">
          <img src="${escapeHtml(videoPreview)}" alt="Video thumbnail for ${escapeHtml(course.title ?? "course video")}" />
          <div class="video-overlay"><span>Preview course</span></div>
        </div>
      </a>`
    : '<div class="course-video-placeholder" aria-hidden="true"></div>';
  const startButton = videoUrl
    ? `<a class="course-start-button" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">Start</a>`
    : '<button class="course-start-button" type="button" disabled title="No course video is available">Start</button>';

  const card = document.createElement("article");
  card.className = "card firebase-course-card";
  card.innerHTML = `
    <h4>${escapeHtml(course.title ?? "Untitled Course")}</h4>
    ${videoPreviewHtml}
    <div class="course-card-actions">
      ${startButton}
      <button class="course-quiz-toggle" type="button" aria-haspopup="dialog">Take Quiz</button>
      <span class="course-completed-badge" hidden>Completed</span>
    </div>
    <p>${escapeHtml(course.description ?? "No description provided.")}</p>
    <span class="course-duration">Duration: ${escapeHtml(course.duration ?? "N/A")}</span>
  `;

  if (window.courseCompletionIds.includes(course.id)) {
    card.querySelector(".course-completed-badge").hidden = false;
  }

  const toggle = card.querySelector(".course-quiz-toggle");
  toggle.addEventListener("click", () => {
    if (!quizModal || !quizModalTitle || !quizModalContent) {
      console.error("Course quiz modal is unavailable.");
      return;
    }
    quizModalTitle.textContent = `${course.title ?? "Course"} Quiz`;
    renderQuiz(quizModalContent, course);
    quizModal.showModal();
  });

  return card;
}

function updateCourseCompletionBadges() {
  container?.querySelectorAll(".firebase-course-card").forEach((card, index) => {
    const course = window.firebaseCourses[index];
    const badge = card.querySelector(".course-completed-badge");
    const toggle = card.querySelector(".course-quiz-toggle");
    if (course && badge) {
      const completed = window.courseCompletionIds.includes(course.id);
      badge.hidden = !completed;
      if (toggle) {
        toggle.textContent = completed ? "Retake Quiz" : "Take Quiz";
      }
    }
  });
}

function renderMasterUsers(users) {
  const courses = Array.isArray(window.firebaseCourses) ? window.firebaseCourses : [];
  const courseTitles = new Map(courses.map((course) => [course.id, course.title || "Untitled Course"]));
  let completionCount = 0;

  const rows = [...users]
    .sort((left, right) => {
      const leftName = left.userName || left.name || left.fullName || left.displayName || "Learner";
      const rightName = right.userName || right.name || right.fullName || right.displayName || "Learner";
      return String(leftName).localeCompare(String(rightName));
    })
    .map((user) => {
      const completedIds = Array.isArray(user.completedCourseIds)
        ? Array.from(new Set(user.completedCourseIds.map((id) => String(id || "").trim()).filter(Boolean)))
        : [];
      completionCount += completedIds.length;
      const displayName = user.userName || user.name || user.fullName || user.displayName || "Learner";
      const email = user.email || user.userEmail || "No email";
      const completedCourses = completedIds.length
        ? completedIds.map((id) => escapeHtml(courseTitles.get(id) || id)).join(", ")
        : "No courses completed";

      return `
        <tr>
          <td>${escapeHtml(displayName)}</td>
          <td>${escapeHtml(email)}</td>
          <td>${completedIds.length} / ${courses.length}</td>
          <!--- <td>${completedCourses}</td> --->
        </tr>
      `;
    });

  masterUsersBody.innerHTML = rows.length
    ? rows.join("")
    : '<tr><td colspan="4">No learner accounts found.</td></tr>';
  masterUserCount.textContent = String(users.length);
  masterCompletionCount.textContent = String(completionCount);
}

async function refreshMasterDashboard() {
  if (!masterDashboard || !masterUsersBody || !masterDashboardMessage || !masterRefreshButton) {
    return;
  }

  masterRefreshButton.disabled = true;
  masterDashboardMessage.textContent = "Loading learner progress...";
  masterUsersBody.innerHTML = "";

  try {
    await window.firebaseCoursesReady;
    const users = await window.grapheneAuth.getAllUserProgress(window.companyPortal?.id);
    renderMasterUsers(users);
    masterDashboardMessage.textContent = `Showing progress for ${users.length} learner accounts.`;
  } catch (error) {
    console.error("Unable to load master dashboard:", error);
    masterDashboardMessage.textContent = "Unable to load learner progress. Check admin access and Firestore rules, then try again.";
  } finally {
    masterRefreshButton.disabled = false;
  }
}

masterRefreshButton?.addEventListener("click", refreshMasterDashboard);

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

      const loadedCourses = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      container.replaceChildren(...loadedCourses.map(renderCourse));
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

window.grapheneAuth.observeAuthState(async (user) => {
  if (!user) {
    setCourseCompletionIds([]);
    updateCourseCompletionBadges();
    if (masterDashboard) {
      masterDashboard.hidden = true;
    }
    return;
  }

  if (masterDashboard) {
    try {
      masterDashboard.hidden = !(await window.grapheneAuth.isCompanyAdmin(window.companyPortal?.id, user));
      if (!masterDashboard.hidden) {
        await refreshMasterDashboard();
      }
    } catch (error) {
      masterDashboard.hidden = true;
      console.error("Unable to verify master dashboard access:", error);
    }
  }

  try {
    const profile = await window.grapheneAuth.getUserProfileForAuthUser(user);
    const savedIds = Array.isArray(profile?.completedCourseIds) ? profile.completedCourseIds : [];
    setCourseCompletionIds(savedIds);
    updateCourseCompletionBadges();
  } catch (error) {
    window.courseProgressError = error;
    document.dispatchEvent(new CustomEvent("course-progress-updated"));
    console.error("Unable to load course progress:", error);
  }
});

document.addEventListener("course-progress-updated", updateCourseCompletionBadges);
document.getElementById("courseQuizModalClose")?.addEventListener("click", () => quizModal?.close());
quizModal?.addEventListener("click", (event) => {
  if (event.target === quizModal) {
    quizModal.close();
  }
});
loadCourses();
