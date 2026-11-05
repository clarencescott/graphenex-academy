/* More mini games plus story "missions": short video-game style lessons with choices, health and XP.
   Games follow the same play(root, ctx) contract as minigames-extra.js and join the same hub list. */
import { extraGames, shell, results, shuffle, getBest } from "./minigames-extra.js";

const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Password Forge (puzzle) ---------- */
const FORGE_ROUNDS = [
  { options: ["Summer2024!", "correct-horse-battery-staple-91", "P@ssw0rd"], best: 1, why: "Length wins. A long passphrase of unrelated words beats a short password with swapped letters." },
  { options: ["Fluffy123", "qT7$vL!2nR@9xW", "Fluffy!Fluffy!"], best: 1, why: "Random characters are strong, and a pet name is easy to guess or find online." },
  { options: ["Jan1985Jan", "blue-Train-Mango-lamp-47", "1q2w3e4r"], best: 1, why: "Birth dates and keyboard patterns are tried first by attackers." },
  { options: ["MyCompany2025", "tulip-Radar-sock-ninety-Ledger", "Company#1"], best: 1, why: "Anything built from the company name is a top guess. Unrelated words are not." },
  { options: ["Ilovepizza!", "vK9#mT2$pQ7!zL4w", "pizza1pizza2"], best: 1, why: "Short phrases with one symbol are cracked quickly. Random and long is best, stored in a password manager." },
  { options: ["Winter!Winter!Winter!", "hammer-Saturn-quiet-Orchid-58", "Winter2026"], best: 1, why: "Repeating a word adds length but not unpredictability. Four or more random words do." },
  { options: ["admin@123", "R7!kd2$Lq9#vTe5n", "Welcome123!"], best: 1, why: "Default-style passwords such as admin or welcome are tried on every account." },
  { options: ["Football#99", "ocean-Pixel-canyon-Velvet-12", "Qwerty!2026"], best: 1, why: "Sports, keyboard walks and the current year are all common patterns." }
];

function playPasswordForge(root, ctx) {
  const ui = shell(root, ctx, "Round 1 of 8 · Score 0");
  const rounds = shuffle(FORGE_ROUNDS).map((round) => {
    const order = shuffle(round.options.map((text, index) => ({ text, good: index === round.best })));
    return { order, why: round.why };
  });
  let index = 0;
  let score = 0;
  let right = 0;

  const draw = () => {
    const round = rounds[index];
    ui.badge(`Round ${index + 1} of ${rounds.length} · Score ${score}`);
    ui.stage.innerHTML = `
      <div class="mono-label">Which password would be hardest to crack?</div>
      <div class="forge-options" data-options></div>
      <p class="forge-why" data-why role="status" aria-live="polite"></p>
      <button class="secondary-btn" type="button" data-next hidden>${index + 1 === rounds.length ? "See results" : "Next"}</button>
    `;
    const box = ui.stage.querySelector("[data-options]");
    const why = ui.stage.querySelector("[data-why]");
    const next = ui.stage.querySelector("[data-next]");
    const started = Date.now();
    round.order.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "block-btn forge-option";
      button.textContent = option.text;
      button.addEventListener("click", () => {
        box.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        if (option.good) {
          const bonus = Math.max(0, 10 - Math.floor((Date.now() - started) / 1000));
          score += 10 + bonus;
          right += 1;
          button.classList.add("active");
          why.textContent = `Correct. ${round.why}`;
        } else {
          button.classList.add("wrong-shake");
          why.textContent = `Not quite. ${round.why}`;
          [...box.children].forEach((b, i) => { if (round.order[i].good) b.classList.add("active"); });
        }
        ui.badge(`Round ${index + 1} of ${rounds.length} · Score ${score}`);
        next.hidden = false;
        next.focus();
      });
      box.append(button);
    });
    next.addEventListener("click", () => {
      index += 1;
      if (index >= rounds.length) {
        results(root, ctx, {
          id: "forge", score,
          title: right >= 7 ? "Master forger" : right >= 5 ? "Solid instincts" : "Keep forging",
          message: `You picked the strongest password ${right} of ${rounds.length} times.`,
          detail: "Rule of thumb: long, random, unique for every account, and kept in a password manager."
        });
      } else draw();
    });
  };
  draw();
}

