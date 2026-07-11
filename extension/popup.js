/**
 * Arbor Blocker - Popup Script
 * Coordinates timer setup, active timer ticks, tree states, and stats display.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- Theme Selection & Persistence ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  // Load and apply the user theme preference from Chrome local storage
  chrome.storage.local.get('theme', (data) => {
    const theme = data.theme || 'dark'; // Default to Dark mode
    document.documentElement.className = theme;
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  });

  // Handle click events to toggle theme states
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      const newTheme = isDark ? 'light' : 'dark';
      document.documentElement.className = newTheme;
      chrome.storage.local.set({ theme: newTheme });
      themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  // Elements
  const popupApp = document.getElementById('popup-app');
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

  // Stats Elements
  const statStreak = document.getElementById('stat-streak');
  const statXp = document.getElementById('stat-xp');
  const statMinutes = document.getElementById('stat-minutes');

  // Working States
  let selectedTree = 'oak';
  let selectedDuration = 25; // in minutes
  let countdownInterval = null;

  // Tree Visual Stage Mapping
  const treeStages = {
    oak:    ['🌱', '🌿', '🌳', '🌳✨'],
    sunflower: ['🌱', '🌻', '🌻', '🌻✨'],
    cedar:  ['🌱', '🌿', '🌲', '🌲✨'],
    bamboo: ['🌱', '🎋', '🎋', '🎋✨']
  };

  const stageLabels = [
    "Planted Seedling",
    "Sprouting Root System",
    "Budding Sapling",
    "Majestic Grown Canopy!"
  ];

  // 1. Load Initial State & Stats
  await renderCoreState();

  // 2. Options Redirect
  if (goToOptionsBtn) {
    goToOptionsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('options.html');
      }
    });
  }

  // 3. Tree Selector Grid Click Triggers
  const treeButtons = document.querySelectorAll('.tree-select-item');
  treeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      treeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTree = btn.getAttribute('data-tree');
    });
  });

  // 4. Duration Presets Click Triggers
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

  // 5. Custom Duration Slider Input Hook
  if (customDurationSlider) {
    customDurationSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      customMinsVal.textContent = `${val} mins`;
      if (document.getElementById('custom-preset-btn').classList.contains('active')) {
        selectedDuration = parseInt(val, 10);
      }
    });
  }

  // 6. Action: Sow a Seed / Start Focus
  if (startFocusBtn) {
    startFocusBtn.addEventListener('click', async () => {
      // Send focus request to service worker
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

  // 7. Action: Yield / Abort Focus
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

  // Live storage event listener to catch session modifications from background
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.focusSession) {
        const newSession = changes.focusSession.newValue;
        activeSession = newSession;
        if (newSession && newSession.isActive) {
          renderTimerActiveState(newSession);
        } else {
          clearInterval(countdownInterval);
          countdownInterval = null;
          renderTimerSetupState();
          loadStats();
        }
      }
      if (changes.stats) {
        loadStats();
      }
    }
  });

  // Render Logic
  async function renderCoreState() {
    const data = await chrome.storage.local.get(['focusSession', 'stats']);
    
    // Load Stats
    loadStats(data.stats);

    activeSession = data.focusSession;
    if (activeSession && activeSession.isActive) {
      renderTimerActiveState(activeSession);
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

      if (statStreak) statStreak.textContent = `${activeStats.currentStreak} day${activeStats.currentStreak === 1 ? '' : 's'}`;
      if (statXp) statXp.textContent = `${activeStats.xp} XP`;
      if (statMinutes) statMinutes.textContent = `${activeStats.totalFocusMinutes}m`;
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
    activeSession = session;
    timerSetupSection.classList.add('hidden');
    timerActiveSection.classList.remove('hidden');

    selectedTree = activeSession.treeType || 'oak';
    
    // Begin ticking
    if (countdownInterval) clearInterval(countdownInterval);
    
    updateTick();
    countdownInterval = setInterval(() => {
      updateTick();
    }, 1000);
  }

  function updateTick() {
    if (!activeSession) return;

    let remainingMs;
    if (activeSession.isPaused) {
      remainingMs = activeSession.remainingTime;
    } else {
      remainingMs = activeSession.endTime - Date.now();
    }
    
    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      renderTimerSetupState();
      loadStats();
      return;
    }

    // Translate duration
    const totalSeconds = Math.floor(remainingMs / 1000);
    const secs = totalSeconds % 60;
    const mins = Math.floor(totalSeconds / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;
    
    countdownDigits.textContent = `${padMins}:${padSecs}`;

    // Handle paused display in popup
    if (activeSession.isPaused) {
      activeTreeDisplay.textContent = '😢';
      activeTreeLabel.textContent = "Focus is PAUSED! (Close distraction tab)";
      return;
    }

    // Set interactive tree progress based on percentage
    const totalDurationSeconds = activeSession.duration * 60;
    const elapsedSeconds = totalDurationSeconds - totalSeconds;
    const progressPercent = (elapsedSeconds / totalDurationSeconds) * 100;

    let stageIdx = 0;
    if (progressPercent >= 10 && progressPercent < 40) stageIdx = 1;
    else if (progressPercent >= 40 && progressPercent < 75) stageIdx = 2;
    else if (progressPercent >= 75) stageIdx = 3;

    // Output Tree Icon and stage Label
    const stages = treeStages[selectedTree] || treeStages.oak;
    activeTreeDisplay.textContent = stages[stageIdx];
    activeTreeLabel.textContent = stageLabels[stageIdx];
  }
});
