/**
 * Arbor Blocker - Block Redirect Screen Controller
 * Governs funny "Padh Lo Beta" memes, dynamic paused timer, beep alarm audio, and permissible shortcuts.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- Synchronize theme preference from storage on load ---
  chrome.storage.local.get('theme', (data) => {
    const theme = data.theme || 'dark';
    document.documentElement.className = theme;
  });

  const blockedTreeDisplay = document.getElementById('blocked-tree-display');
  const blockedTreeLabel = document.getElementById('blocked-tree-label');
  const blockedTimer = document.getElementById('blocked-timer');
  const shortcutsGrid = document.getElementById('blocked-allowed-shortcuts');
  const soundStatusNotice = document.getElementById('sound-status-notice');

  let countdownInterval = null;
  let activeSession = null;
  
  // Audio state
  let audioCtx = null;
  let beepInterval = null;
  let soundMuted = false;

  // 1. Instantly log blocked attempt to statistics
  chrome.runtime.sendMessage({ action: "logDistractionAttempt" });

  // 2. Fetch and render page details
  await initializePage();

  // 3. Listen to state modifications (e.g. if focus timer naturally finishes, or is resumed)
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.focusSession) {
      activeSession = changes.focusSession.newValue;
      if (!activeSession || !activeSession.isActive) {
        clearInterval(countdownInterval);
        stopBeeping();
        showCompletionScreen();
      } else {
        updateBlockedTick();
      }
    }
  });

  // 4. Set up beeping sound triggers on user interaction
  setupAudioTriggers();

  async function initializePage() {
    const data = await chrome.storage.local.get(['focusSession', 'settings', 'allowedSites']);
    activeSession = data.focusSession;
    const allowedSites = data.allowedSites || [];

    // Set allowable shortcuts
    renderAllowedShortcuts(allowedSites);

    // Initial countdown setup
    if (activeSession && activeSession.isActive) {
      updateBlockedTick();
      countdownInterval = setInterval(updateBlockedTick, 1000);
      
      // Auto start audio if possible (Chrome might block till click, which is why we show a notice)
      startBeeping();
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
      div.textContent = "No designated productive websites on your allowlist. Add them in options!";
      shortcutsGrid.appendChild(div);
      return;
    }

    sites.forEach(site => {
      if (site) {
        const a = document.createElement('a');
        a.className = "shortcut-chip";
        const urlStr = site.match(/^https?:\/\//) ? site : `https://${site}`;
        a.setAttribute('href', urlStr);
        a.textContent = `🌐 ${site}`;
        shortcutsGrid.appendChild(a);
      }
    });
  }

  function updateBlockedTick() {
    if (!activeSession) return;
    
    let remainingMs;
    if (activeSession.isPaused) {
      remainingMs = activeSession.remainingTime;
    } else {
      remainingMs = activeSession.endTime - Date.now();
    }

    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      stopBeeping();
      showCompletionScreen();
      return;
    }

    // Minutes & seconds formatting
    const totalSecs = Math.max(0, Math.floor(remainingMs / 1000));
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;

    if (blockedTimer) {
      blockedTimer.textContent = `${padMins}:${padSecs}`;
    }

    if (blockedTreeDisplay) blockedTreeDisplay.textContent = "😢";
    if (blockedTreeLabel) blockedTreeLabel.textContent = "Timer is PAUSED. Close this tab to resume!";
  }

  function showCompletionScreen() {
    if (blockedTimer) blockedTimer.textContent = "00:00";
    if (blockedTreeDisplay) blockedTreeDisplay.textContent = "🌳✨";
    if (blockedTreeLabel) blockedTreeLabel.textContent = "Focus complete! Your tree is fully grown.";
    
    const headline = document.querySelector('.meme-headline');
    const subheadline = document.querySelector('.meme-subheadline');
    const text = document.querySelector('.meme-text');
    
    if (headline) headline.textContent = "Shabash! 🎉";
    if (subheadline) subheadline.textContent = "WELL DONE!";
    if (text) text.textContent = "You survived the distraction block and grew your seedling!";
    if (soundStatusNotice) soundStatusNotice.style.display = 'none';
  }

  // Audio Synthesizer Beep System
  function startBeeping() {
    if (beepInterval || soundMuted) return;

    // Check if sounds are disabled globally in extension settings
    chrome.storage.local.get('settings', (data) => {
      const settings = data.settings || {};
      const globalSoundEnabled = settings.soundEnabled ?? true;
      if (!globalSoundEnabled) {
        if (soundStatusNotice) {
          soundStatusNotice.textContent = "🔇 Sound effects disabled in settings.";
          soundStatusNotice.classList.add('muted');
        }
        return;
      }

      const playBeep = () => {
        if (soundMuted) return;
        try {
          if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, audioCtx.currentTime); // 900 Hz warning tone
          
          // High pitch short double pulse beep
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        } catch (e) {
          console.error("Warning audio playback blocked:", e);
        }
      };

      beepInterval = setInterval(playBeep, 1200);
      playBeep(); // Trigger immediately
    });
  }

  function stopBeeping() {
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }
  }

  function setupAudioTriggers() {
    // Attempt to start audio on user clicking anywhere on the page
    document.addEventListener('click', () => {
      if (!soundMuted && !beepInterval && activeSession && activeSession.isActive) {
        startBeeping();
        if (soundStatusNotice) {
          soundStatusNotice.textContent = "🔊 Warning beep active! Close tab to stop.";
          soundStatusNotice.classList.remove('muted');
        }
      }
    });

    if (soundStatusNotice) {
      soundStatusNotice.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering body click
        
        if (!soundMuted) {
          soundMuted = true;
          stopBeeping();
          soundStatusNotice.textContent = "🔇 Click to unmute warning beep";
          soundStatusNotice.classList.add('muted');
        } else {
          soundMuted = false;
          soundStatusNotice.textContent = "🔊 Warning beep active! Close tab to stop.";
          soundStatusNotice.classList.remove('muted');
          startBeeping();
        }
      });
    }
  }
});