/* ---------- Desk Sweep (hidden object) ---------- */
const DESK_ITEMS = [
  { label: "Sticky note with a password on the monitor", risky: true, tip: "Passwords on notes get photographed or found. Use a password manager." },
  { label: "Screen left unlocked while away", risky: true, tip: "Lock your screen every time you step away (Windows+L or Ctrl+Cmd+Q)." },
  { label: "USB stick found in the parking lot", risky: true, tip: "Unknown USB drives can carry malware. Hand them to IT." },
  { label: "Printout of customer records in the open", risky: true, tip: "Sensitive paper belongs in a locked drawer or the shredder." },
  { label: "Badge lying on the desk, unattended", risky: true, tip: "A lost or loose badge lets someone else walk in as you." },
  { label: "Whiteboard with Wi-Fi password still written on it", risky: true, tip: "Erase credentials after meetings." },
  { label: "Locked laptop with a privacy screen", safe: true, tip: "Locked and shielded. Nothing to fix here." },
  { label: "Shredder bin next to the printer", safe: true, tip: "A shredder is part of good data hygiene." },
  { label: "Company-approved password manager open in the dock", safe: true, tip: "That is the right tool for passwords." },
  { label: "Visitor sign-in sheet with escort badges", safe: true, tip: "Escorted visitors with badges are handled correctly." },
  { label: "Software update notice scheduled for tonight", safe: true, tip: "Scheduled updates keep devices patched." },
  { label: "Notebook with meeting notes and no secrets in it", safe: true, tip: "Ordinary notes are fine. Secrets are the issue." }
];

function playDeskSweep(root, ctx) {
  const ui = shell(root, ctx, "Time 45 · Score 0");
  const items = shuffle(DESK_ITEMS).map((item) => ({ ...item, risky: Boolean(item.risky), done: false }));
  const totalRisky = items.filter((item) => item.risky).length;
  let secured = 0;
  let mistakes = 0;
  let left = 45;
  let ended = false;

  ui.stage.innerHTML = `
    <div class="mono-label">Click everything on this desk that puts the company at risk. Careful: safe items cost you points.</div>
    <div class="sweep-grid" data-grid></div>
    <p class="forge-why" data-tip role="status" aria-live="polite"></p>
  `;
  const grid = ui.stage.querySelector("[data-grid]");
  const tip = ui.stage.querySelector("[data-tip]");
  const score = () => Math.max(0, secured * 20 - mistakes * 10);

  const finish = () => {
    if (ended) return;
    ended = true;
    clearInterval(timer);
    const bonus = secured === totalRisky ? left * 2 : 0;
    results(root, ctx, {
      id: "sweep", score: score() + bonus,
      title: secured === totalRisky ? "Clean desk!" : "Time's up",
      message: `You secured ${secured} of ${totalRisky} hazards with ${mistakes} wrong click${mistakes === 1 ? "" : "s"}.`,
      detail: items.filter((item) => item.risky && !item.done).map((item) => item.tip).join(" ")
    });
  };

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "block-btn sweep-item";
    button.textContent = item.label;
    button.addEventListener("click", () => {
      if (item.done || ended) return;
      item.done = true;
      button.disabled = true;
      if (item.risky) {
        secured += 1;
        button.classList.add("active");
        tip.textContent = `Secured. ${item.tip}`;
      } else {
        mistakes += 1;
        button.classList.add("wrong-shake");
        tip.textContent = `That one was fine. ${item.tip}`;
      }
      ui.badge(`Time ${left} · Score ${score()}`);
      if (secured === totalRisky) finish();
    });
    grid.append(button);
  });

  const timer = setInterval(() => {
    left -= 1;
    ui.badge(`Time ${Math.max(left, 0)} · Score ${score()}`);
    if (left <= 0) finish();
  }, 1000);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(grid)) {
      clearInterval(timer);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ---------- Code Breaker (logic) ---------- */
function playCodeBreaker(root, ctx) {
  const ui = shell(root, ctx, "Guesses left: 8");
  const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const maxGuesses = 8;
  let guesses = [];
  let current = "";

  const draw = () => {
    ui.badge(`Guesses left: ${maxGuesses - guesses.length}`);
    ui.stage.innerHTML = `
      <div class="mono-label">Crack the 4-digit PIN. No digit repeats. Green = right digit, right place. Yellow = right digit, wrong place.</div>
      <div class="breaker-history" data-history></div>
      <div class="breaker-entry" data-entry aria-live="polite">${current.padEnd(4, "•").split("").join(" ")}</div>
      <div class="breaker-pad" data-pad></div>
    `;
    const history = ui.stage.querySelector("[data-history]");
    guesses.forEach((guess) => {
      const row = document.createElement("div");
      row.className = "breaker-row";
      guess.text.split("").forEach((digit, i) => {
        const cell = document.createElement("span");
        cell.className = `breaker-cell ${guess.marks[i]}`;
        cell.textContent = digit;
        row.append(cell);
      });
      history.append(row);
    });
    const pad = ui.stage.querySelector("[data-pad]");
    const add = (label, handler, extra = "") => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `block-btn ${extra}`;
      button.textContent = label;
      button.addEventListener("click", handler);
      pad.append(button);
    };
    for (let d = 1; d <= 9; d += 1) add(String(d), () => press(String(d)));
    add("Clear", () => { current = ""; draw(); });
    add("0", () => press("0"));
    add("Enter", submit, "active");
  };

  const press = (digit) => {
    if (current.length < 4 && !current.includes(digit)) current += digit;
    draw();
  };

  const submit = () => {
    if (current.length !== 4) return;
    const marks = current.split("").map((digit, i) =>
      Number(digit) === digits[i] ? "hit" : digits.includes(Number(digit)) ? "near" : "miss"
    );
    guesses.push({ text: current, marks });
    const won = marks.every((mark) => mark === "hit");
    current = "";
    if (won || guesses.length >= maxGuesses) {
      const score = won ? (maxGuesses - guesses.length + 1) * 15 : 0;
      results(root, ctx, {
        id: "breaker", score,
        title: won ? "PIN cracked" : "Locked out",
        message: won
          ? `You cracked it in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`
          : `The PIN was ${digits.join("")}.`,
        detail: "A 4-digit PIN has only 10,000 combinations, so attackers can try them all in seconds. Use long passphrases and turn on lockouts and multi-factor authentication."
      });
      return;
    }
    draw();
  };
  draw();
}

