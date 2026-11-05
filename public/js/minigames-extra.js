/* Extra mini games. Each game has play(root, ctx): it draws into root and calls ctx.finish() with its result.
   The hub in portal-access.html lists these next to the original drills. */

const BEST_PREFIX = "graphenex.gameBest.";

function bestKey(id) {
  const uid = window.grapheneAuth?.getCurrentUser?.()?.uid || "guest";
  return `${BEST_PREFIX}${uid}.${id}`;
}

export function getBest(id) {
  try {
    return Number(localStorage.getItem(bestKey(id))) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(id, score) {
  const previous = getBest(id);
  if (score > previous) {
    try {
      localStorage.setItem(bestKey(id), String(score));
    } catch {
      // Best scores are a convenience only.
    }
  }
  return Math.max(previous, score);
}

export function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function shell(root, ctx, badge) {
  root.innerHTML = `
    <div class="game-shell-header">
      <button class="back-link" type="button" data-back>← All mini games</button>
      <div class="score-badge" data-badge>${badge}</div>
    </div>
    <div class="game-stage" data-stage></div>
  `;
  root.querySelector("[data-back]").addEventListener("click", () => ctx.back());
  return {
    stage: root.querySelector("[data-stage]"),
    badge: (text) => { root.querySelector("[data-badge]").textContent = text; }
  };
}

export function results(root, ctx, { id, score, title, message, detail }) {
  const best = saveBest(id, score);
  root.innerHTML = `
    <div class="game-shell-header">
      <button class="back-link" type="button" data-back>← All mini games</button>
      <div class="score-badge">Best: ${best}</div>
    </div>
    <div class="results-panel">
      <h3>${title}</h3>
      <p>${message}</p>
      ${detail ? `<p>${detail}</p>` : ""}
      <p class="mono-label">Score ${score}${score >= best && score > 0 ? " · New best!" : ""}</p>
      <div class="results-actions">
        <button class="secondary-btn" type="button" data-again>Play again</button>
        <button class="outline-btn" type="button" data-back>Back to mini games</button>
      </div>
    </div>
  `;
  root.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => ctx.back()));
  root.querySelector("[data-again]").addEventListener("click", () => ctx.replay());
}

/* ---------- Packet Patrol (arcade) ---------- */
const PACKETS = [
  { label: "HTTPS request to the web server", bad: false },
  { label: "Signed software update", bad: false },
  { label: "Email from a known coworker", bad: false },
  { label: "Cloud backup upload", bad: false },
  { label: "DNS lookup for your calendar app", bad: false },
  { label: "Port scan from an unknown address", bad: true },
  { label: "Unknown .exe attachment", bad: true },
  { label: "40 failed logins in a minute", bad: true },
  { label: "Data upload to a strange country", bad: true },
  { label: "Link to a look-alike bank site", bad: true }
];

