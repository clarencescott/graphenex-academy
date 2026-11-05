/* Plays a course video on the page and counts real watch time.
   Skipping ahead does not count: only seconds that actually played are marked as watched.
   The quiz unlocks once 90% of the video has been watched. Progress is saved per learner. */
import { collection, doc, getDocs, query, setDoc, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { db } from "./firebase.js";

export const UNLOCK_PERCENT = 90;
const POLL_MS = 500;
const SAVE_EVERY_MS = 10000;
const LOCAL_PREFIX = "graphenex.videoProgress.";

// courseId -> { bits: Uint8Array, duration: number }
const progress = new Map();
let apiPromise = null;

function currentUid() {
  return window.grapheneAuth?.getCurrentUser?.()?.uid || "";
}

function emptyBits(duration) {
  return new Uint8Array(Math.max(1, Math.ceil(duration || 0)));
}

function countBits(bits) {
  let total = 0;
  for (const value of bits) total += value ? 1 : 0;
  return total;
}

function encodeBits(bits) {
  let binary = "";
  const bytes = Math.ceil(bits.length / 8);
  for (let index = 0; index < bytes; index += 1) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      if (bits[index * 8 + bit]) byte |= 1 << bit;
    }
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBits(encoded, duration) {
  const bits = emptyBits(duration);
  try {
    const binary = atob(String(encoded || ""));
    for (let index = 0; index < bits.length; index += 1) {
      const byte = binary.charCodeAt(index >> 3) || 0;
      bits[index] = (byte >> (index & 7)) & 1;
    }
  } catch {
    // An unreadable record counts as no progress.
  }
  return bits;
}

function merge(courseId, bits, duration) {
  const existing = progress.get(courseId);
  const length = Math.max(bits.length, existing?.bits.length || 0, Math.ceil(duration || 0));
  const merged = emptyBits(length);
  for (let index = 0; index < merged.length; index += 1) {
    merged[index] = (bits[index] || existing?.bits[index]) ? 1 : 0;
  }
  progress.set(courseId, { bits: merged, duration: duration || existing?.duration || merged.length });
}

export function getVideoPercent(courseId) {
  const entry = progress.get(courseId);
  if (!entry || !entry.duration) return 0;
  return Math.min(100, Math.floor((countBits(entry.bits) / Math.ceil(entry.duration)) * 100));
}

function announce(courseId) {
  document.dispatchEvent(new CustomEvent("course-video-progress", { detail: { courseId } }));
}

function readLocal(courseId) {
  try {
    const raw = JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}${currentUid()}.${courseId}`) || "null");
    if (raw?.bits && raw?.duration) merge(courseId, decodeBits(raw.bits, raw.duration), raw.duration);
  } catch {
    // Browser storage is only a backup.
  }
}

function writeLocal(courseId) {
  const entry = progress.get(courseId);
  if (!entry) return;
  try {
    localStorage.setItem(
      `${LOCAL_PREFIX}${currentUid()}.${courseId}`,
      JSON.stringify({ bits: encodeBits(entry.bits), duration: entry.duration })
    );
  } catch {
    // Browser storage may be unavailable.
  }
}

async function saveRemote(courseId) {
  const uid = currentUid();
  const entry = progress.get(courseId);
  if (!uid || !entry) return;
  writeLocal(courseId);
  try {
    await setDoc(doc(db, "videoProgress", `${uid}_${courseId}`), {
      uid,
      courseId,
      bits: encodeBits(entry.bits),
      duration: entry.duration,
      percent: getVideoPercent(courseId),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Unable to save video progress:", error);
  }
}

/** Loads saved watch progress for the signed-in learner. Call once the courses are known. */
export async function loadVideoProgress(courses) {
  const uid = currentUid();
  if (!uid) return;
  courses.forEach((course) => readLocal(course.id));
  try {
    const snapshot = await getDocs(query(collection(db, "videoProgress"), where("uid", "==", uid)));
    snapshot.forEach((record) => {
      const data = record.data();
      if (data.courseId && data.bits && data.duration) {
        merge(data.courseId, decodeBits(data.bits, data.duration), data.duration);
      }
    });
  } catch (error) {
    console.error("Unable to load video progress:", error);
  }
  courses.forEach((course) => announce(course.id));
}

function loadYouTubeApi() {
  apiPromise ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("The video player could not be loaded."));
    };
    document.head.append(script);
  });
  return apiPromise;
}

function ensureDialog() {
  let dialog = document.getElementById("courseVideoDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "courseVideoDialog";
  dialog.className = "course-video-dialog";
  dialog.setAttribute("aria-labelledby", "courseVideoTitle");
  dialog.innerHTML = `
    <div class="course-video-dialog-header">
      <h2 id="courseVideoTitle"></h2>
      <button type="button" class="course-video-close" aria-label="Close video">×</button>
    </div>
    <div class="course-video-frame"><div id="courseVideoPlayer"></div></div>
    <div class="course-video-progress">
      <div class="course-video-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span></span><i class="course-video-mark"></i>
      </div>
      <p class="course-video-status" role="status" aria-live="polite"></p>
    </div>
    <p class="course-video-error" role="alert" hidden></p>
  `;
  document.body.append(dialog);
  return dialog;
}

/** Opens the video for a course in a dialog and tracks how much of it is really watched. */
export async function openCourseVideo(course, videoId) {
  const dialog = ensureDialog();
  const title = dialog.querySelector("#courseVideoTitle");
  const bar = dialog.querySelector(".course-video-bar");
  const fill = bar.querySelector("span");
  const status = dialog.querySelector(".course-video-status");
  const errorBox = dialog.querySelector(".course-video-error");
  const closeButton = dialog.querySelector(".course-video-close");
  const frame = dialog.querySelector(".course-video-frame");
  frame.replaceChildren(Object.assign(document.createElement("div"), { id: "courseVideoPlayer" }));
  title.textContent = course.title || "Course video";
  errorBox.hidden = true;
  readLocal(course.id);

  const showProgress = () => {
    const percent = getVideoPercent(course.id);
    fill.style.width = `${percent}%`;
    bar.setAttribute("aria-valuenow", String(percent));
    status.textContent = percent >= UNLOCK_PERCENT
      ? `${percent}% watched. The quiz is unlocked.`
      : `${percent}% watched. Watch ${UNLOCK_PERCENT}% to unlock the quiz. Skipped parts do not count.`;
    announce(course.id);
  };
  showProgress();
  dialog.showModal();

  let YT;
  try {
    YT = await loadYouTubeApi();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    return;
  }

  let player = null;
  let timer = null;
  let lastTime = null;
  let lastSave = Date.now();
  let dirty = false;

  const flush = () => {
    if (dirty) {
      dirty = false;
      lastSave = Date.now();
      saveRemote(course.id);
    }
  };

  const tick = () => {
    if (!player?.getCurrentTime || player.getPlayerState?.() !== YT.PlayerState.PLAYING) {
      lastTime = null;
      return;
    }
    const time = player.getCurrentTime();
    const duration = player.getDuration?.() || 0;
    if (!duration) return;
    const rate = player.getPlaybackRate?.() || 1;
    // A jump bigger than normal playback allows is a seek, which earns no credit.
    const maxStep = (POLL_MS / 1000) * rate * 2 + 0.5;
    if (lastTime !== null && time >= lastTime && time - lastTime <= maxStep) {
      const entry = progress.get(course.id);
      if (!entry || entry.bits.length < Math.ceil(duration)) {
        merge(course.id, entry?.bits || emptyBits(duration), duration);
      }
      const bits = progress.get(course.id).bits;
      for (let second = Math.floor(lastTime); second <= Math.floor(time); second += 1) {
        if (second < bits.length && !bits[second]) {
          bits[second] = 1;
          dirty = true;
        }
      }
      if (dirty) showProgress();
    }
    lastTime = time;
    if (dirty && Date.now() - lastSave >= SAVE_EVERY_MS) flush();
  };

  player = new YT.Player("courseVideoPlayer", {
    videoId,
    width: "100%",
    height: "100%",
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => {
        const duration = player.getDuration?.();
        if (duration) merge(course.id, progress.get(course.id)?.bits || emptyBits(duration), duration);
        showProgress();
      },
      onStateChange: (event) => {
        lastTime = null;
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) flush();
      },
      onError: () => {
        errorBox.textContent = "This video can't be played here. Try again later or contact support.";
        errorBox.hidden = false;
      }
    }
  });
  timer = setInterval(tick, POLL_MS);

  const close = () => {
    clearInterval(timer);
    flush();
    try {
      player?.destroy?.();
    } catch {
      // The player may already be gone.
    }
    dialog.removeEventListener("close", close);
    announce(course.id);
  };
  dialog.addEventListener("close", close);
  closeButton.onclick = () => dialog.close();
}