/* ---------- Cyber Rush (trivia sprint) ---------- */
const RUSH_BANK = [
  { q: "What does MFA add to a password?", a: ["A second proof of identity", "A longer password", "A faster login"], good: 0 },
  { q: "An email from your CEO urgently asks for gift cards. What is it most likely?", a: ["A real request", "Business email compromise", "A system test"], good: 1 },
  { q: "Which link is safest to click?", a: ["A shortened link in a text", "A link you typed from the official site", "A link in an unexpected attachment"], good: 1 },
  { q: "What should you do with a USB drive you find?", a: ["Plug it in to see whose it is", "Give it to IT or security", "Keep it"], good: 1 },
  { q: "What is ransomware?", a: ["Software that locks files until you pay", "A type of firewall", "A password manager"], good: 0 },
  { q: "Public Wi-Fi at a cafe is best used with…", a: ["No protection", "A VPN and HTTPS sites", "Password sharing"], good: 1 },
  { q: "Phishing over text messages is called…", a: ["Smishing", "Vishing", "Spoofing"], good: 0 },
  { q: "Why install software updates quickly?", a: ["They fix known security holes", "They make the screen brighter", "They delete old files"], good: 0 },
  { q: "Best way to keep many unique passwords?", a: ["Reuse one strong one", "A password manager", "Write them on a note"], good: 1 },
  { q: "A caller asks for your verification code. You…", a: ["Read it out", "Refuse and report", "Ask them to hold"], good: 1 },
  { q: "'Tailgating' means…", a: ["Following someone through a secure door", "Sending spam", "Cracking a password"], good: 0 },
  { q: "Where should you report a suspected phishing email?", a: ["Delete and tell no one", "Your security team or the report button", "Reply to ask if it's real"], good: 1 },
  { q: "Which is personal data that needs extra care?", a: ["A company logo", "A customer's ID number", "A public press release"], good: 1 },
  { q: "A site's address starts with https://. That means…", a: ["The site is guaranteed safe", "The connection is encrypted", "It is run by your company"], good: 1 }
];

