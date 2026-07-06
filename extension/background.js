/**
 * Arbor Blocker - Background Service Worker (Manifest V3)
 * Manages focus timers, alarms, dynamic blocking rules, and badge updates.
 */

// Core constants
const FOCUS_ALARM_NAME = 'arbor-focus-alarm';
const REFRESH_TICK_ALARM_NAME = 'arbor-refresh-tick';

// Default blocklists and config
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
  'npmtest.org',
  'chatgpt.com',
  'anthropic.com',
  'gemini.google.com'
];

const DEFAULT_ALLOWED_EXCEPTIONS = [
  'youtube.com/c/takeuforward',
  'youtube.com/@CodeStoryWithMik',
  'youtube.com/playlist'
];

// Initialize on installation
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
  console.log("Arbor Blocker Extension Initialized successfully.");
  await updateBlockingRules();
});

// Alarm Listener (handles service worker wake-up for timer triggers)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FOCUS_ALARM_NAME) {
    await completeFocusSession();
  } else if (alarm.name === REFRESH_TICK_ALARM_NAME) {
    await updateTimerBadge();
  }
});

// Listener for focus redirect stats tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logDistractionAttempt") {
    incrementDistractions();
  } else if (message.action === "startFocusSession") {
    startFocus(message.duration, message.treeType).then(sendResponse);
    return true; // Keep channel open
  } else if (message.action === "stopFocusSession") {
    stopFocus(message.cancelled).then(sendResponse);
    return true;
  }
});

// Helper: Increment distraction efforts
async function incrementDistractions() {
  const data = await chrome.storage.local.get('stats');
  const stats = data.stats || { distractionAttempts: 0 };
  stats.distractionAttempts += 1;
  await chrome.storage.local.set({ stats });
}

// Function to check if a URL is in the blocked sites list
function isBlocked(urlStr, blockedSites, allowedExceptions) {
  if (!urlStr) return false;
  if (urlStr.startsWith('chrome-extension://') || urlStr.startsWith('chrome://')) {
    return false;
  }
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    
    const isBlockedSite = blockedSites.some(site => {
      if (!site) return false;
      const cleanSite = site.trim().toLowerCase();
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });
    
    if (!isBlockedSite) return false;
    
    const matchesException = allowedExceptions.some(exc => {
      if (!exc) return false;
      const cleanExc = exc.trim().toLowerCase();
      return urlStr.toLowerCase().includes(cleanExc);
    });
    
    return !matchesException;
  } catch (e) {
    return false;
  }
}

// Function to check if any blocked tab is open and update pause state accordingly
async function checkBlockedTabs() {
  const tabs = await chrome.tabs.query({});
  const blockedTabUrl = chrome.runtime.getURL("blocked.html");
  const hasBlockedTab = tabs.some(tab => tab.url && tab.url.startsWith(blockedTabUrl));
  
  const data = await chrome.storage.local.get('focusSession');
  const session = data.focusSession;
  
  if (session && session.isActive) {
    if (hasBlockedTab && !session.isPaused) {
      await pauseFocus();
    } else if (!hasBlockedTab && session.isPaused) {
      await resumeFocus();
    }
  }
}

// Pause focus session
async function pauseFocus() {
  const data = await chrome.storage.local.get('focusSession');
  const session = data.focusSession;
  if (!session || !session.isActive || session.isPaused) return;

  const remainingMs = Math.max(0, session.endTime - Date.now());
  session.isPaused = true;
  session.remainingTime = remainingMs;
  session.pauseStart = Date.now();

  await chrome.storage.local.set({ focusSession: session });
  await chrome.alarms.clear(FOCUS_ALARM_NAME);
  await chrome.alarms.clear(REFRESH_TICK_ALARM_NAME);
  
  await updateTimerBadge();
  console.log("Focus session paused.");
}

// Resume focus session
async function resumeFocus() {
  const data = await chrome.storage.local.get('focusSession');
  const session = data.focusSession;
  if (!session || !session.isActive || !session.isPaused) return;

  const newEndTime = Date.now() + (session.remainingTime || 0);
  session.isPaused = false;
  session.endTime = newEndTime;
  session.pauseStart = null;

  await chrome.storage.local.set({ focusSession: session });
  
  await chrome.alarms.create(FOCUS_ALARM_NAME, { when: newEndTime });
  await chrome.alarms.create(REFRESH_TICK_ALARM_NAME, { periodInMinutes: 1 });
  
  await updateTimerBadge();
  console.log("Focus session resumed.");
}