function playPacketPatrol(root, ctx) {
  const ROUND_SECONDS = 45;
  const ui = shell(root, ctx, "Score: 0");
  ui.stage.innerHTML = `
    <div class="mono-label">Block the bad traffic. Let the safe traffic through.</div>
    <div class="patrol-hud">
      <span data-time>${ROUND_SECONDS}s</span>
      <div class="patrol-health" role="progressbar" aria-label="Network health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span style="width:100%"></span></div>
    </div>
    <div class="patrol-lane" data-lane></div>
    <p class="patrol-hint" role="status" aria-live="polite" data-hint>Click a packet to block it.</p>
  `;
  const lane = ui.stage.querySelector("[data-lane]");
  const healthBar = ui.stage.querySelector(".patrol-health");
  const healthFill = healthBar.querySelector("span");
  const timeLabel = ui.stage.querySelector("[data-time]");
  const hint = ui.stage.querySelector("[data-hint]");

  let score = 0;
  let health = 100;
  let blocked = 0;
  let leaked = 0;
  let wrong = 0;
  let packets = [];
  let started = performance.now();
  let lastSpawn = 0;
  let previous = started;
  let frame = 0;
  let done = false;

  const update = () => {
    ui.badge(`Score: ${score}`);
    healthFill.style.width = `${Math.max(0, health)}%`;
    healthBar.setAttribute("aria-valuenow", String(Math.max(0, Math.round(health))));
  };

  const spawn = (elapsed) => {
    const spec = PACKETS[Math.floor(Math.random() * PACKETS.length)];
    const node = document.createElement("button");
    node.type = "button";
    node.className = `patrol-packet ${spec.bad ? "" : "safe-looking"}`;
    node.textContent = spec.label;
    const packet = {
      node, spec, x: -0.3, y: Math.random() * 0.78,
      speed: 0.11 + Math.min(0.14, elapsed / 300)
    };
    node.addEventListener("click", () => {
      if (done || !packets.includes(packet)) return;
      packets = packets.filter((item) => item !== packet);
      node.remove();
      if (spec.bad) {
        score += 10;
        blocked += 1;
        hint.textContent = `Blocked: ${spec.label}. Good catch.`;
      } else {
        score = Math.max(0, score - 15);
        health -= 8;
        wrong += 1;
        hint.textContent = `Oops, "${spec.label}" was legitimate. Blocking real traffic hurts the business.`;
      }
      update();
    });
    lane.append(node);
    packets.push(packet);
  };

  const finish = () => {
    done = true;
    cancelAnimationFrame(frame);
    const finalScore = Math.max(0, score + Math.round(health));
    const survived = health > 0;
    results(root, ctx, {
      id: "packet",
      score: finalScore,
      title: survived ? "Shift complete" : "Network breached",
      message: survived
        ? "The network held. Your filtering instincts are paying off."
        : "Too many threats got through. Slow down on the scary-looking ones and look at where they come from.",
      detail: `Blocked ${blocked} threats, let ${leaked} slip by, wrongly blocked ${wrong} safe packets.`
    });
  };

  const loop = (now) => {
    if (done) return;
    const elapsed = (now - started) / 1000;
    const delta = Math.min(0.1, (now - previous) / 1000);
    previous = now;
    timeLabel.textContent = `${Math.max(0, Math.ceil(ROUND_SECONDS - elapsed))}s`;
    if (elapsed - lastSpawn > Math.max(0.55, 1.3 - elapsed / 60)) {
      lastSpawn = elapsed;
      spawn(elapsed);
    }
    packets.forEach((packet) => {
      packet.x += packet.speed * delta;
      packet.node.style.left = `${packet.x * 100}%`;
      packet.node.style.top = `${packet.y * 100}%`;
    });
    packets = packets.filter((packet) => {
      if (packet.x < 1) return true;
      packet.node.remove();
      if (packet.spec.bad) {
        health -= 15;
        leaked += 1;
        hint.textContent = `A threat got through: ${packet.spec.label}.`;
        update();
      }
      return false;
    });
    if (health <= 0 || elapsed >= ROUND_SECONDS) {
      finish();
      return;
    }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame((now) => { started = now; previous = now; loop(now); });
  ctx.onLeave(() => { done = true; cancelAnimationFrame(frame); });
}

/* ---------- Threat Match (memory) ---------- */
const PAIRS = [
  ["Phishing email", "Report it and don't click"],
  ["Ransomware", "Offline backups"],
  ["Weak, reused passwords", "Password manager + MFA"],
  ["Unpatched software", "Automatic updates"],
  ["Snooping on public Wi-Fi", "A trusted VPN"],
  ["Lost or stolen laptop", "Full-disk encryption"]
];

function playThreatMatch(root, ctx) {
  const ui = shell(root, ctx, "Moves: 0");
  const cards = shuffle(PAIRS.flatMap(([threat, defense], pair) => [
    { pair, text: threat, kind: "Threat" },
    { pair, text: defense, kind: "Defense" }
  ]));
  ui.stage.innerHTML = `
    <div class="mono-label">Flip two cards to match each threat with its best defense.</div>
    <div class="match-grid" data-grid></div>
    <p class="patrol-hint" role="status" aria-live="polite" data-hint></p>
  `;
  const grid = ui.stage.querySelector("[data-grid]");
  const hint = ui.stage.querySelector("[data-hint]");
  let open = [];
  let moves = 0;
  let matched = 0;
  let locked = false;

  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "match-card";
    button.setAttribute("aria-label", "Hidden card");
    button.innerHTML = '<span class="match-back">?</span><span class="match-front"></span>';
    button.querySelector(".match-front").textContent = card.text;
    button.addEventListener("click", () => {
      if (locked || button.classList.contains("flipped") || button.classList.contains("matched")) return;
      button.classList.add("flipped");
      button.setAttribute("aria-label", `${card.kind}: ${card.text}`);
      open.push({ card, button });
      if (open.length < 2) return;
      moves += 1;
      ui.badge(`Moves: ${moves}`);
      const [first, second] = open;
      open = [];
      if (first.card.pair === second.card.pair && first.card.kind !== second.card.kind) {
        matched += 1;
        [first, second].forEach(({ button: item }) => item.classList.add("matched"));
        hint.textContent = `Match: ${PAIRS[first.card.pair][0]} is stopped by ${PAIRS[first.card.pair][1].toLowerCase()}.`;
        if (matched === PAIRS.length) {
          const score = Math.max(10, 120 - Math.max(0, moves - PAIRS.length) * 8);
          setTimeout(() => results(root, ctx, {
            id: "match",
            score,
            title: "All threats matched",
            message: moves <= 8 ? "Sharp memory and sharp security knowledge." : "Every threat has a defense. Try for fewer moves.",
            detail: `You finished in ${moves} moves.`
          }), 700);
        }
        return;
      }
      locked = true;
      hint.textContent = "Not a pair. Remember where those were.";
      setTimeout(() => {
        [first, second].forEach(({ button: item }) => {
          item.classList.remove("flipped");
          item.setAttribute("aria-label", "Hidden card");
        });
        locked = false;
      }, 900);
    });
    grid.append(button);
  });
}

