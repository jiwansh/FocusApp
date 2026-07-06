/**
 * Arbor Blocker - Options & Configurations Controller
 * Handles list builders, strict overrides, statistics displays, and import/exports.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Blocklist inputs & lists
  const newBlockedInput = document.getElementById('new-blocked-site');
  const addBlockedBtn = document.getElementById('add-blocked-btn');
  const blockedListUl = document.getElementById('blocked-list');
  const blockedStatusMsg = document.getElementById('blocked-status-msg');

  // Allowlist inputs & lists
  const newAllowedInput = document.getElementById('new-allowed-site');
  const addAllowedBtn = document.getElementById('add-allowed-btn');
  const allowedListUl = document.getElementById('allowed-list');

  // Exception inputs & lists
  const newExceptionInput = document.getElementById('new-exception-path');
  const addExceptionBtn = document.getElementById('add-exception-btn');
  const exceptionsListUl = document.getElementById('exceptions-list');

  // Redirect customization inputs
  const settingRedirectTitle = document.getElementById('setting-redirect-title');
  const settingRedirectSub = document.getElementById('setting-redirect-sub');
  const saveExperienceBtn = document.getElementById('save-experience-btn');

  // Global settings toggles
  const strictModeToggle = document.getElementById('setting-strict-mode');
  const soundEnabledToggle = document.getElementById('setting-sound-enabled');

  // Stats elements
  const statSessions = document.getElementById('sb-stat-sessions');
  const statMinutes = document.getElementById('sb-stat-minutes');
  const statStreak = document.getElementById('sb-stat-streak');
  const statBest = document.getElementById('sb-stat-best');
  const statDistractions = document.getElementById('sb-stat-distractions');
  const resetStatsBtn = document.getElementById('reset-stats-btn');

  // Export/Import hooks
  const exportBtn = document.getElementById('export-settings-btn');
  const importBtn = document.getElementById('import-settings-btn');
  const importFileInput = document.getElementById('import-file-input');

  // Core configuration states
  let activeSession = { isActive: false };
  let strictModeOn = true;

  // 1. Tab switches logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // 2. Load initially stored config
  await loadAndRenderPage();

  // 3. Listen to external changes to redraw (e.g. if focus timer started/ended)
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local') {
      await loadAndRenderPage();
    }
  });

  // Load and Render Configurations
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

    // Render Tab Locks under strict active session rules
    enforceSecurityRules();

    // Render Lists
    renderList(data.blockedSites || [], blockedListUl, deleteBlockedSite);
    renderList(data.allowedSites || [], allowedListUl, deleteAllowedSite);
    renderList(data.allowedExceptions || [], exceptionsListUl, deleteExceptionPath);

    // Populate experience fields if not focused or modified
    if (settingRedirectTitle && document.activeElement?.id !== 'setting-redirect-title') {
      settingRedirectTitle.value = settings.redirectTitle || "";
    }
    if (settingRedirectSub && document.activeElement?.id !== 'setting-redirect-sub') {
      settingRedirectSub.value = settings.redirectSubtitle || "";
    }

    // Toggles
    if (strictModeToggle) strictModeToggle.checked = strictModeOn;
    if (soundEnabledToggle) soundEnabledToggle.checked = settings.soundEnabled ?? true;

    // Stats
    const stats = data.stats || { totalFocusMinutes: 0, completedSessions: 0, currentStreak: 0, bestStreak: 0, distractionAttempts: 0 };
    if (statSessions) statSessions.textContent = stats.completedSessions;
    if (statMinutes) statMinutes.textContent = `${stats.totalFocusMinutes}m`;
    if (statStreak) statStreak.textContent = `${stats.currentStreak} 🔥`;
    if (statBest) statBest.textContent = `${stats.bestStreak} 🔥`;
    if (statDistractions) statDistractions.textContent = stats.distractionAttempts || 0;
  }

  // Enforce disable adjustments on list items when strict focus is active
  function enforceSecurityRules() {
    const isLocked = activeSession.isActive && strictModeOn;

    if (isLocked) {
      if (blockedStatusMsg) {
        blockedStatusMsg.textContent = "Strict focus is active! You cannot modify your lists or settings until the session ends.";
        blockedStatusMsg.classList.remove('hidden');
      }
      
      // Disable inputs & buttons
      if (addBlockedBtn) addBlockedBtn.disabled = true;
      if (addAllowedBtn) addAllowedBtn.disabled = true;
      if (addExceptionBtn) addExceptionBtn.disabled = true;
      if (saveExperienceBtn) saveExperienceBtn.disabled = true;
      if (newBlockedInput) newBlockedInput.disabled = true;
      if (newAllowedInput) newAllowedInput.disabled = true;
      if (newExceptionInput) newExceptionInput.disabled = true;
    } else {
      if (blockedStatusMsg) blockedStatusMsg.classList.add('hidden');
      if (addBlockedBtn) addBlockedBtn.disabled = false;
      if (addAllowedBtn) addAllowedBtn.disabled = false;
      if (addExceptionBtn) addExceptionBtn.disabled = false;
      if (saveExperienceBtn) saveExperienceBtn.disabled = false;
      if (newBlockedInput) newBlockedInput.disabled = false;
      if (newAllowedInput) newAllowedInput.disabled = false;
      if (newExceptionInput) newExceptionInput.disabled = false;
    }
  }

  // Draw Lists
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
        delBtn.title = "Remove entry";
        delBtn.addEventListener('click', () => deleteCallback(index));
        li.appendChild(delBtn);
      }

      elementUl.appendChild(li);
    });
  }

  // Domain sanitizer checks
  function sanitizeDomain(inputVal) {
    if (!inputVal) return '';
    let val = inputVal.trim().toLowerCase();
    // Strip protocols
    val = val.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Strip trailing slashes
    val = val.replace(/\/$/, '');
    return val;
  }

  // List Modification operations
  // Blocked Items: add / remove
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
        triggerDynamicRulesUpdate();
      } else {
        alert("This domain is already on your blocklist.");
      }
    });
  }

  async function deleteBlockedSite(idx) {
    const data = await chrome.storage.local.get('blockedSites');
    const list = data.blockedSites || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ blockedSites: list });
    triggerDynamicRulesUpdate();
  }

  // Allowed Items: add / remove
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
      } else {
        alert("This domain has already been added.");
      }
    });
  }

  async function deleteAllowedSite(idx) {
    const data = await chrome.storage.local.get('allowedSites');
    const list = data.allowedSites || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ allowedSites: list });
  }

  // Exceptions list: add / remove
  if (addExceptionBtn) {
    addExceptionBtn.addEventListener('click', async () => {
      let val = newExceptionInput.value.trim().toLowerCase();
      val = val.replace(/^(https?:\/\/)?(www\.)?/, ''); // keep path details but strip prefix
      if (!val) return;

      const data = await chrome.storage.local.get('allowedExceptions');
      const list = data.allowedExceptions || [];

      if (!list.includes(val)) {
        list.push(val);
        await chrome.storage.local.set({ allowedExceptions: list });
        newExceptionInput.value = '';
        triggerDynamicRulesUpdate();
      } else {
        alert("This exception pattern already exists.");
      }
    });
  }

  async function deleteExceptionPath(idx) {
    const data = await chrome.storage.local.get('allowedExceptions');
    const list = data.allowedExceptions || [];
    list.splice(idx, 1);
    await chrome.storage.local.set({ allowedExceptions: list });
    triggerDynamicRulesUpdate();
  }

  // Experience forms submit
  if (saveExperienceBtn) {
    saveExperienceBtn.addEventListener('click', async () => {
      const data = await chrome.storage.local.get('settings');
      const currentSettings = data.settings || {};

      currentSettings.redirectTitle = settingRedirectTitle.value || "Stay Focused, Grow Big!";
      currentSettings.redirectSubtitle = settingRedirectSub.value || "Your digital tree rely on your effort.";

      await chrome.storage.local.set({ settings: currentSettings });
      alert("Redirect styles saved successfully.");
    });
  }

  // Toggles inputs hooks
  if (strictModeToggle) {
    strictModeToggle.addEventListener('change', async (e) => {
      // In active focus, check if strict mode trying to unlock
      if (activeSession.isActive && strictModeOn && !e.target.checked) {
        alert("You cannot disable strict mode while a focus timer is active!");
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

  // Stats reset trigger
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', async () => {
      const confirmReset = confirm("Are you sure you want to completely erase all grown trees and cumulative statistics?");
      if (confirmReset) {
        const stats = {
          totalFocusMinutes: 0,
          completedSessions: 0,
          currentStreak: 0,
          bestStreak: 0,
          distractionAttempts: 0,
          xp: 0,
          lastFocusDate: null
        };
        await chrome.storage.local.set({ stats });
        alert("Statistics has been reset to zero.");
      }
    });
  }

  // Exporter/Importer details
  // 1. Export settings as JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const allData = await chrome.storage.local.get(null);
      
      const contentsStr = JSON.stringify(allData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(contentsStr);
      
      const exportFileDefaultName = 'arbor-blocker-configuration.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  }

  // 2. Import settings JSON
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      if (activeSession.isActive && strictModeOn) {
        alert("You cannot import configurations during active strict focus sessions.");
        return;
      }
      importFileInput.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          
          // Verify base fields
          if (imported.blockedSites || imported.settings || imported.stats) {
            await chrome.storage.local.set(imported);
            alert("Configuration settings imported successfully!");
            await loadAndRenderPage();
            triggerDynamicRulesUpdate();
          } else {
            alert("Error: Selected JSON is invalid or missing Arbor configurations.");
          }
        } catch (err) {
          alert("Error parsing JSON config file.");
        }
      };
      reader.readAsText(file);
    });
  }

  // Inform background worker to recalculate blocker rules due to list adjustment
  function triggerDynamicRulesUpdate() {
    if (activeSession.isActive) {
      // Background worker automatically updates when changes happen on storage because we listen.
      // We also trigger a reload here to make sure.
    }
  }
});