function playCyberRush(root, ctx) {
  const ui = shell(root, ctx, "Question 1 · Score 0");
  const questions = shuffle(RUSH_BANK).slice(0, 10).map((item) => {
    const order = shuffle(item.a.map((text, i) => ({ text, good: i === item.good })));
    return { q: item.q, order };
  });
  let index = 0;
  let score = 0;
  let streak = 0;
  let right = 0;
  let timer = null;

  const advance = () => {
    clearInterval(timer);
    index += 1;
    if (index >= questions.length) {
      results(root, ctx, {
        id: "rush", score,
        title: right >= 9 ? "Cyber champion" : right >= 6 ? "Sharp defender" : "Training time",
        message: `${right} of ${questions.length} correct.`,
        detail: "Streaks multiply your points, so a run of right answers is worth far more than a few lucky ones."
      });
    } else draw();
  };

  const draw = () => {
    const item = questions[index];
    let left = 12;
    ui.badge(`Question ${index + 1} of ${questions.length} · Score ${score}`);
    ui.stage.innerHTML = `
      <div class="mono-label" data-clock>${left}s · Streak ${streak}</div>
      <h4 class="rush-question">${esc(item.q)}</h4>
      <div class="forge-options" data-options></div>
      <p class="forge-why" data-note role="status" aria-live="polite"></p>
    `;
    const clock = ui.stage.querySelector("[data-clock]");
    const box = ui.stage.querySelector("[data-options]");
    const note = ui.stage.querySelector("[data-note]");
    let answered = false;
    const lock = (label) => {
      answered = true;
      clearInterval(timer);
      box.querySelectorAll("button").forEach((b, i) => {
        b.disabled = true;
        if (item.order[i].good) b.classList.add("active");
      });
      note.textContent = label;
      setTimeout(advance, 1400);
    };
    item.order.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "block-btn forge-option";
      button.textContent = option.text;
      button.addEventListener("click", () => {
        if (answered) return;
        if (option.good) {
          streak += 1;
          right += 1;
          score += 10 * Math.min(streak, 5) + left;
          lock(`Correct! Streak ${streak}.`);
        } else {
          streak = 0;
          button.classList.add("wrong-shake");
          lock("Not quite. The right answer is highlighted.");
        }
        ui.badge(`Question ${index + 1} of ${questions.length} · Score ${score}`);
      });
      box.append(button);
    });
    timer = setInterval(() => {
      left -= 1;
      clock.textContent = `${Math.max(left, 0)}s · Streak ${streak}`;
      if (left <= 0 && !answered) {
        streak = 0;
        lock("Time's up. The right answer is highlighted.");
      }
    }, 1000);
  };
  draw();
}

/* ---------- Missions: story lessons with health, XP and a recap ---------- */
function playMission(mission) {
  return (root, ctx) => {
    const ui = shell(root, ctx, "Health ♥♥♥ · XP 0");
    let health = 3;
    let xp = 0;
    let sceneId = "start";
    const hearts = () => "♥".repeat(Math.max(health, 0)) + "♡".repeat(3 - Math.max(health, 0));
    const badge = () => ui.badge(`Health ${hearts()} · XP ${xp}`);

    const finish = (won) => {
      const learned = mission.recap.map((line) => `• ${line}`).join(" ");
      if (won) {
        window.grapheneAuth?.recordMissionComplete?.(mission.id).catch(() => {});
        document.dispatchEvent(new CustomEvent("mission-complete", { detail: { id: mission.id } }));
      }
      results(root, ctx, {
        id: mission.id, score: xp + (won ? health * 20 : 0),
        title: won ? `Mission complete: ${mission.title}` : "Mission failed",
        message: won ? mission.win : mission.lose,
        detail: `What you learned: ${learned}`
      });
    };

    const draw = (feedback = "") => {
      const scene = mission.scenes[sceneId];
      badge();
      ui.stage.innerHTML = `
        <div class="mono-label">${esc(mission.title)} · ${esc(scene.place)}</div>
        ${feedback ? `<div class="chat-note" role="status">${esc(feedback)}</div>` : ""}
        <p class="mission-text">${esc(scene.text)}</p>
        <div class="chat-choices" data-choices></div>
      `;
      const box = ui.stage.querySelector("[data-choices]");
      scene.choices.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "block-btn chat-choice";
        button.textContent = choice.text;
        button.addEventListener("click", () => {
          health += choice.hp || 0;
          xp += choice.xp || 0;
          if (health <= 0) {
            badge();
            ui.stage.innerHTML = `<div class="chat-note">${esc(choice.note)}</div>`;
            setTimeout(() => finish(false), 1200);
            return;
          }
          if (choice.next === "WIN") {
            badge();
            finish(true);
            return;
          }
          sceneId = choice.next;
          draw(choice.note);
        });
        box.append(button);
      });
    };
    draw();
  };
}