/* ---------- Incident Response (sequence) ---------- */
const INCIDENTS = [
  {
    title: "Ransomware is encrypting files on a shared drive",
    steps: [
      "Confirm the alert and scope what is affected",
      "Isolate infected devices from the network",
      "Remove the malware and close the way in",
      "Restore data from clean backups",
      "Notify leadership, customers and authorities as required",
      "Review what happened and fix the gaps"
    ],
    why: [
      "Confirm first so you act on facts, not a false alarm.",
      "Contain next, before it spreads to more machines.",
      "Eradicate the cause before restoring, or it comes straight back.",
      "Recover only from backups you know are clean.",
      "Report once you know the scope and have things under control.",
      "Finish with lessons learned so it doesn't happen again."
    ]
  },
  {
    title: "A coworker's email account sent phishing links to everyone",
    steps: [
      "Verify the account was really compromised",
      "Reset the password and sign out all sessions",
      "Remove forwarding rules and malicious messages",
      "Warn recipients and bring the account back online with MFA",
      "Document the incident and who was affected",
      "Run refresher phishing training"
    ],
    why: [
      "Verify the compromise before locking anyone out.",
      "Cut off the attacker's access immediately.",
      "Attackers often leave hidden rules behind. Clean them out.",
      "Tell people not to click, then restore access safely with MFA.",
      "Record it while details are fresh.",
      "Train so the next lure gets reported."
    ]
  }
];