// Redirect all currently open distracting tabs
async function redirectAllActiveBlockedTabs() {
  const data = await chrome.storage.local.get(['blockedSites', 'allowedExceptions']);
  const blockedSites = data.blockedSites || [];
  const allowedExceptions = data.allowedExceptions || [];
  
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && isBlocked(tab.url, blockedSites, allowedExceptions)) {
      await incrementDistractions();
      const blockedUrl = chrome.runtime.getURL("blocked.html") + "?original=" + encodeURIComponent(tab.url);
      try {
        await chrome.tabs.update(tab.id, { url: blockedUrl });
      } catch (e) {
        console.error(e);
      }
    }
  }
}

// Intercept tab loading for blocked domains
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const data = await chrome.storage.local.get(['focusSession', 'blockedSites', 'allowedExceptions']);
    const session = data.focusSession;
    
    if (session && session.isActive) {
      if (isBlocked(changeInfo.url, data.blockedSites || [], data.allowedExceptions || [])) {
        await incrementDistractions();
        const blockedUrl = chrome.runtime.getURL("blocked.html") + "?original=" + encodeURIComponent(changeInfo.url);
        chrome.tabs.update(tabId, { url: blockedUrl });
        return;
      }
    }
  }
  await checkBlockedTabs();
});

// Resume timer if blocked tab is closed
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  await checkBlockedTabs();
});

// Function: Update DeclarativeNetRequest dynamic rules
async function updateBlockingRules() {
  const data = await chrome.storage.local.get([
    'focusSession',
    'blockedSites',
    'allowedExceptions'
  ]);

  const session = data.focusSession || {};
  const blockedSites = data.blockedSites || [];
  const allowedExceptions = data.allowedExceptions || [];

  // Query existing dynamic rules to clear them
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);

  // If focus session not active, run no block rules
  if (!session.isActive || blockedSites.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: []
    });
    return;
  }

  const addRules = [];
  let ruleId = 1;

  // 1. Add ALLOW Rules for exceptions so they pass through (Priority 2)
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

  // 2. Add REDIRECT Rules for block list sites (Priority 1)
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

  // Atomically apply dynamic updates
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: addRules
  });
}

// Function: Start Focus Session
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

  // Create alarms: focus end and periodic ticks (to update icon badge)
  await chrome.alarms.create(FOCUS_ALARM_NAME, { when: end });
  await chrome.alarms.create(REFRESH_TICK_ALARM_NAME, { periodInMinutes: 1 });

  // Update NetRequest blocker settings
  await updateBlockingRules();

  // Intercept and redirect any already open distracting tabs
  await redirectAllActiveBlockedTabs();

  // Draw Initial Badge
  await updateTimerBadge();

  // Dispatch Notification
  chrome.notifications.create('session-started', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus Session Begun!',
    message: `Your ${durationMinutes}m focus seedling has been planted. Keep the tab closed!`,
    priority: 1
  });

  return { success: true, session: focusSession };
}

// Function: Stop Focus Session Programmatic
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

  // Clear extension badges
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

// Function: Complete Focus Timer Success
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

  // Turn off blocking rules
  const focusSession = {
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 0,
    treeType: session.treeType || 'oak',
    progress: 100
  };

  // Compute Streak and Stats Awards
  const minutesFocused = session.duration || 0;
  stats.totalFocusMinutes += minutesFocused;
  stats.completedSessions += 1;

  // XP is calculated as 10 XP per minute focused
  const xpEarned = minutesFocused * 10;
  stats.xp += xpEarned;

  // Compute Streak Date Logics
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

  // Set green/accomplished badge
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  chrome.action.setBadgeText({ text: 'DONE' });

  // Sound play logic
  const settingsData = await chrome.storage.local.get('settings');
  const soundOn = settingsData.settings?.soundEnabled ?? true;

  // Trigger Notifications
  chrome.notifications.create('session-completed', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus Complete! 🌳',
    message: `Splendid! You focused for ${minutesFocused} minutes and fully grew a majestic ${session.treeType} tree (+${xpEarned} XP)!`,
    priority: 2
  });
}

// Helper: Periodically refresh remaining minutes badge on Action Icon
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
    chrome.action.setBadgeText({ text: `${remainingMins}m` });
  }
}
