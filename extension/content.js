/**
 * Arbor Blocker - Floating Circular Timer Widget Content Script
 * Injects a draggable, glassmorphic circular timer widget with breathing animations, 
 * adaptive ring strokes, and automatic pause/resume state management.
 */

(function () {
  let widgetRoot = null;
  let shadowRoot = null;
  let widgetCard = null; // Store card reference globally within script
  let countdownInterval = null;
  let activeSession = null;
  let isMinimized = false;
  let isRemoving = false;

  // Helper to verify that the extension runtime context is valid
  function isContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local;
  }

  // Safe wrapper for chrome.storage.local.get using Promises
  function safeStorageGet(keys) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        removeWidgetDOM();
        resolve({});
        return;
      }
      try {
        chrome.storage.local.get(keys, (result) => {
          resolve(result || {});
        });
      } catch (e) {
        removeWidgetDOM();
        resolve({});
      }
    });
  }

  // Safe wrapper for chrome.storage.local.set
  function safeStorageSet(data) {
    if (!isContextValid()) {
      removeWidgetDOM();
      return;
    }
    try {
      chrome.storage.local.set(data);
    } catch (e) {
      removeWidgetDOM();
    }
  }

  // Safe wrapper for chrome.runtime.getURL
  function safeGetURL(path) {
    if (!isContextValid()) {
      removeWidgetDOM();
      return '';
    }
    try {
      return chrome.runtime.getURL(path);
    } catch (e) {
      removeWidgetDOM();
      return '';
    }
  }

  // 1. Initial State Check
  initWidget();

  // 2. Listen to storage modifications (to dynamically show/hide or pause/resume)
  if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (!isContextValid()) {
        removeWidgetDOM();
        return;
      }
      if (area === 'local') {
        if (changes.focusSession) {
          activeSession = changes.focusSession.newValue;
          syncWidgetState();
        }
      }
    });
  }

  async function initWidget() {
    const data = await safeStorageGet(['focusSession', 'widgetMinimized']);
    activeSession = data.focusSession;
    isMinimized = !!data.widgetMinimized;
    syncWidgetState();
  }

  function syncWidgetState() {
    const isActive = activeSession && activeSession.isActive;

    if (isActive) {
      createWidgetDOM();
      updateWidgetTick();
      
      if (!countdownInterval) {
        countdownInterval = setInterval(updateWidgetTick, 1000);
      }
    } else {
      // If session completed naturally, let updateWidgetTick handle the bloom animation.
      // Otherwise, remove DOM immediately.
      if (activeSession && activeSession.progress === 100) {
        playBloomAndRemove();
      } else {
        removeWidgetDOM();
      }
    }
  }

  function createWidgetDOM() {
    if (widgetRoot) return; // Already exists
    isRemoving = false;

    // Create Root Node
    widgetRoot = document.createElement('div');
    widgetRoot.id = 'arbor-floating-timer-root';
    document.body.appendChild(widgetRoot);

    // Attach Shadow DOM for Style Isolation
    shadowRoot = widgetRoot.attachShadow({ mode: 'open' });

    // Link Content Stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = safeGetURL('content.css') + '?t=' + Date.now();
    shadowRoot.appendChild(link);

    // Create Main Widget Card
    const card = document.createElement('div');
    card.className = 'arbor-timer-card';
    card.id = 'arbor-card';
    if (isMinimized) card.classList.add('arbor-minimized');
    
    // Semantic structure with progress SVG and stackable content
    card.innerHTML = `
      <!-- Circular SVG Progress Ring -->
      <svg class="arbor-progress-svg" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="arbor-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2dd4bf" />
            <stop offset="100%" stop-color="#0d9488" />
          </linearGradient>
          <linearGradient id="arbor-ring-paused" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
          <linearGradient id="arbor-ring-break" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>
        </defs>
        <circle class="arbor-progress-track" cx="70" cy="70" r="62" fill="none" stroke-width="4"></circle>
        <circle class="arbor-progress-bar" cx="70" cy="70" r="62" fill="none" stroke-width="4" transform="rotate(-90 70 70)"></circle>
      </svg>

      <!-- Interactive Inner Stack -->
      <div class="arbor-inner-content">
        <span class="arbor-time-countdown" id="arbor-countdown">--:--</span>
        
        <!-- Premium inline-vector plant seedling -->
        <div class="arbor-plant-container">
          <svg class="arbor-plant-svg" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="plant-stem" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#78350f" />
                <stop offset="100%" stop-color="#451a03" />
              </linearGradient>
              <linearGradient id="leaf-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#34d399" />
                <stop offset="100%" stop-color="#059669" />
              </linearGradient>
              <linearGradient id="leaf-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#047857" />
              </linearGradient>
            </defs>
            <!-- Soil base -->
            <ellipse cx="50" cy="80" rx="18" ry="5" fill="#5c2e0b" opacity="0.35" />
            <!-- Stem -->
            <path d="M50 80 Q 50 48 48 35" stroke="url(#plant-stem)" stroke-width="4" stroke-linecap="round" fill="none"/>
            <!-- Leaves -->
            <path d="M48 35 C 32 32 28 48 48 54 C 49 44 38 39 48 35 Z" fill="url(#leaf-grad-1)" />
            <path d="M48 35 C 64 30 68 46 48 52 C 47 42 58 37 48 35 Z" fill="url(#leaf-grad-2)" />
          </svg>
        </div>

        <span class="arbor-status-label" id="arbor-status">Focus</span>
      </div>
    `;

    shadowRoot.appendChild(card);
    widgetCard = card;

    // Add drag support (Drag Card to move the root container)
    makeDraggable(card, widgetRoot);

    // Double click card to minimize/maximize (restores on double click)
    card.addEventListener('dblclick', toggleMinimize);

    // Retrieve and apply last saved coordinates
    safeStorageGet(['widgetCoords']).then((coordsData) => {
      if (coordsData && coordsData.widgetCoords) {
        const { x, y } = coordsData.widgetCoords;
        // Verify coordinates fit within current screen bounds to self-heal bad values
        let checkedX = x;
        let checkedY = y;
        
        const cardWidth = 140;
        const cardHeight = 140;
        
        if (typeof checkedX !== 'number' || checkedX < 10 || checkedX > window.innerWidth - cardWidth) {
          checkedX = window.innerWidth - cardWidth - 24;
        }
        if (typeof checkedY !== 'number' || checkedY < 10 || checkedY > window.innerHeight - cardHeight) {
          checkedY = 24;
        }
        
        widgetRoot.style.bottom = 'auto';
        widgetRoot.style.right = 'auto';
        widgetRoot.style.left = checkedX + 'px';
        widgetRoot.style.top = checkedY + 'px';
      }
    });
  }

  function removeWidgetDOM() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (widgetRoot) {
      widgetRoot.remove();
      widgetRoot = null;
      shadowRoot = null;
      widgetCard = null;
    }
  }

  function playBloomAndRemove() {
    if (isRemoving) return;
    isRemoving = true;

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    if (widgetCard) {
      widgetCard.classList.add('arbor-completed');
    }

    setTimeout(() => {
      removeWidgetDOM();
      isRemoving = false;
    }, 800); // 800ms completes CSS bloom transition
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    safeStorageSet({ widgetMinimized: isMinimized });
    
    if (!widgetCard) return;
    if (isMinimized) {
      widgetCard.classList.add('arbor-minimized');
    } else {
      widgetCard.classList.remove('arbor-minimized');
    }
  }

  function updateWidgetTick() {
    if (!shadowRoot || !activeSession || !widgetCard || isRemoving) return;

    const countdown = widgetCard.querySelector('#arbor-countdown');
    const statusLabel = widgetCard.querySelector('#arbor-status');
    const progressBar = widgetCard.querySelector('.arbor-progress-bar');

    let remainingMs;
    const isBreak = activeSession.isBreak || activeSession.treeType === 'break';

    if (activeSession.isPaused) {
      remainingMs = activeSession.remainingTime;
      widgetCard.classList.add('arbor-paused');
      widgetCard.classList.remove('arbor-break');
      if (statusLabel) statusLabel.textContent = 'Paused';
    } else if (isBreak) {
      remainingMs = activeSession.endTime - Date.now();
      widgetCard.classList.remove('arbor-paused');
      widgetCard.classList.add('arbor-break');
      if (statusLabel) statusLabel.textContent = 'Break';
    } else {
      remainingMs = activeSession.endTime - Date.now();
      widgetCard.classList.remove('arbor-paused');
      widgetCard.classList.remove('arbor-break');
      if (statusLabel) statusLabel.textContent = 'Focus';
    }

    if (remainingMs <= 0) {
      playBloomAndRemove();
      return;
    }

    // Format Countdown digits
    const totalSecs = Math.max(0, Math.floor(remainingMs / 1000));
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;

    if (countdown) {
      countdown.textContent = `${padMins}:${padSecs}`;
    }

    // SVG Progress Bar Math
    const totalDurationSeconds = activeSession.duration * 60;
    const elapsedSeconds = totalDurationSeconds - totalSecs;
    const progressPercent = totalDurationSeconds > 0 ? Math.min(1, Math.max(0, elapsedSeconds / totalDurationSeconds)) : 0;

    const radius = 62;
    const circumference = 2 * Math.PI * radius; // ~389.55
    const offset = circumference * (1 - progressPercent);

    if (progressBar) {
      progressBar.style.strokeDasharray = `${circumference}`;
      progressBar.style.strokeDashoffset = `${offset}`;
    }
  }

  // Pure vanilla dragging implementation with window boundary guards
  function makeDraggable(dragHandle, elementToMove) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
      e = e || window.event;
      // Prevent drag if click is on SVG progress or minimize button details
      if (e.target.closest('.arbor-action-btn')) return;
      
      e.preventDefault();
      // Mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      
      // Calculate cursor position differences
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      // Calculate new position
      let newTop = elementToMove.offsetTop - pos2;
      let newLeft = elementToMove.offsetLeft - pos1;

      // Window bounds check
      const cardRect = elementToMove.getBoundingClientRect();
      const maxLeft = window.innerWidth - cardRect.width - 10;
      const maxTop = window.innerHeight - cardRect.height - 10;

      newLeft = Math.min(maxLeft, Math.max(10, newLeft));
      newTop = Math.min(maxTop, Math.max(10, newTop));

      // Apply coordinates
      elementToMove.style.bottom = 'auto';
      elementToMove.style.right = 'auto';
      elementToMove.style.top = newTop + 'px';
      elementToMove.style.left = newLeft + 'px';
    }

    function closeDragElement() {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);

      // Save position to local storage
      const rect = elementToMove.getBoundingClientRect();
      safeStorageSet({
        widgetCoords: {
          x: rect.left,
          y: rect.top
        }
      });
    }
  }
})();