function playIncidentResponse(root, ctx) {
  const ui = shell(root, ctx, "Round 1 / 2");
  let round = 0;
  let mistakes = 0;
  const startedAt = performance.now();

  const draw = () => {
    const incident = INCIDENTS[round];
    const order = shuffle(incident.steps.map((step, index) => ({ step, index })));
    let next = 0;
    ui.badge(`Round ${round + 1} / ${INCIDENTS.length} · Mistakes: ${mistakes}`);
    ui.stage.innerHTML = `
      <div class="mono-label">Incident</div>
      <h3 class="incident-title">${incident.title}</h3>
      <p>Tap the steps in the order a responder should do them.</p>
      <div class="incident-layout">
        <ol class="incident-done" data-done aria-label="Steps in order"></ol>
        <div class="incident-pool" data-pool></div>
      </div>
      <p class="patrol-hint" role="status" aria-live="polite" data-hint></p>
    `;
    const done = ui.stage.querySelector("[data-done]");
    const pool = ui.stage.querySelector("[data-pool]");
    const hint = ui.stage.querySelector("[data-hint]");
    order.forEach(({ step, index }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "block-btn incident-step";
      button.textContent = step;
      button.addEventListener("click", () => {
        if (index !== next) {
          mistakes += 1;
          ui.badge(`Round ${round + 1} / ${INCIDENTS.length} · Mistakes: ${mistakes}`);
          button.classList.add("wrong-shake");
          setTimeout(() => button.classList.remove("wrong-shake"), 400);
          hint.textContent = "Not yet. Think about what has to be true before that step.";
          return;
        }
        const item = document.createElement("li");
        item.innerHTML = `<strong></strong><span></span>`;
        item.querySelector("strong").textContent = step;
        item.querySelector("span").textContent = incident.why[index];
        done.append(item);
        button.remove();
        hint.textContent = "";
        next += 1;
        if (next === incident.steps.length) {
          round += 1;
          setTimeout(() => (round < INCIDENTS.length ? draw() : finish()), 1200);
        }
      });
      pool.append(button);
    });
  };

  const finish = () => {
    const seconds = Math.round((performance.now() - startedAt) / 1000);
    const score = Math.max(10, 150 - mistakes * 12 - Math.max(0, seconds - 60));
    results(root, ctx, {
      id: "incident",
      score,
      title: mistakes === 0 ? "Flawless response" : "Incident contained",
      message: mistakes === 0
        ? "You ran both incidents in the right order with no wrong turns."
        : "Contain before you clean, and clean before you restore.",
      detail: `${mistakes} wrong ${mistakes === 1 ? "pick" : "picks"} in ${seconds} seconds.`
    });
  };
  draw();
}

/* ---------- Social Engineer Chat (scenario) ---------- */
const CHAT = {
  start: {
    caller: "Hi, this is Dana from IT support. We're seeing strange activity on your account and I need to fix it right now.",
    choices: [
      { text: "Okay, what do you need from me?", next: "ask", points: -10, note: "You're now following their script. Slow down before cooperating." },
      { text: "Which ticket number is this for?", next: "ticket", points: 15, note: "Asking for verification is the right first move." },
      { text: "I'll call you back on the help desk number.", next: "callback", points: 25, note: "Hanging up and calling back on a known number is the gold standard." }
    ]
  },
  ask: {
    caller: "Just read me the 6-digit code that was just texted to you. It's quick, and then your account is safe.",
    choices: [
      { text: "Sure, it's 482913.", next: "bad", points: -40, note: "That code is your second lock. Anyone who asks for it is not support." },
      { text: "Wait, why would IT need my code?", next: "pressure", points: 15, note: "Good instinct. Questioning the request exposes the trick." },
      { text: "I'm not sharing that. I'll report this.", next: "good", points: 25, note: "Refusing and reporting protects everyone." }
    ]
  },
  ticket: {
    caller: "Uh, the ticket's still being created. There's no time. Your account will be locked in five minutes if you don't act.",
    choices: [
      { text: "Okay, tell me what to do quickly.", next: "ask", points: -15, note: "Manufactured urgency is a classic pressure tactic." },
      { text: "No ticket, no help. I'm hanging up and calling IT.", next: "good", points: 25, note: "Real support can wait while you verify." }
    ]
  },
  pressure: {
    caller: "Look, I'm the one trying to help here. Do you want your account stolen? Just give me the code.",
    choices: [
      { text: "Fine, here it is.", next: "bad", points: -40, note: "Guilt and pressure are tools, not proof of identity." },
      { text: "Goodbye. I'm reporting this call to security.", next: "good", points: 25, note: "Ending the call and reporting it is the right call." }
    ]
  },
  callback: {
    caller: "(Line goes dead.) You called the official help desk number. They confirm no one named Dana called you.",
    choices: [
      { text: "Report the call to the security team.", next: "good", points: 25, note: "Reporting helps protect your coworkers from the same caller." },
      { text: "Forget it and get back to work.", next: "meh", points: 0, note: "You're safe, but others may be targeted next. Reporting matters." }
    ]
  }
};
const CHAT_ENDINGS = {
  good: { title: "Attack stopped", message: "You didn't hand over anything and you reported it. That's exactly how social engineering fails." },
  meh: { title: "Safe, but silent", message: "You protected yourself. Next time, report it so IT can warn everyone else." },
  bad: { title: "Account compromised", message: "The attacker now has your code and can sign in as you. Replay and try the verification routes." }
};

