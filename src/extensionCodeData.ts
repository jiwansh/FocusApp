export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export const EXTENSION_FILES: ExtensionFile[] = [
  {
    name: "manifest.json",
    path: "manifest.json",
    language: "json",
    content: `{
  "manifest_version": 3,
  "name": "Arbor Blocker - Forest Focus",
  "description": "Boost your focus by blocking distractions and nurturing your digital forest. Real-time dynamic blocklists and motivational redirects.",
  "version": "1.0.0",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "permissions": [
    "declarativeNetRequest",
    "storage",
    "alarms",
    "notifications"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "blocked.html"
      ],
      "matches": [
        "<all_urls>"
      ]
    }
  ]
}`
  },
  {
    name: "background.js",
    path: "background.js",
    language: "javascript",
    content: `/**
 * Arbor Blocker - Background Service Worker (Manifest V3)
 * Manages focus timers, alarms, dynamic blocking rules, and badge updates.
 */

const FOCUS_ALARM_NAME = 'arbor-focus-alarm';
const REFRESH_TICK_ALARM_NAME = 'arbor-refresh-tick';

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'instagram.com',
  'reddit.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'tiktok.com'
];

const DEFAULT_ALLOWED_SITES = [
  'github.com',
  'docs.oracle.com',
  'stackoverflow.com',
  'chatgpt.com',
  'anthropic.com',
  'gemini.google.com'
];

const DEFAULT_ALLOWED_EXCEPTIONS = [
  'youtube.com/c/takeuforward',
  'youtube.com/@CodeStoryWithMik',
  'youtube.com/playlist'
];

chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get([
    'blockedSites',
    'allowedSites',
    'allowedExceptions',
    'focusSession',
    'stats',
    'settings'
  ]);

  const storageInit = {};

  if (!existing.blockedSites) storageInit.blockedSites = DEFAULT_BLOCKED_SITES;
  if (!existing.allowedSites) storageInit.allowedSites = DEFAULT_ALLOWED_SITES;
  if (!existing.allowedExceptions) storageInit.allowedExceptions = DEFAULT_ALLOWED_EXCEPTIONS;
  
  if (!existing.focusSession) {
    storageInit.focusSession = {
      isActive: false,
      startTime: null,
      endTime: null,
      duration: 0,
      treeType: 'oak',
      progress: 0
    };
  }

  if (!existing.stats) {
    storageInit.stats = {
      totalFocusMinutes: 0,
      completedSessions: 0,
      currentStreak: 0,
      bestStreak: 0,
      distractionAttempts: 0,
      xp: 0,
      lastFocusDate: null
    };
  }

  if (!existing.settings) {
    storageInit.settings = {
      strictMode: true,
      soundEnabled: true,
      redirectTitle: "Stay Focused, Grow Big!",
      redirectSubtitle: "Your digital tree relies on your hard work. Keep cultivating your focus!",
      motivationalQuotes: [
        "Focus on being productive instead of busy.",
        "Your mind is for having ideas, not holding them.",
        "Only one tree grows at a time. Cultivate yours.",
        "The best time to plant a tree was 20 years ago. The second best time is now."
      ]
    };
  }

  await chrome.storage.local.set(storageInit);
  await updateBlockingRules();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FOCUS_ALARM_NAME) {
    await completeFocusSession();
  } else if (alarm.name === REFRESH_TICK_ALARM_NAME) {
    await updateTimerBadge();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logDistractionAttempt") {
    incrementDistractions();
  } else if (message.action === "startFocusSession") {
    startFocus(message.duration, message.treeType).then(sendResponse);
    return true; 
  } else if (message.action === "stopFocusSession") {
    stopFocus(message.cancelled).then(sendResponse);
    return true;
  }
});

async function incrementDistractions() {
  const data = await chrome.storage.local.get('stats');
  const stats = data.stats || { distractionAttempts: 0 };
  stats.distractionAttempts += 1;
  await chrome.storage.local.set({ stats });
}

async function updateBlockingRules() {
  const data = await chrome.storage.local.get([
    'focusSession',
    'blockedSites',
    'allowedExceptions'
  ]);

  const session = data.focusSession || {};
  const blockedSites = data.blockedSites || [];
  const allowedExceptions = data.allowedExceptions || [];

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);

  if (!session.isActive || blockedSites.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: []
    });
    return;
  }

  const addRules = [];
  let ruleId = 1;

  for (const exc of allowedExceptions) {
    if (exc && exc.trim()) {
      addRules.push({
        id: ruleId++,
        priority: 2,
        action: { type: "allow" },
        condition: {
          urlFilter: exc.trim(),
          resourceTypes: ["main_frame"]
        }
      });
    }
  }

  const redirectUrl = chrome.runtime.getURL("blocked.html");
  for (const site of blockedSites) {
    if (site && site.trim()) {
      addRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: redirectUrl }
        },
        condition: {
          urlFilter: site.trim(),
          resourceTypes: ["main_frame"]
        }
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: addRules
  });
}

async function startFocus(durationMinutes, treeType) {
  const now = Date.now();
  const end = now + (durationMinutes * 60 * 1000);

  const focusSession = {
    isActive: true,
    startTime: now,
    endTime: end,
    duration: durationMinutes,
    treeType: treeType || 'oak',
    progress: 0
  };

  await chrome.storage.local.set({ focusSession });

  await chrome.alarms.create(FOCUS_ALARM_NAME, { when: end });
  await chrome.alarms.create(REFRESH_TICK_ALARM_NAME, { periodInMinutes: 1 });

  await updateBlockingRules();
  await updateTimerBadge();

  chrome.notifications.create('session-started', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus Session Begun!',
    message: \`Your \${durationMinutes}m focus seedling has been planted. Keep the tab closed!\`,
    priority: 1
  });

  return { success: true, session: focusSession };
}

async function stopFocus(cancelled = true) {
  await chrome.alarms.clear(FOCUS_ALARM_NAME);
  await chrome.alarms.clear(REFRESH_TICK_ALARM_NAME);

  const data = await chrome.storage.local.get('focusSession');
  const session = data.focusSession || {};

  const focusSession = {
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 0,
    treeType: session.treeType || 'oak',
    progress: 0
  };

  await chrome.storage.local.set({ focusSession });
  await updateBlockingRules();

  chrome.action.setBadgeText({ text: '' });

  if (cancelled) {
    chrome.notifications.create('session-cancelled', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Session Aborted',
      message: 'Your growing tree withered because you paused focus.',
      priority: 1
    });
  }

  return { success: true, session: focusSession };
}

async function completeFocusSession() {
  await chrome.alarms.clear(FOCUS_ALARM_NAME);
  await chrome.alarms.clear(REFRESH_TICK_ALARM_NAME);

  const data = await chrome.storage.local.get(['focusSession', 'stats']);
  const session = data.focusSession || {};
  const stats = data.stats || {
    totalFocusMinutes: 0,
    completedSessions: 0,
    currentStreak: 0,
    bestStreak: 0,
    xp: 0,
    lastFocusDate: null
  };

  const focusSession = {
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 0,
    treeType: session.treeType || 'oak',
    progress: 100
  };

  const minutesFocused = session.duration || 0;
  stats.totalFocusMinutes += minutesFocused;
  stats.completedSessions += 1;

  const xpEarned = minutesFocused * 10;
  stats.xp += xpEarned;

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  if (stats.lastFocusDate === yesterdayStr) {
    stats.currentStreak += 1;
  } else if (stats.lastFocusDate !== todayStr) {
    stats.currentStreak = 1;
  }
  
  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak;
  }
  stats.lastFocusDate = todayStr;

  await chrome.storage.local.set({ focusSession, stats });
  await updateBlockingRules();

  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  chrome.action.setBadgeText({ text: 'DONE' });

  chrome.notifications.create('session-completed', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus Complete! 🌳',
    message: \`Splendid! You focused for \${minutesFocused} minutes and fully grew a majestic \${session.treeType} tree!\`,
    priority: 2
  });
}

async function updateTimerBadge() {
  const data = await chrome.storage.local.get('focusSession');
  const session = data.focusSession;

  if (!session || !session.isActive) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const remainingMs = session.endTime - Date.now();
  if (remainingMs <= 0) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const remainingMins = Math.round(remainingMs / 60000);
  
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  if (remainingMins < 1) {
    chrome.action.setBadgeText({ text: '<1m' });
  } else {
    chrome.action.setBadgeText({ text: \`\${remainingMins}m\` });
  }
}`
  },
  {
    name: "popup.html",
    path: "popup.html",
    language: "xml",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arbor Blocker</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container" id="popup-app">
    <header class="popup-header">
      <div class="logo-area">
        <span class="logo-icon">🌳</span>
        <h1>Arbor focus</h1>
      </div>
      <button class="settings-btn" id="go-to-options" title="Configure options">⚙️</button>
    </header>

    <main class="popup-main">
      <section id="timer-active-section" class="timer-section hidden">
        <div class="tree-canvas-container">
          <div class="tree-visualizer" id="active-tree-display">🌱</div>
          <div class="tree-level-label" id="active-tree-label">Growing Seedling...</div>
        </div>

        <div class="countdown-container">
          <div class="timer-digits" id="countdown-digits">25:00</div>
          <p class="timer-subtext">Focus active. Distractions are blocked.</p>
        </div>

        <div class="action-row">
          <button class="btn btn-danger" id="cancel-focus-btn">Yield (Give Up)</button>
        </div>
      </section>

      <section id="timer-setup-section" class="timer-section">
        <p class="setup-heading">Plant a Seed</p>
        
        <div class="tree-selector-grid">
          <button class="tree-select-item active" data-tree="oak">
            <span class="tree-icon">🌳</span>
            <span class="tree-name">Oak</span>
          </button>
          <button class="tree-select-item" data-tree="bonsai">
            <span class="tree-icon">🪴</span>
            <span class="tree-name">Bonsai</span>
          </button>
          <button class="tree-select-item" data-tree="cedar">
            <span class="tree-icon">🌲</span>
            <span class="tree-name">Cedar</span>
          </button>
          <button class="tree-select-item" data-tree="bamboo">
            <span class="tree-icon">🎋</span>
            <span class="tree-name">Bamboo</span>
          </button>
        </div>

        <div class="preset-row">
          <button class="preset-btn active" data-mins="25">25 Min</button>
          <button class="preset-btn" data-mins="50">50 Min</button>
          <button class="preset-btn" data-mins="90">90 Min</button>
          <button class="preset-btn" id="custom-preset-btn" data-mins="custom">Custom</button>
        </div>

        <div class="custom-input-container hidden" id="custom-slider-area">
          <div class="slider-header">
            <span>Duration:</span>
            <span id="custom-mins-val">30 mins</span>
          </div>
          <input type="range" id="custom-duration-slider" min="5" max="180" step="5" value="30">
        </div>

        <button class="btn btn-primary" id="start-focus-btn">Sow a Seed</button>
      </section>
    </main>

    <footer class="popup-footer">
      <div class="stat-pill" title="Current Daily Streak">
        <span class="stat-icon">🔥</span>
        <span class="stat-value" id="stat-streak">0 days</span>
      </div>
      <div class="stat-pill" title="Total XP Earned">
        <span class="stat-icon">⭐</span>
        <span class="stat-value" id="stat-xp">0 XP</span>
      </div>
      <div class="stat-pill" title="Total Focused Minutes">
        <span class="stat-icon">⏱️</span>
        <span class="stat-value" id="stat-minutes">0m</span>
      </div>
    </footer>
  </div>
  <script src="popup.js"></script>
</body>
</html>`
  },
  {
    name: "popup.js",
    path: "popup.js",
    language: "javascript",
    content: `document.addEventListener('DOMContentLoaded', async () => {
  const timerSetupSection = document.getElementById('timer-setup-section');
  const timerActiveSection = document.getElementById('timer-active-section');
  const customSliderArea = document.getElementById('custom-slider-area');
  
  const startFocusBtn = document.getElementById('start-focus-btn');
  const cancelFocusBtn = document.getElementById('cancel-focus-btn');
  const goToOptionsBtn = document.getElementById('go-to-options');

  const customDurationSlider = document.getElementById('custom-duration-slider');
  const customMinsVal = document.getElementById('custom-mins-val');
  
  const countdownDigits = document.getElementById('countdown-digits');
  const activeTreeDisplay = document.getElementById('active-tree-display');
  const activeTreeLabel = document.getElementById('active-tree-label');

  const statStreak = document.getElementById('stat-streak');
  const statXp = document.getElementById('stat-xp');
  const statMinutes = document.getElementById('stat-minutes');

  let selectedTree = 'oak';
  let selectedDuration = 25;
  let countdownInterval = null;

  const treeStages = {
    oak:    ['🌱', '🌿', '🌳', '🌳✨'],
    bonsai: ['🌱', '🪴', '🪴', '🪴✨'],
    cedar:  ['🌱', '🌿', '🌲', '🌲✨'],
    bamboo: ['🌱', '🎋', '🎋', '🎋✨']
  };

  const stageLabels = [
    "Planted Seedling",
    "Sprouting Root System",
    "Budding Sapling",
    "Majestic Grown Canopy!"
  ];

  await renderCoreState();

  if (goToOptionsBtn) {
    goToOptionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : window.open('options.html');
    });
  }

  const treeButtons = document.querySelectorAll('.tree-select-item');
  treeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      treeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTree = btn.getAttribute('data-tree');
    });
  });

  const presetButtons = document.querySelectorAll('.preset-row .preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const minsVal = btn.getAttribute('data-mins');
      if (minsVal === 'custom') {
        customSliderArea.classList.remove('hidden');
        selectedDuration = parseInt(customDurationSlider.value, 10);
      } else {
        customSliderArea.classList.add('hidden');
        selectedDuration = parseInt(minsVal, 10);
      }
    });
  });

  if (customDurationSlider) {
    customDurationSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      customMinsVal.textContent = \`\${val} mins\`;
      if (document.getElementById('custom-preset-btn').classList.contains('active')) {
        selectedDuration = parseInt(val, 10);
      }
    });
  }

  if (startFocusBtn) {
    startFocusBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: "startFocusSession",
        duration: selectedDuration,
        treeType: selectedTree
      }, (response) => {
        if (response && response.success) {
          renderTimerActiveState(response.session);
        }
      });
    });
  }

  if (cancelFocusBtn) {
    cancelFocusBtn.addEventListener('click', () => {
      const confirmAbort = confirm("Are you sure you want to stop? Your growing tree will die and wither.");
      if (confirmAbort) {
        chrome.runtime.sendMessage({
          action: "stopFocusSession",
          cancelled: true
        }, (response) => {
          if (response && response.success) {
            clearInterval(countdownInterval);
            renderTimerSetupState();
          }
        });
      }
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.focusSession) {
        const newSession = changes.focusSession.newValue;
        if (newSession && newSession.isActive) {
          if (!countdownInterval) renderTimerActiveState(newSession);
        } else {
          clearInterval(countdownInterval);
          countdownInterval = null;
          renderTimerSetupState();
          loadStats();
        }
      }
      if (changes.stats) loadStats();
    }
  });

  async function renderCoreState() {
    const data = await chrome.storage.local.get(['focusSession', 'stats']);
    loadStats(data.stats);

    const session = data.focusSession;
    if (session && session.isActive) {
      renderTimerActiveState(session);
    } else {
      renderTimerSetupState();
    }
  }

  function loadStats(stats) {
    chrome.storage.local.get('stats', (data) => {
      const activeStats = stats || data.stats || {
        totalFocusMinutes: 0,
        completedSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        xp: 0
      };

      if (statStreak) statStreak.textContent = \`\${activeStats.currentStreak} day\${activeStats.currentStreak === 1 ? '' : 's'}\`;
      if (statXp) statXp.textContent = \`\${activeStats.xp} XP\`;
      if (statMinutes) statMinutes.textContent = \`\${activeStats.totalFocusMinutes}m\`;
    });
  }

  function renderTimerSetupState() {
    timerActiveSection.classList.add('hidden');
    timerSetupSection.classList.remove('hidden');
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function renderTimerActiveState(session) {
    timerSetupSection.classList.add('hidden');
    timerActiveSection.classList.remove('hidden');
    selectedTree = session.treeType || 'oak';
    
    if (countdownInterval) clearInterval(countdownInterval);
    updateTick(session);
    countdownInterval = setInterval(() => {
      updateTick(session);
    }, 1000);
  }

  function updateTick(session) {
    const remainingMs = session.endTime - Date.now();
    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      renderTimerSetupState();
      loadStats();
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const secs = totalSeconds % 60;
    const mins = Math.floor(totalSeconds / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;
    countdownDigits.textContent = \`\${padMins}:\${padSecs}\`;

    const totalDurationSeconds = session.duration * 60;
    const elapsedSeconds = totalDurationSeconds - totalSeconds;
    const progressPercent = (elapsedSeconds / totalDurationSeconds) * 100;

    let stageIdx = 0;
    if (progressPercent >= 10 && progressPercent < 40) stageIdx = 1;
    else if (progressPercent >= 40 && progressPercent < 75) stageIdx = 2;
    else if (progressPercent >= 75) stageIdx = 3;

    const stages = treeStages[selectedTree] || treeStages.oak;
    activeTreeDisplay.textContent = stages[stageIdx];
    activeTreeLabel.textContent = stageLabels[stageIdx];
  }
});`
  },
  {
    name: "popup.css",
    path: "popup.css",
    language: "css",
    content: `:root {
  --bg-primary: #fbf9f4;
  --bg-card: #ffffff;
  --text-main: #1c1d1a;
  --text-muted: #64748b;
  --color-primary: #15803d;
  --color-primary-hover: #166534;
  --color-error: #be123c;
  --border-light: #e2e8f0;
  --accent-light: #f0fdf4;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
  width: 350px;
}

.popup-container {
  display: flex;
  flex-direction: column;
  height: 480px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon { font-size: 20px; }

.popup-header h1 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.03em;
}

.settings-btn {
  background: none;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.popup-main {
  flex: 1;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.timer-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setup-heading {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}

.tree-selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tree-select-item {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  align-items: center;
}

.tree-select-item.active {
  border-color: var(--color-primary);
  background-color: var(--accent-light);
}

.preset-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.preset-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.preset-btn.active {
  background: var(--text-main);
  color: white;
}

.custom-input-container {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 10px 12px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

.btn {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-danger {
  background-color: #fee2e2;
  color: var(--color-error);
  border: 1px solid #fecaca;
}

.tree-visualizer {
  font-size: 64px;
  text-align: center;
  margin-bottom: 6px;
}

.tree-level-label {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
  text-align: center;
}

.timer-digits {
  font-size: 40px;
  font-weight: 800;
  text-align: center;
}

.timer-subtext {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.popup-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 18px;
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-light);
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: var(--bg-primary);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
}

.hidden { display: none !important; }`
  },
  {
    name: "options.html",
    path: "options.html",
    language: "xml",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arbor Blocker - Settings</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="options-container">
    <header class="options-header">
      <div class="brand">
        <span class="brand-icon">🌳</span>
        <div>
          <h2>Arbor Blocker</h2>
          <p>Productivity System & Digital Forest</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" id="export-settings-btn">📤 Export JSON</button>
        <button class="btn btn-secondary" id="import-settings-btn">📥 Import JSON</button>
        <input type="file" id="import-file-input" accept=".json" class="hidden">
      </div>
    </header>

    <div class="options-layout">
      <main class="options-main">
        <section class="card config-card">
          <div class="tabs-header">
            <button class="tab-btn active" data-tab="tab-blocklist">🚫 Blocklist</button>
            <button class="tab-btn" data-tab="tab-allowlist">✅ Productive Allowlist</button>
            <button class="tab-btn" data-tab="tab-exceptions">🎓 Smart Exceptions</button>
          </div>

          <div class="tab-contents">
            <div id="tab-blocklist" class="tab-pane active">
              <p class="tab-desc">These domains are locked out during active focus cycles.</p>
              <div class="add-site-row">
                <input type="text" id="new-blocked-site" placeholder="e.g. reddit.com" class="text-input">
                <button class="btn btn-accent" id="add-blocked-btn">Add Domain</button>
              </div>
              <div id="blocked-status-msg" class="status-alert hidden"></div>
              <ul id="blocked-list" class="site-records-list"></ul>
            </div>

            <div id="tab-allowlist" class="tab-pane">
              <p class="tab-desc">Designated productive sites that appear as helpers on your redirects.</p>
              <div class="add-site-row">
                <input type="text" id="new-allowed-site" placeholder="e.g. github.com" class="text-input">
                <button class="btn btn-accent" id="add-allowed-btn">Add Productive</button>
              </div>
              <ul id="allowed-list" class="site-records-list"></ul>
            </div>

            <div id="tab-exceptions" class="tab-pane">
              <p class="tab-desc">E.g., block youtube.com but allow a specific playlist or channel.</p>
              <div class="add-site-row">
                <input type="text" id="new-exception-path" placeholder="youtube.com/c/takeuforward" class="text-input">
                <button class="btn btn-accent" id="add-exception-btn">Add Exception</button>
              </div>
              <ul id="exceptions-list" class="site-records-list"></ul>
            </div>
          </div>
        </section>

        <section class="card config-card">
          <h3>Custom Redirect Experience</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="setting-redirect-title" class="form-label">Motivational Title</label>
              <input type="text" id="setting-redirect-title" class="text-input">
            </div>
            <div class="form-group">
              <label for="setting-redirect-sub" class="form-label">Encouragement Subtext</label>
              <textarea id="setting-redirect-sub" class="text-input textarea-input" rows="2"></textarea>
            </div>
          </div>
          <button class="btn btn-primary mt-12" id="save-experience-btn">Save Redirect Options</button>
        </section>
      </main>

      <aside class="options-sidebar">
        <section class="card config-card">
          <h3>Focus Setting Modules</h3>
          <div class="setting-toggle-row">
            <div>
              <span class="setting-title">Strict Blocker Mode</span>
              <p class="setting-desc">Active dynamic rules prevent edits during focus time.</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="setting-strict-mode">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-toggle-row">
            <div>
              <span class="setting-title">Sound Effects</span>
              <p class="setting-desc">Play sound alerts upon focus timers ending.</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="setting-sound-enabled">
              <span class="slider"></span>
            </label>
          </div>
        </section>

        <section class="card config-card stats-card">
          <h3>Cumulative Achievements</h3>
          <div class="achievement-metric-grid">
            <div class="metric-item">
              <span class="metric-val" id="sb-stat-sessions">0</span>
              <span class="metric-lbl">Grown Trees</span>
            </div>
            <div class="metric-item">
              <span class="metric-val" id="sb-stat-minutes">0m</span>
              <span class="metric-lbl">Total Focus</span>
            </div>
            <div class="metric-item">
              <span class="metric-val" id="sb-stat-streak">0 🔥</span>
              <span class="metric-lbl">Current Streak</span>
            </div>
            <div class="metric-item">
              <span class="metric-val" id="sb-stat-best">0 🔥</span>
              <span class="metric-lbl">Best Streak</span>
            </div>
            <div class="metric-item text-span-2">
              <span class="metric-val" id="sb-stat-distractions">0</span>
              <span class="metric-lbl">Blocked Attempts</span>
            </div>
          </div>
          <button class="btn btn-danger-line" id="reset-stats-btn">Reset All Statistics</button>
        </section>
      </aside>
    </div>
  </div>
  <script src="options.js"></script>
</body>
</html>`
  },
  {
    name: "options.js",
    path: "options.js",
    language: "javascript",
    content: `document.addEventListener('DOMContentLoaded', async () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const newBlockedInput = document.getElementById('new-blocked-site');
  const addBlockedBtn = document.getElementById('add-blocked-btn');
  const blockedListUl = document.getElementById('blocked-list');
  const blockedStatusMsg = document.getElementById('blocked-status-msg');

  const newAllowedInput = document.getElementById('new-allowed-site');
  const addAllowedBtn = document.getElementById('add-allowed-btn');
  const allowedListUl = document.getElementById('allowed-list');

  const newExceptionInput = document.getElementById('new-exception-path');
  const addExceptionBtn = document.getElementById('add-exception-btn');
  const exceptionsListUl = document.getElementById('exceptions-list');

  const settingRedirectTitle = document.getElementById('setting-redirect-title');
  const settingRedirectSub = document.getElementById('setting-redirect-sub');
  const saveExperienceBtn = document.getElementById('save-experience-btn');

  const strictModeToggle = document.getElementById('setting-strict-mode');
  const soundEnabledToggle = document.getElementById('setting-sound-enabled');

  const statSessions = document.getElementById('sb-stat-sessions');
  const statMinutes = document.getElementById('sb-stat-minutes');
  const statStreak = document.getElementById('sb-stat-streak');
  const statBest = document.getElementById('sb-stat-best');
  const statDistractions = document.getElementById('sb-stat-distractions');
  const resetStatsBtn = document.getElementById('reset-stats-btn');

  const exportBtn = document.getElementById('export-settings-btn');
  const importBtn = document.getElementById('import-settings-btn');
  const importFileInput = document.getElementById('import-file-input');

  let activeSession = { isActive: false };
  let strictModeOn = true;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  await loadAndRenderPage();

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local') await loadAndRenderPage();
  });

  async function loadAndRenderPage() {
    const data = await chrome.storage.local.get([
      'blockedSites',
      'allowedSites',
      'allowedExceptions',
      'focusSession',
      'stats',
      'settings'
    ]);

    activeSession = data.focusSession || { isActive: false };
    const settings = data.settings || {};
    strictModeOn = settings.strictMode ?? true;

    enforceSecurityRules();

    renderList(data.blockedSites || [], blockedListUl, deleteBlockedSite);
    renderList(data.allowedSites || [], allowedListUl, deleteAllowedSite);
    renderList(data.allowedExceptions || [], exceptionsListUl, deleteExceptionPath);

    if (settingRedirectTitle && document.activeElement !== settingRedirectTitle) {
      settingRedirectTitle.value = settings.redirectTitle || "";
    }
    if (settingRedirectSub && document.activeElement !== settingRedirectSub) {
      settingRedirectSub.value = settings.redirectSubtitle || "";
    }

    if (strictModeToggle) strictModeToggle.checked = strictModeOn;
    if (soundEnabledToggle) soundEnabledToggle.checked = settings.soundEnabled ?? true;

    const stats = data.stats || { totalFocusMinutes: 0, completedSessions: 0, currentStreak: 0, bestStreak: 0, distractionAttempts: 0 };
    if (statSessions) statSessions.textContent = stats.completedSessions;
    if (statMinutes) statMinutes.textContent = \`\${stats.totalFocusMinutes}m\`;
    if (statStreak) statStreak.textContent = \`\${stats.currentStreak} 🔥\`;
    if (statBest) statBest.textContent = \`\${stats.bestStreak} 🔥\`;
    if (statDistractions) statDistractions.textContent = stats.distractionAttempts || 0;
  }

  function enforceSecurityRules() {
    const isLocked = activeSession.isActive && strictModeOn;
    if (isLocked) {
      if (blockedStatusMsg) {
        blockedStatusMsg.textContent = "Strict focus is active! Blocklist modification is suspended.";
        blockedStatusMsg.classList.remove('hidden');
      }
      [addBlockedBtn, addAllowedBtn, addExceptionBtn, saveExperienceBtn, newBlockedInput, newAllowedInput, newExceptionInput].forEach(el => {
        if (el) el.disabled = true;
      });
    } else {
      if (blockedStatusMsg) blockedStatusMsg.classList.add('hidden');
      [addBlockedBtn, addAllowedBtn, addExceptionBtn, saveExperienceBtn, newBlockedInput, newAllowedInput, newExceptionInput].forEach(el => {
        if (el) el.disabled = false;
      });
    }
  }

  function renderList(items, elementUl, deleteCallback) {
    elementUl.innerHTML = '';
    const isLocked = activeSession.isActive && strictModeOn;

    if (items.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.style.cssText = "color: #94a3b8; font-style: italic; text-align: center; padding: 16px;";
      emptyLi.textContent = "No entries added yet.";
      elementUl.appendChild(emptyLi);
      return;
    }

    items.forEach((item, index) => {
      const li = document.createElement('li');
      const textSpan = document.createElement('span');
      textSpan.className = "site-name";
      textSpan.textContent = item;
      li.appendChild(textSpan);

      if (!isLocked) {
        const delBtn = document.createElement('button');
        delBtn.className = "delete-record-btn";
        delBtn.innerHTML = "✕";
        delBtn.addEventListener('click', () => deleteCallback(index));
        li.appendChild(delBtn);
      }
      elementUl.appendChild(li);
    });
  }

  function sanitizeDomain(inputVal) {
    if (!inputVal) return '';
    return inputVal.trim().toLowerCase().replace(/^(https?:\\/\\/)?(www\\.)?/, '').replace(/\\/$/, '');
  }

  if (addBlockedBtn) {
    addBlockedBtn.addEventListener('click', async () => {
      const val = sanitizeDomain(newBlockedInput.value);
      if (!val) return;
      const data = await chrome.storage.local.get('blockedSites');
      const list = data.blockedSites || [];
      if (!list.includes(val)) {
        list.push(val);
        await chrome.storage.local.set({ blockedSites: list });
        newBlockedInput.value = '';
      } else {
        alert("Domain already added.");
      }
    });
  }

  async function deleteBlockedSite(idx) {
    const data = await chrome.storage.local.get('blockedSites');
    const list = data.blockedSites || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ blockedSites: list });
  }

  if (addAllowedBtn) {
    addAllowedBtn.addEventListener('click', async () => {
      const val = sanitizeDomain(newAllowedInput.value);
      if (!val) return;
      const data = await chrome.storage.local.get('allowedSites');
      const list = data.allowedSites || [];
      if (!list.includes(val)) {
        list.push(val);
        await chrome.storage.local.set({ allowedSites: list });
        newAllowedInput.value = '';
      }
    });
  }

  async function deleteAllowedSite(idx) {
    const data = await chrome.storage.local.get('allowedSites');
    const list = data.allowedSites || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ allowedSites: list });
  }

  if (addExceptionBtn) {
    addExceptionBtn.addEventListener('click', async () => {
      let val = newExceptionInput.value.trim().toLowerCase().replace(/^(https?:\\/\\/)?(www\\.)?/, '');
      if (!val) return;
      const data = await chrome.storage.local.get('allowedExceptions');
      const list = data.allowedExceptions || [];
      if (!list.includes(val)) {
        list.push(val);
        await chrome.storage.local.set({ allowedExceptions: list });
        newExceptionInput.value = '';
      }
    });
  }

  async function deleteExceptionPath(idx) {
    const data = await chrome.storage.local.get('allowedExceptions');
    const list = data.allowedExceptions || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ allowedExceptions: list });
  }

  if (saveExperienceBtn) {
    saveExperienceBtn.addEventListener('click', async () => {
      const data = await chrome.storage.local.get('settings');
      const settings = data.settings || {};
      settings.redirectTitle = settingRedirectTitle.value;
      settings.redirectSubtitle = settingRedirectSub.value;
      await chrome.storage.local.set({ settings });
      alert("Redirect config updated.");
    });
  }

  if (strictModeToggle) {
    strictModeToggle.addEventListener('change', async (e) => {
      if (activeSession.isActive && strictModeOn) {
        alert("Strict mode changes locked until session completes.");
        e.target.checked = true;
        return;
      }
      const data = await chrome.storage.local.get('settings');
      const settings = data.settings || {};
      settings.strictMode = e.target.checked;
      await chrome.storage.local.set({ settings });
    });
  }

  if (soundEnabledToggle) {
    soundEnabledToggle.addEventListener('change', async (e) => {
      const data = await chrome.storage.local.get('settings');
      const settings = data.settings || {};
      settings.soundEnabled = e.target.checked;
      await chrome.storage.local.set({ settings });
    });
  }

  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', async () => {
      if (confirm("Reset statistics?")) {
        await chrome.storage.local.set({
          stats: { totalFocusMinutes: 0, completedSessions: 0, currentStreak: 0, bestStreak: 0, distractionAttempts: 0, xp: 0 }
        });
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const allData = await chrome.storage.local.get(null);
      const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allData, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', uri);
      link.setAttribute('download', 'arbor-blocker-settings.json');
      link.click();
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      if (activeSession.isActive && strictModeOn) return alert("Locks bypass blocked!");
      importFileInput.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          await chrome.storage.local.set(parsed);
          alert("Import successful.");
        } catch (_) { alert("Invalid JSON file."); }
      };
      reader.readAsText(file);
    });
  }
});`
  },
  {
    name: "options.css",
    path: "options.css",
    language: "css",
    content: `:root {
  --bg-primary: #f8fafc;
  --bg-card: #ffffff;
  --text-main: #0f172a;
  --text-muted: #475569;
  --border-color: #e2e8f0;
  --color-primary: #15803d;
  --color-accent: #0f171c;
  --color-error: #e11d48;
  --radius-lg: 12px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
}

.options-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon { font-size: 32px; }

.brand h2 { margin: 0; font-size: 18px; }

.brand p { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

.header-actions { display: flex; gap: 10px; }

.options-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
  margin-top: -10px;
  margin-bottom: 16px;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}

.site-records-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.site-records-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
}

.delete-record-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1;
  border-radius: 24px;
  transition: 0.2s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px; width: 18px; left: 3px; bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}

input:checked + .slider { background-color: var(--color-primary); }

input:checked + .slider:before { transform: translateX(20px); }

.setting-toggle-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.achievement-metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-item {
  background-color: #fafbfc;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.metric-val { font-size: 20px; font-weight: 800; }

.metric-lbl { font-size: 11px; color: var(--text-muted); }

.status-alert {
  background-color: #fffbeb;
  padding: 10px;
  font-size: 12px;
  border-radius: 6px;
  color: #b45309;
  margin-bottom: 10px;
}

.hidden { display: none !important; }`
  },
  {
    name: "blocked.html",
    path: "blocked.html",
    language: "xml",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stay Focused - Arbor Blocker</title>
  <link rel="stylesheet" href="blocked.css">
</head>
<body>
  <div class="block-overlay-container">
    <div class="block-card">
      <header class="block-brand">
        <span class="block-logo">🌳</span>
        <h1>Arbor Blocker</h1>
        <span class="lock-tag">FOCUS ACTIVE</span>
      </header>

      <div class="focus-illustration-area">
        <div class="active-focus-tree-eco" id="blocked-tree-display">🌱</div>
        <p class="growth-subheading" id="blocked-tree-label">Growing Focus Seed...</p>
      </div>

      <div class="interstitial-motivation">
        <h2 id="blocked-motivation-title">Get back to work!</h2>
        <p id="blocked-motivation-text">Your digital seedling depends on absolute focus. Do not wither your growing tree.</p>
      </div>

      <div class="live-stopwatch">
        <div class="remaining-minutes" id="blocked-timer">24:45</div>
        <p class="stopwatch-descriptor">remaining in active block session</p>
      </div>

      <div class="allowed-shortcuts-section">
        <h3>🚀 Productive Shortcuts</h3>
        <p class="shortcuts-desc">Access manually allowed domains to assist your work:</p>
        <div class="shortcuts-grid" id="blocked-allowed-shortcuts"></div>
      </div>

      <footer class="block-footer">
        <p>Arbor Blocker (V3) — Focus, cultivate, and excel.</p>
      </footer>
    </div>
  </div>
  <script src="blocked.js"></script>
</body>
</html>`
  },
  {
    name: "blocked.js",
    path: "blocked.js",
    language: "javascript",
    content: `document.addEventListener('DOMContentLoaded', async () => {
  const blockedTreeDisplay = document.getElementById('blocked-tree-display');
  const blockedTreeLabel = document.getElementById('blocked-tree-label');
  const blockedTimer = document.getElementById('blocked-timer');
  
  const motivationTitle = document.getElementById('blocked-motivation-title');
  const motivationText = document.getElementById('blocked-motivation-text');
  const shortcutsGrid = document.getElementById('blocked-allowed-shortcuts');

  let countdownInterval = null;
  let activeSession = null;

  const treeStages = {
    oak:    ['🌱', '🌿', '🌳', '🌳✨'],
    bonsai: ['🌱', '🪴', '🪴', '🪴✨'],
    cedar:  ['🌱', '🌿', '🌲', '🌲✨'],
    bamboo: ['🌱', '🎋', '🎋', '🎋✨']
  };

  const stageLabels = [
    "Cultivating Seedling stage...",
    "Nurturing Sprouting Roots...",
    "Thriving Sapling stage...",
    "Full majestic tree grown successfully!"
  ];

  chrome.runtime.sendMessage({ action: "logDistractionAttempt" });
  await initializePage();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.focusSession) {
      const session = changes.focusSession.newValue;
      if (!session || !session.isActive) {
        clearInterval(countdownInterval);
        showCompletionScreen();
      }
    }
  });

  async function initializePage() {
    const data = await chrome.storage.local.get(['focusSession', 'settings', 'allowedSites']);
    activeSession = data.focusSession;
    
    const settings = data.settings || {};
    const allowedSites = data.allowedSites || [];

    if (motivationTitle && settings.redirectTitle) {
      motivationTitle.textContent = settings.redirectTitle;
    }
    if (motivationText && settings.redirectSubtitle) {
      motivationText.textContent = settings.redirectSubtitle;
    }

    renderAllowedShortcuts(allowedSites);

    if (activeSession && activeSession.isActive) {
      updateBlockedTick();
      countdownInterval = setInterval(updateBlockedTick, 1000);
    } else {
      showCompletionScreen();
    }
  }

  function renderAllowedShortcuts(sites) {
    if (!shortcutsGrid) return;
    shortcutsGrid.innerHTML = '';

    if (sites.length === 0) {
      const div = document.createElement('div');
      div.className = "empty-shortcuts";
      div.textContent = "No designated productive websites on your allowlist.";
      shortcutsGrid.appendChild(div);
      return;
    }

    sites.forEach(site => {
      if (site) {
        const a = document.createElement('a');
        a.className = "shortcut-chip";
        const urlStr = site.match(/^https?:\\/\\//) ? site : \`https://\${site}\`;
        a.setAttribute('href', urlStr);
        a.textContent = \`🌐 \${site}\`;
        shortcutsGrid.appendChild(a);
      }
    });
  }

  function updateBlockedTick() {
    if (!activeSession) return;
    const remainingMs = activeSession.endTime - Date.now();

    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      showCompletionScreen();
      return;
    }

    const totalSecs = Math.floor(remainingMs / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;

    if (blockedTimer) {
      blockedTimer.textContent = \`\${padMins}:\${padSecs}\`;
    }

    const totalDurationSeconds = activeSession.duration * 60;
    const elapsedSeconds = totalDurationSeconds - totalSecs;
    const progressPercent = (elapsedSeconds / totalDurationSeconds) * 100;

    let stageIdx = 0;
    if (progressPercent >= 10 && progressPercent < 40) stageIdx = 1;
    else if (progressPercent >= 40 && progressPercent < 75) stageIdx = 2;
    else if (progressPercent >= 75) stageIdx = 3;

    const stages = treeStages[activeSession.treeType] || treeStages.oak;
    if (blockedTreeDisplay) blockedTreeDisplay.textContent = stages[stageIdx];
    if (blockedTreeLabel) blockedTreeLabel.textContent = stageLabels[stageIdx];
  }

  function showCompletionScreen() {
    if (blockedTimer) blockedTimer.textContent = "00:00";
    if (blockedTreeDisplay) blockedTreeDisplay.textContent = "🌳✨";
    if (blockedTreeLabel) blockedTreeLabel.textContent = "Focus complete! Your tree is fully grown.";
    if (motivationTitle) motivationTitle.textContent = "Congratulations!";
    if (motivationText) {
      motivationText.innerHTML = "You stayed focus and finished your session successfully!";
    }
  }
});`
  },
  {
    name: "blocked.css",
    path: "blocked.css",
    language: "css",
    content: `:root {
  --bg-primary: #f8fafc;
  --bg-card: #ffffff;
  --color-forest: #166534;
  --color-forest-light: #f0fdf4;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #cbd5e1;
  --radius-lg: 16px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.block-overlay-container {
  width: 100%;
  max-width: 500px;
  padding: 16px;
}

.block-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}

.block-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.block-logo { font-size: 24px; }

.block-brand h1 { font-size: 16px; font-weight: 800; margin: 0; }

.lock-tag {
  background-color: #fee2e2;
  color: #991b1b;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
}

.active-focus-tree-eco {
  font-size: 80px;
  line-height: 1;
}

.growth-subheading {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-forest);
  background-color: var(--color-forest-light);
  padding: 4px 12px;
  border-radius: 20px;
  margin-top: 8px;
  display: inline-block;
}

.remaining-minutes {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.allowed-shortcuts-section {
  text-align: left;
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
  margin-top: 16px;
}

.shortcut-chip {
  background-color: white;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  text-decoration: none;
  display: inline-block;
  margin-right: 6px;
  margin-bottom: 6px;
}

.block-footer { margin-top: 16px; font-size: 10px; color: var(--text-muted); }`
  },
  {
    name: "README.md",
    path: "README.md",
    language: "markdown",
    content: `# Arbor Blocker - Focus Chrome Extension (Manifest V3)

Arbor Blocker is a lightweight, gamified focus companion designed for Chrome and modern Chromium-based browsers. It helps you carve out deep distraction-free work blocks by redirecting procrastinating pages, growing virtual trees, and tracking your daily focus streaks.

---

## 🛠️ Step-by-Step Installation Instructions

To install and load this unpacked extension in your Chrome browser locally:

1. **Prepare Files:** Download the \`Arbor Blocker\` ZIP using the Downloader in this workspace. Extract the files to a local directory or folder on your computer.
2. **Open Extensions Panel:** Open Chrome, navigate to the URL bar, and enter \`chrome://extensions/\`.
3. **Toggle Developer Mode:** In the upper-right corner of the Extensions panel, turn on the **Developer mode** switcher.
4. **Load Unpacked Extension:** Tapping the **Load unpacked** button in the upper-left, select the folder containing your unzipped files.
5. **Start Forest Focus:** Pin the newly loaded Arbor Blocker tree icon to your bar, select your tree breed, and begin deep focus!
`
  }
];