const MISSIONS = [
  {
    id: "mission-phish", title: "The Phishing Heist", duration: "~4 min",
    blurb: "It's Monday morning and your inbox is full. Decide what to open, what to report and what to ignore before the attacker gets in.",
    win: "You spotted the lure, reported it, and kept the attacker out.",
    lose: "The attacker got in through a single click. Replay and look for the warning signs.",
    recap: [
      "Check the sender address and the real link destination, not the display name.",
      "Urgency and unusual requests are red flags. Verify by another channel.",
      "Report suspicious email instead of just deleting it, so others are warned."
    ],
    scenes: {
      start: { place: "Your desk, 8:55 AM", text: "A new email from 'Payroll Team' says: 'Your direct deposit failed. Confirm your login in the next hour or lose this paycheck.' The sender is payroll-support@paycheck-secure.co.", choices: [
        { text: "Click the link and sign in right away.", next: "clicked", hp: -1, xp: 0, note: "Urgency plus a login link is the classic hook." },
        { text: "Hover over the link and check where it really goes.", next: "hover", xp: 20, note: "Good habit: inspect before you click." },
        { text: "Call payroll on the number in the employee handbook.", next: "call", xp: 30, note: "Independent verification beats any email." }
      ] },
      clicked: { place: "A fake login page", text: "The page asks for your email and password. The address bar shows paycheck-secure.co.", choices: [
        { text: "Type in your credentials anyway.", next: "start", hp: -2, xp: 0, note: "Credentials entered. Attackers now have your account." },
        { text: "Close the tab and tell IT security right now.", next: "report", xp: 20, note: "Quick reporting limits the damage." }
      ] },
      hover: { place: "Your desk", text: "The link points to paycheck-secure.co, not your company's payroll site. The email also greeted you as 'Dear user'.", choices: [
        { text: "Reply asking if it is real.", next: "report", hp: -1, xp: 0, note: "Replying confirms your address is active and can invite more attacks." },
        { text: "Use the report-phishing button.", next: "report", xp: 30, note: "Reporting protects the whole company." }
      ] },
      call: { place: "On the phone with Payroll", text: "Payroll says nothing failed and they never send login links. They ask if you got an email.", choices: [
        { text: "Forward it to the security team and delete it.", next: "report", xp: 30, note: "Forwarding to security gives them what they need." },
        { text: "Just delete it.", next: "report", xp: 10, note: "Safe for you, but others may still be tricked." }
      ] },
      report: { place: "Security team chat", text: "Security thanks you. Three coworkers already clicked the same email, and because you reported it they can reset those passwords before anything is lost. A new message arrives: your manager asks you to buy gift cards urgently.", choices: [
        { text: "Buy the gift cards, it's your boss.", next: "start", hp: -2, xp: 0, note: "Gift-card requests are a well-known scam, even when they look like they come from the boss." },
        { text: "Call your manager on a known number to verify.", next: "WIN", xp: 40, note: "Verified out of band. It was a fake." },
        { text: "Report it too and ignore the request.", next: "WIN", xp: 30, note: "Reported and ignored. Good call." }
      ] }
    }
  },
  {
    id: "mission-ransom", title: "Ransomware Monday", duration: "~5 min",
    blurb: "Files are turning into gibberish across the office. Make the first moves of an incident response, fast, with the clock running.",
    win: "You contained the spread and handed the response to the right people.",
    lose: "The malware spread across the network. Replay and focus on containing first.",
    recap: [
      "Disconnect the affected device from the network first. Do not power it off.",
      "Report immediately to IT or security so the response plan can start.",
      "Never pay or negotiate on your own. Backups and the response team come first."
    ],
    scenes: {
      start: { place: "Accounting office, 9:12 AM", text: "A coworker's screen shows: 'Your files are encrypted. Pay 2 BTC.' The shared drive is slowing down.", choices: [
        { text: "Unplug the network cable or turn off Wi-Fi on that PC.", next: "contain", xp: 30, note: "Isolating the machine stops the spread." },
        { text: "Restart the computer and hope it clears.", next: "restart", hp: -1, xp: 0, note: "Restarting can destroy evidence and does not remove the malware." },
        { text: "Pay now to get the files back.", next: "start", hp: -3, xp: 0, note: "Payment funds attackers and does not guarantee recovery." }
      ] },
      restart: { place: "The same PC", text: "The note is back and more shared files are changing. People are crowding around.", choices: [
        { text: "Disconnect the PC from the network and call IT.", next: "contain", xp: 20, note: "Late, but containment still helps." },
        { text: "Keep working on other machines.", next: "start", hp: -2, xp: 0, note: "Other machines on the same network are at risk." }
      ] },
      contain: { place: "Accounting office", text: "The machine is offline. A coworker wants to plug in a USB drive to 'save the important files'.", choices: [
        { text: "Stop them. Saved files may be infected, and IT needs a clean process.", next: "report", xp: 30, note: "Good call. New devices could spread it." },
        { text: "Let them. Better safe than sorry.", next: "start", hp: -1, xp: 0, note: "A USB can carry the infection to other systems." }
      ] },
      report: { place: "IT help desk", text: "IT asks what you saw first and whether anyone opened an attachment this morning.", choices: [
        { text: "Share the facts: time, who, what was on screen, and what you did.", next: "WIN", xp: 40, note: "Clear facts speed up recovery." },
        { text: "Say you don't remember and leave.", next: "start", hp: -1, xp: 0, note: "Details matter. Stay and share what you know." }
      ] }
    }
  },
  {
    id: "mission-visitor", title: "The Unexpected Visitor", duration: "~4 min",
    blurb: "Someone in a high-vis vest says they're here for the network. Decide who gets through the door and what they can touch.",
    win: "You kept the building secure without being rude.",
    lose: "An unverified visitor got access. Replay and check identity first.",
    recap: [
      "Verify visitors with the person they claim to be meeting, not with the visitor.",
      "Do not hold secure doors for strangers. Politely direct them to reception.",
      "Report social engineering attempts even when they fail."
    ],
    scenes: {
      start: { place: "Side entrance, 10:30 AM", text: "A man in a high-vis vest and no badge says: 'I'm the network contractor. I'm late, can you hold the door? IT sent me.'", choices: [
        { text: "Hold the door. He looks official.", next: "inside", hp: -1, xp: 0, note: "Looking official is easy to fake." },
        { text: "Politely direct him to the front desk.", next: "desk", xp: 30, note: "Reception is the right place to verify." },
        { text: "Ask who in IT sent him and call them to confirm.", next: "desk", xp: 30, note: "Verify by calling a known number." }
      ] },
      inside: { place: "Server closet hallway", text: "He walks toward the server room and asks for the keypad code 'to save time'.", choices: [
        { text: "Tell him the code.", next: "start", hp: -2, xp: 0, note: "Door codes are not for sharing." },
        { text: "Say you can't and walk him back to reception.", next: "desk", xp: 20, note: "Recovered well." }
      ] },
      desk: { place: "Reception", text: "Reception cannot find any appointment. The man says he'll just 'wait in a conference room'.", choices: [
        { text: "Let him wait unescorted.", next: "start", hp: -2, xp: 0, note: "Unescorted visitors can wander or plug in devices." },
        { text: "Ask him to wait in the lobby while reception confirms with IT.", next: "wrap", xp: 30, note: "Controlled and polite." }
      ] },
      wrap: { place: "Reception, a bit later", text: "IT confirms no contractor was booked. The man leaves quickly. Reception asks what you'd like to do.", choices: [
        { text: "Report it to security so they can brief the team.", next: "WIN", xp: 40, note: "Reports help catch repeated attempts." },
        { text: "Forget it, he left.", next: "WIN", xp: 10, note: "You were safe, but reports keep others safe too." }
      ] }
    }
  }
];