function playSocialChat(root, ctx) {
  const ui = shell(root, ctx, "Trust meter: 50");
  let score = 50;
  let nodeId = "start";
  const log = [];

  const draw = () => {
    const node = CHAT[nodeId];
    ui.badge(`Trust meter: ${score}`);
    ui.stage.innerHTML = `
      <div class="mono-label">Incoming call</div>
      <div class="chat-log" data-log aria-live="polite"></div>
      <div class="chat-choices" data-choices></div>
    `;
    const logBox = ui.stage.querySelector("[data-log]");
    log.forEach((entry) => {
      const line = document.createElement("div");
      line.className = `chat-line ${entry.who}`;
      line.textContent = entry.text;
      logBox.append(line);
      if (entry.note) {
        const note = document.createElement("div");
        note.className = "chat-note";
        note.textContent = entry.note;
        logBox.append(note);
      }
    });
    const caller = document.createElement("div");
    caller.className = "chat-line caller";
    caller.textContent = node.caller;
    logBox.append(caller);
    const choices = ui.stage.querySelector("[data-choices]");
    node.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "block-btn chat-choice";
      button.textContent = choice.text;
      button.addEventListener("click", () => {
        score = Math.max(0, Math.min(100, score + choice.points));
        log.push({ who: "caller", text: node.caller }, { who: "you", text: choice.text, note: choice.note });
        if (CHAT_ENDINGS[choice.next]) {
          const ending = CHAT_ENDINGS[choice.next];
          const transcript = log.filter((entry) => entry.note).map((entry) => entry.note).join(" ");
          results(root, ctx, { id: "chat", score, title: ending.title, message: ending.message, detail: transcript });
          return;
        }
        nodeId = choice.next;
        draw();
      });
      choices.append(button);
    });
  };
  draw();
}

export const extraGames = [
  { id: "packet", title: "Packet Patrol", icon: "Zap", duration: "~1 min", tag: "ARCADE", blurb: "Block malicious network traffic before it breaches the network. Speed ramps up.", demo: true, play: playPacketPatrol },
  { id: "match", title: "Threat Match", icon: "KeyRound", duration: "~3 min", tag: "MEMORY", blurb: "Flip cards to pair each attack with the defense that stops it.", play: playThreatMatch },
  { id: "incident", title: "Incident Response", icon: "Fish", duration: "~3 min", tag: "SEQUENCE", blurb: "Put breach response steps in the right order, fast and without mistakes.", play: playIncidentResponse },
  { id: "chat", title: "Social Engineer Chat", icon: "Fish", duration: "~2 min", tag: "SCENARIO", blurb: "A caller is trying to trick you. Choose your replies and see where they lead.", play: playSocialChat }
];

window.graphenexExtraGames = extraGames;
window.graphenexGameBest = getBest;
document.dispatchEvent(new CustomEvent("games-ready"));
