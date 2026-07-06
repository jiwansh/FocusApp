/**
 * Arbor Blocker - Floating Timer Widget Content Script
 * Injects a draggable, floatable timer widget on all webpages during active focus.
 */

(function () {
  let widgetRoot = null;
  let shadowRoot = null;
  let widgetCard = null; // Store card reference globally within script
  let countdownInterval = null;
  let activeSession = null;
  let isMinimized = false;

  // Track Tree Emojis
  const treeAvatars = {
    oak: '🌳',
    bonsai: '🪴',
    cedar: '🌲',
    bamboo: '🎋'
  };

  // Helper to verify that the extension runtime context is valid
  function isContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local;
  }

  // Safe wrapper for chrome.storage.local.get using Promises
  function safeStorageGet(keys) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        resolve({});
        return;
      }
      try {
        chrome.storage.local.get(keys, (result) => {
          resolve(result || {});
        });
      } catch (e) {
        console.warn("Arbor Blocker: Context invalidated or failed to get storage.", e);
        resolve({});
      }
    });
  }

  // Safe wrapper for chrome.storage.local.set
  function safeStorageSet(data) {
    if (!isContextValid()) {
      console.warn("Arbor Blocker: Context invalidated, cannot save settings. Please refresh the page.");
      return;
    }
    try {
      chrome.storage.local.set(data);
    } catch (e) {
      console.warn("Arbor Blocker: Context invalidated or failed to set storage.", e);
    }
  }

  // Safe wrapper for chrome.runtime.getURL
  function safeGetURL(path) {
    if (!isContextValid()) return '';
    try {
      return chrome.runtime.getURL(path);
    } catch (e) {
      console.warn("Arbor Blocker: Context invalidated or failed to get URL.", e);
      return '';
    }
  }

  // 1. Initial State Check
  initWidget();

  // 2. Listen to storage modifications (to dynamically show/hide or pause/resume)
  if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (!isContextValid()) return;
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
      removeWidgetDOM();
    }
  }

  function createWidgetDOM() {
    if (widgetRoot) return; // Already exists

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
    
    // Add internal HTML elements
    card.innerHTML = `
      <span class="arbor-tree-avatar" id="arbor-avatar">🌱</span>
      <div class="arbor-timer-info">
        <span class="arbor-time-countdown" id="arbor-countdown">--:--</span>
        <span class="arbor-status-label" id="arbor-status">Focusing</span>
      </div>
      <div class="arbor-widget-actions">
        <button class="arbor-action-btn" id="arbor-min-btn" title="Minimize/Maximize">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    `;

    shadowRoot.appendChild(card);
    widgetCard = card;

    // Add drag support (Drag Card to move the root container)
    makeDraggable(card, widgetRoot);

    // Setup Toggle Minimize button
    const minBtn = card.querySelector('#arbor-min-btn');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize();
      });
    }

    // Double click card to minimize/maximize as well
    card.addEventListener('dblclick', toggleMinimize);

    // Retrieve and apply last saved coordinates
    safeStorageGet(['widgetCoords']).then((coordsData) => {
      if (coordsData && coordsData.widgetCoords) {
        const { x, y } = coordsData.widgetCoords;
        // Verify coordinates fit within current screen bounds to self-heal bad values
        let checkedX = x;
        let checkedY = y;
        
        const cardWidth = 150;
        const cardHeight = 80;
        
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
    if (!shadowRoot || !activeSession || !widgetCard) return;

    // Query relative to the widgetCard reference for maximum reliability
    const countdown = widgetCard.querySelector('#arbor-countdown');
    const avatar = widgetCard.querySelector('#arbor-avatar');
    const statusLabel = widgetCard.querySelector('#arbor-status');

    let remainingMs;
    if (activeSession.isPaused) {
      remainingMs = activeSession.remainingTime;
      widgetCard.classList.add('arbor-paused');
      if (statusLabel) statusLabel.textContent = 'PADH LO BETA!';
      if (avatar) avatar.textContent = '😢';
    } else {
      remainingMs = activeSession.endTime - Date.now();
      widgetCard.classList.remove('arbor-paused');
      if (statusLabel) statusLabel.textContent = 'Focusing';
      if (avatar) avatar.textContent = treeAvatars[activeSession.treeType] || '🌳';
    }

    if (remainingMs <= 0) {
      removeWidgetDOM();
      return;
    }

    const totalSecs = Math.max(0, Math.floor(remainingMs / 1000));
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const padSecs = secs < 10 ? '0' + secs : secs;
    const padMins = mins < 10 ? '0' + mins : mins;

    if (countdown) {
      countdown.textContent = `${padMins}:${padSecs}`;
    }
  }

  // Pure vanilla dragging implementation with window boundary guards
  function makeDraggable(dragHandle, elementToMove) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
      e = e || window.event;
      // Prevent drag if click is on buttons
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