const missionGames = MISSIONS.map((mission) => ({
  id: mission.id, title: mission.title, icon: "Fish", duration: mission.duration, tag: "MISSION",
  blurb: mission.blurb, demo: Boolean(mission.demo), play: playMission(mission)
}));

const newGames = [
  { id: "forge", title: "Password Forge", icon: "KeyRound", duration: "~2 min", tag: "PUZZLE", blurb: "Pick the strongest password in each round. Faster picks earn bonus points.", play: playPasswordForge },
  { id: "sweep", title: "Desk Sweep", icon: "Zap", duration: "~1 min", tag: "SEARCH", blurb: "Spot every security hazard on a messy desk before time runs out, without flagging the safe stuff.", play: playDeskSweep },
  { id: "breaker", title: "Code Breaker", icon: "KeyRound", duration: "~3 min", tag: "LOGIC", blurb: "Crack a hidden 4-digit PIN from color hints and see why short PINs are weak.", play: playCodeBreaker },
  { id: "rush", title: "Cyber Rush", icon: "Zap", duration: "~2 min", tag: "TRIVIA", blurb: "Ten fast questions with a streak multiplier. Answer before the clock runs out.", play: playCyberRush },
  ...missionGames
];

for (const game of newGames) {
  if (!extraGames.some((existing) => existing.id === game.id)) extraGames.push(game);
}
window.graphenexMissionTotal = MISSIONS.length;
window.graphenexBest = getBest;
document.dispatchEvent(new CustomEvent("games-ready"));
