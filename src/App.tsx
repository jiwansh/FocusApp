import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Chrome, 
  Settings, 
  Sparkles, 
  Download, 
  FileCode, 
  Info, 
  Blocks, 
  Trash2, 
  Plus, 
  Play, 
  Clock, 
  Undo2, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Shield,
  Volume2,
  FolderMinus,
  Check,
  Search,
  BookOpen,
  Sun,
  Moon,
  RefreshCw,
  AlertTriangle,
  Flame,
  Award,
  Zap,
  HelpCircle,
  FileJson
} from 'lucide-react';
import JSZip from 'jszip';
import { EXTENSION_FILES, ExtensionFile } from './extensionCodeData';

export default function App() {
  // --- Workspace Metadata & Versioning (Changed version to 1.0.1 to verify sync) ---
  const appVersion = "1.0.1";
  const appAuthor = "Arbor Focus Group";

  // --- Theme Mode State & Sync (Defaulting to light mode for the warm cream forest feel, toggleable) ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('arbor_dark_mode');
    return saved !== null ? JSON.parse(saved) : false; // Start in organic light mode
  });

  useEffect(() => {
    localStorage.setItem('arbor_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Workspace clock state: Updates in real-time ---
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Blocker storage simulation (replicates chrome.storage.local lists) ---
  const [blockedSites, setBlockedSites] = useState<string[]>([
    'youtube.com',
    'instagram.com',
    'reddit.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'tiktok.com'
  ]);

  const [allowedSites, setAllowedSites] = useState<string[]>([
    'github.com',
    'docs.oracle.com',
    'stackoverflow.com',
    'gemini.google.com',
    'chatgpt.com'
  ]);

  const [allowedExceptions, setAllowedExceptions] = useState<string[]>([
    'youtube.com/c/takeuforward',
    'youtube.com/@CodeStoryWithMik',
    'youtube.com/playlist'
  ]);

  // --- Focus timer session state ---
  const [focusSession, setFocusSession] = useState<{
    isActive: boolean;
    startTime: number | null;
    endTime: number | null;
    duration: number;
    treeType: 'oak' | 'sunflower' | 'cedar' | 'bamboo';
    progress: number;
  }>({
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 25,
    treeType: 'oak',
    progress: 0
  });

  // --- Blocker Statistics metrics ---
  const [stats, setStats] = useState<{
    totalFocusMinutes: number;
    completedSessions: number;
    currentStreak: number;
    bestStreak: number;
    distractionAttempts: number;
    xp: number;
  }>({
    totalFocusMinutes: 75,
    completedSessions: 3,
    currentStreak: 2,
    bestStreak: 4,
    distractionAttempts: 2,
    xp: 750
  });

  // --- Blocker User Settings ---
  const [settings, setSettings] = useState<{
    strictMode: boolean;
    soundEnabled: boolean;
    redirectTitle: string;
    redirectSubtitle: string;
  }>({
    strictMode: true,
    soundEnabled: true,
    redirectTitle: "Stay Focused, Grow Big!",
    redirectSubtitle: "Your digital tree relies on your hard work. Keep cultivating your focus and shield yourself from trivial distractions!"
  });

  // --- File selector state (Code viewer) ---
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(EXTENSION_FILES[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [selectedOptionTab, setSelectedOptionTab] = useState<'blocklist' | 'allowlist' | 'exceptions' | 'experience'>('blocklist');

  // --- Mock browser simulator states ---
  const [browserUrl, setBrowserUrl] = useState<string>('google.com');
  const [currentRenderedPage, setCurrentRenderedPage] = useState<'google' | 'web' | 'blocked' | 'options'>('google');
  const [previousUrl, setPreviousUrl] = useState<string>('google.com');
  const [extensionPopupOpened, setExtensionPopupOpened] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ title: string; text: string } | null>(null);

  // --- Extension popup configuration setup ---
  const [selectedSetupTree, setSelectedSetupTree] = useState<'oak' | 'sunflower' | 'cedar' | 'bamboo'>('oak');
  const [selectedSetupMins, setSelectedSetupMins] = useState<number>(25);
  const [isCustomSetup, setIsCustomSetup] = useState<boolean>(false);
  const [customSliderMins, setCustomSliderMins] = useState<number>(30);

  // --- Form inputs ---
  const [newBlockedUrl, setNewBlockedUrl] = useState<string>('');
  const [newAllowedUrl, setNewAllowedUrl] = useState<string>('');
  const [newExceptionPath, setNewExceptionPath] = useState<string>('');

  const [expTitleInput, setExpTitleInput] = useState<string>(settings.redirectTitle);
  const [expSubInput, setExpSubInput] = useState<string>(settings.redirectSubtitle);

  // Sync motivator text inputs on load
  useEffect(() => {
    setExpTitleInput(settings.redirectTitle);
    setExpSubInput(settings.redirectSubtitle);
  }, [settings]);

  // --- Mock loader states ---
  const [simulatedWebSearchQuery, setSimulatedWebSearchQuery] = useState<string>('');
  const [simulatedLoadProgress, setSimulatedLoadProgress] = useState<boolean>(false);

  // --- Timer reference for clock countdown ---
  const [remainingTimeText, setRemainingTimeText] = useState<string>('25:00');
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tree Visual Stage Mapping
  const treeStages = {
    oak:    ['🌱', '🌿', '🌳', '🌳✨'],
    sunflower: ['🌱', '🌻', '🌻', '🌻✨'],
    cedar:  ['🌱', '🌿', '🌲', '🌲✨'],
    bamboo: ['🌱', '🎋', '🎋', '🎋✨']
  };

  // Helper: Retrieve growing status emoji/label based on focus progress percentage
  const getTreeVisual = (type: 'oak' | 'sunflower' | 'cedar' | 'bamboo', pct: number) => {
    const list = treeStages[type] || treeStages.oak;
    if (pct < 10) return { icon: list[0], label: "Planted Seedling" };
    if (pct < 40) return { icon: list[1], label: "Sprouting Roots" };
    if (pct < 75) return { icon: list[2], label: "Sapling Stage" };
    return { icon: list[3], label: "Majestic Mature Canopy!" };
  };

  // Toast notification notifier helper
  const triggerNotification = (title: string, text: string) => {
    setNotification({ title, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Web Audio synthesizer chime generator
  const playSimulatedChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc2.start();

      setTimeout(() => {
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      }, 150);

      osc.stop(audioCtx.currentTime + 1.2);
      osc2.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.log("Audio contexts pending permissions on frame load.", e);
    }
  };

  // Timer Interval Effect: Manages active focus clock countdown
  useEffect(() => {
    if (focusSession.isActive && focusSession.endTime) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      
      const updateTimer = () => {
        const remainingMs = focusSession.endTime! - Date.now();
        if (remainingMs <= 0) {
          completeFocusSession();
          return;
        }

        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setRemainingTimeText(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);

        // Calculate progress percentage
        const totalDurationSeconds = focusSession.duration * 60;
        const elapsedSeconds = totalDurationSeconds - totalSecs;
        const progressPct = Math.min((elapsedSeconds / totalDurationSeconds) * 100, 100);
        
        setFocusSession(prev => ({
          ...prev,
          progress: progressPct
        }));
      };

      updateTimer();
      countdownTimerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [focusSession.isActive, focusSession.endTime]);

  // Complete Focus: Updates user stats, streaks, triggers chimes, and resets viewports
  const completeFocusSession = () => {
    const minEarned = focusSession.duration;
    const xpEarned = minEarned * 10;

    setStats(prev => ({
      ...prev,
      totalFocusMinutes: prev.totalFocusMinutes + minEarned,
      completedSessions: prev.completedSessions + 1,
      xp: prev.xp + xpEarned,
      currentStreak: prev.currentStreak + 1
    }));

    setFocusSession(prev => ({
      ...prev,
      isActive: false,
      progress: 100
    }));

    triggerNotification(
      "Focus Complete! 🌳✨",
      `Outstanding! You focused for ${minEarned}m and matured a beautiful digital ${focusSession.treeType} (+${xpEarned} XP)!`
    );

    playSimulatedChime();
    
    if (currentRenderedPage === 'blocked') {
      setCurrentRenderedPage('google');
      setBrowserUrl('google.com');
    }
  };

  // Site blocking checker: Analyzes browser navigation request against rules
  const evaluateBrowserNavigation = (targetUrl: string, startSessionObj?: typeof focusSession) => {
    const sanitizedInput = targetUrl.trim().toLowerCase();
    const sessionActive = startSessionObj ? startSessionObj.isActive : focusSession.isActive;

    if (!sessionActive) {
      if (sanitizedInput.includes('options.html') || sanitizedInput.includes('chrome-extension://')) {
        setCurrentRenderedPage('options');
      } else if (sanitizedInput === 'google.com' || sanitizedInput === '') {
        setCurrentRenderedPage('google');
      } else {
        setCurrentRenderedPage('web');
      }
      return;
    }

    // Blocker active. Evaluate lists.
    const isMatchingBlock = blockedSites.some(blockedDomain => {
      return sanitizedInput.includes(blockedDomain);
    });

    if (isMatchingBlock) {
      const matchesException = allowedExceptions.some(excPath => {
        return excPath && excPath.trim() && sanitizedInput.includes(excPath.toLowerCase().trim());
      });

      if (matchesException) {
        setCurrentRenderedPage('web');
        triggerNotification("Smart Exception Allowed 🎓", `Bypassing filter block because "${sanitizedInput}" matches allowed study path.`);
      } else {
        setCurrentRenderedPage('blocked');
        setStats(prev => ({
          ...prev,
          distractionAttempts: prev.distractionAttempts + 1
        }));
        triggerNotification("Website Intercepted! 🚫", "You attempted to open a blocked site. Redirected to Arbor focus clock.");
      }
    } else {
      setCurrentRenderedPage('web');
    }
  };

  // URL Submission handler
  const handleGoUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let sanitized = browserUrl.trim().toLowerCase();
    if (!sanitized) {
      sanitized = 'google.com';
      setBrowserUrl(sanitized);
    }
    
    setSimulatedLoadProgress(true);
    setTimeout(() => {
      setSimulatedLoadProgress(false);
      evaluateBrowserNavigation(sanitized);
    }, 280);
  };

  // Start Focus session
  const handleStartFocusSim = () => {
    const mins = isCustomSetup ? customSliderMins : selectedSetupMins;
    const durMs = mins * 60 * 1000;
    const now = Date.now();

    const newSession = {
      isActive: true,
      startTime: now,
      endTime: now + durMs,
      duration: mins,
      treeType: selectedSetupTree,
      progress: 0
    };

    setFocusSession(newSession);
    setExtensionPopupOpened(false);

    triggerNotification(
      "Focus Cycle Started 🌿",
      `Your ${mins}m deep work timer has begun. Stay away from blocked social feeds!`
    );

    evaluateBrowserNavigation(browserUrl, newSession);
  };

  // Stop Focus session
  const handleYieldFocusSim = () => {
    const confirmWithdraw = window.confirm("Are you sure you want to stop? Your growing seedling will wither and your current XP will freeze.");
    
    if (confirmWithdraw) {
      setFocusSession(prev => ({
        ...prev,
        isActive: false,
        startTime: null,
        endTime: null,
        progress: 0
      }));

      triggerNotification(
        "Timer Cancelled 🥀",
        "Your focus progress was aborted. The active sapling has withered."
      );

      if (currentRenderedPage === 'blocked') {
        setCurrentRenderedPage('google');
        setBrowserUrl('google.com');
      }
    }
  };

  // Add domain to blocklist
  const handleAddBlocked = () => {
    const cleaned = newBlockedUrl.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    if (!cleaned) return;

    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active! Blocklist modifications are suspended until your timer completes.");
      return;
    }

    if (!blockedSites.includes(cleaned)) {
      setBlockedSites([...blockedSites, cleaned]);
      setNewBlockedUrl('');
      triggerNotification("Blocklist Updated", `Added ${cleaned} to blocklist filters.`);
    } else {
      alert("This domain is already on your blocklist.");
    }
  };

  // Delete domain from blocklist
  const handleDeleteBlocked = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active! Modifications suspended.");
      return;
    }
    const filtered = blockedSites.filter((_, i) => i !== idx);
    setBlockedSites(filtered);
    triggerNotification("Blocklist Cleaned", "Removed site filter.");
  };

  // Add domain to allowlist
  const handleAddAllowed = () => {
    const cleaned = newAllowedUrl.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    if (!cleaned) return;

    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active! Allowlist modifications suspended.");
      return;
    }

    if (!allowedSites.includes(cleaned)) {
      setAllowedSites([...allowedSites, cleaned]);
      setNewAllowedUrl('');
      triggerNotification("Allowlist Updated", `Marked ${cleaned} as productive helper.`);
    }
  };

  // Delete domain from allowlist
  const handleDeleteAllowed = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active!");
      return;
    }
    setAllowedSites(allowedSites.filter((_, i) => i !== idx));
  };

  // Add smart path exception
  const handleAddException = () => {
    const cleaned = newExceptionPath.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    if (!cleaned) return;

    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active!");
      return;
    }

    if (!allowedExceptions.includes(cleaned)) {
      setAllowedExceptions([...allowedExceptions, cleaned]);
      setNewExceptionPath('');
      triggerNotification("Exceptions Updated", `Added smart path bypass: ${cleaned}`);
    }
  };

  // Delete smart path exception
  const handleDeleteException = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active!");
      return;
    }
    setAllowedExceptions(allowedExceptions.filter((_, i) => i !== idx));
  };

  // Save customized motivation copy
  const handleSaveMotivationStyle = () => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Locked under Strict Focus!");
      return;
    }
    setSettings(prev => ({
      ...prev,
      redirectTitle: expTitleInput || "Stay Focused, Grow Big!",
      redirectSubtitle: expSubInput || "Cultivate deep work habits."
    }));
    triggerNotification("Redirect Customization Saved", "Redirect pages updated successfully.");
  };

  // Reset blocker simulator stats
  const handleResetSimulatorStats = () => {
    if (window.confirm("Complete reset focus stats? This clears XP, streaking records, and grown history.")) {
      setStats({
        totalFocusMinutes: 0,
        completedSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        distractionAttempts: 0,
        xp: 0
      });
      triggerNotification("Statistics Cleared", "Grown records reset to zero.");
    }
  };

  // --- Packager: Zips the extension codebase with canvas icons ---
  const handleDownloadUnpackedExtension = async () => {
    setIsZipping(true);
    triggerNotification("Building Extension ZIP...", "Drawing circular canvases and packaging Manifest V3 files...");
    
    try {
      const zip = new JSZip();

      // Write compiled template files into the zip package
      EXTENSION_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Draw tree logo icons dynamically in HTML canvas
      const drawIconBlob = (size: number): Promise<Blob> => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;

          // Primary badge base (Forest emerald green)
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#15803d';
          ctx.fill();

          // Outer ring border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = size * 0.08;
          ctx.stroke();

          // Emoji text node
          ctx.font = `${size * 0.65}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌳', size / 2, size / 2 * 1.05);

          canvas.toBlob((blob) => {
            resolve(blob || new Blob());
          }, 'image/png');
        });
      };

      const icon16 = await drawIconBlob(16);
      const icon48 = await drawIconBlob(48);
      const icon128 = await drawIconBlob(128);

      const iconsFolder = zip.folder("icons")!;
      iconsFolder.file("icon16.png", icon16);
      iconsFolder.file("icon48.png", icon48);
      iconsFolder.file("icon128.png", icon128);

      // Package zip and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `arbor-blocker-extension-v${appVersion}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerNotification("Package Compiled! 🎉", `ZIP bundle version ${appVersion} downloaded. Load in chrome://extensions/!`);
    } catch (err) {
      console.error(err);
      triggerNotification("Build Failure", "Error compiling chrome zip package.");
    } finally {
      setIsZipping(false);
    }
  };

  // Copy code helper
  const handleCopyFileToClipboard = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-mesh-gradient-dark bg-grid-overlay-dark text-neutral-100' 
        : 'bg-[#faf9f4] bg-grid-overlay-light text-[#1c1d1a]'
    } font-sans selection:bg-emerald-500/20 selection:text-emerald-300 antialiased flex flex-col`}>
      
      {/* ================= HEADER BRANDING BAR ================= */}
      <header className={`border-b transition-colors duration-300 px-6 py-4 sticky top-0 z-50 backdrop-blur-md ${
        darkMode 
          ? 'border-neutral-850 bg-[#0c101b]/70' 
          : 'border-[#ebdcb9] bg-white/70'
      }`}>
        <div className="max-w-7xl w-full mx-auto flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Vercel geometric logo symbol */}
            <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-400 fill-current" viewBox="0 0 75 65">
              <path d="M37.5 0L75 65H0L37.5 0Z" />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-widest uppercase font-mono text-[#1c1d1a] dark:text-white">
                  ARBOR WORKSPACE
                </h1>
                <span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  v{appVersion}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Chrome Extension compiler templates and live sandbox simulator.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Workspace Clock */}
            <div className="hidden md:flex flex-col items-end border-r border-neutral-200 dark:border-neutral-800 pr-4">
              <span className="text-[9px] font-mono text-neutral-450 dark:text-neutral-500 tracking-wider">CHRONO WATCH</span>
              <span className="text-xs font-semibold font-mono">{currentTime || "Syncing..."}</span>
            </div>

            {/* Dark/Light mode theme switcher */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full border transition-all active:scale-90 ${
                darkMode 
                  ? 'border-neutral-800 hover:bg-neutral-900 text-neutral-400' 
                  : 'border-[#ebdcb9] hover:bg-[#f0ebd7] text-neutral-600'
              }`}
              title={darkMode ? "Switch to Light Forest" : "Switch to Midnight Forest"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-800" />}
            </button>

            {/* Downloader Exporter button */}
            <button 
              id="download-unpacked-header-btn"
              onClick={handleDownloadUnpackedExtension}
              disabled={isZipping}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs ${
                darkMode 
                  ? 'bg-white hover:bg-neutral-100 text-neutral-950' 
                  : 'bg-[#1c1d1a] hover:bg-neutral-800 text-white'
              }`}
            >
              {isZipping ? (
                <span className="animate-spin text-sm">🌱</span>
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download Unpacked ZIP
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN DASHBOARD CONTENT GRID ================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT SECTION: COGNITIVE INTERACTIVE SANDBOX (7 Columns) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="simulator-sandbox">
          <div className={`border rounded-2xl overflow-hidden flex flex-col min-h-[640px] transition-all duration-300 ${
            darkMode 
              ? 'border-neutral-800 bg-[#0c101b] shadow-xl' 
              : 'border-[#ebdcb9] bg-white shadow-vercel'
          }`}>
            
            {/* Window control bar (replicates macOS chrome headers) */}
            <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-300 ${
              darkMode ? 'bg-[#0f1626] border-neutral-850' : 'bg-[#f0ebd7] border-[#ebdcb9]'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="ml-2 font-mono text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                  CHROME DESKTOP SIMULATOR
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {focusSession.isActive && (
                  <span className="animate-pulse inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-[9px] font-bold text-red-500 border border-red-500/20">
                    <Shield className="w-3 h-3" />
                    BLOCK ACTIVE ({remainingTimeText})
                  </span>
                )}
                <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold bg-neutral-200/50 dark:bg-neutral-850 px-2 py-0.5 rounded">
                  v{appVersion}
                </span>
              </div>
            </div>

            {/* Virtual address input bar & extension action widgets */}
            <div className={`border-b p-2.5 flex items-center gap-3 transition-colors duration-300 ${
              darkMode ? 'bg-[#121b2b] border-neutral-850' : 'bg-[#f5f0db] border-[#ebdcb9]'
            }`}>
              {/* Back navigation button */}
              <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
                <button 
                  onClick={() => {
                    setBrowserUrl(previousUrl);
                    evaluateBrowserNavigation(previousUrl);
                  }}
                  className={`p-1.5 rounded-md transition-colors ${
                    darkMode ? 'hover:bg-neutral-800' : 'hover:bg-[#ebdcb9]'
                  }`}
                  title="Navigate back"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* URL input field */}
              <form onSubmit={handleGoUrl} className={`flex-1 flex items-center border rounded-lg px-3 py-1.5 shadow-xs transition-all focus-within:ring-1 focus-within:ring-emerald-500/40 ${
                darkMode ? 'bg-black border-neutral-800' : 'bg-white border-[#ebdcb9]'
              }`}>
                <Chrome className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="Type domain e.g. youtube.com, github.com, x.com..."
                  className="flex-1 bg-transparent text-xs focus:outline-hidden font-mono"
                />
              </form>

              {/* Extension bar pinned items */}
              <div className="relative flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Extensions:</span>
                
                {/* Active extension leaf icon - toggles setup/timer popups */}
                <button
                  id="target-extension-icon"
                  onClick={() => setExtensionPopupOpened(!extensionPopupOpened)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 ${
                    focusSession.isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-xs' 
                      : darkMode ? 'bg-black border-neutral-800 text-neutral-400' : 'bg-white border-[#ebdcb9] text-neutral-600'
                  }`}
                  title="Arbor Popup Widget"
                >
                  {focusSession.isActive ? (
                    <div className="relative">
                      <span className="text-base select-none">🌳</span>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 text-[8px] font-mono font-bold text-white flex items-center justify-center scale-90 border border-white dark:border-black">
                        {Math.ceil((focusSession.endTime! - Date.now()) / 60000)}m
                      </span>
                    </div>
                  ) : (
                    <span className="text-base opacity-80 select-none">🌱</span>
                  )}
                </button>

                {/* Blocker dashboard configuration button */}
                <button
                  onClick={() => {
                    setBrowserUrl('chrome-extension://options.html');
                    setCurrentRenderedPage('options');
                    setExtensionPopupOpened(false);
                  }}
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer active:scale-95 ${
                    currentRenderedPage === 'options' 
                      ? darkMode ? 'bg-white text-black border-white' : 'bg-[#1c1d1a] text-white border-[#1c1d1a]' 
                      : darkMode ? 'bg-black border-neutral-850 hover:bg-neutral-900 text-neutral-400' : 'bg-white border-[#ebdcb9] hover:bg-[#fbf9f4] text-neutral-700'
                  }`}
                  title="Extension Options Dashboard"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* ================= SIMULATOR FLOATING EXTENSION POPUP WIDGET ================= */}
                <AnimatePresence>
                  {extensionPopupOpened && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`absolute right-0 top-11 w-[320px] border rounded-2xl shadow-xl z-50 overflow-hidden ${
                        darkMode ? 'bg-[#0c101b] border-neutral-800 text-slate-200' : 'bg-[#fbf9f4] border-[#ebdcb9] text-[#1c1d1a]'
                      }`}
                    >
                      {/* Popup Header */}
                      <div className={`border-b px-4 py-3 flex items-center justify-between ${
                        darkMode ? 'bg-[#0f1626] border-neutral-850' : 'bg-white border-[#ebdcb9]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none">🌳</span>
                          <span className="font-bold text-xs tracking-tight font-mono uppercase">Arbor focus.</span>
                        </div>
                        <button 
                          onClick={() => {
                            setBrowserUrl('chrome-extension://options.html');
                            setCurrentRenderedPage('options');
                            setExtensionPopupOpened(false);
                          }}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
                            darkMode ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-500' : 'border-neutral-200 hover:bg-[#f0ebd7] text-neutral-500'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Popup Main Panel */}
                      <div className="p-4 flex flex-col gap-4">
                        {focusSession.isActive ? (
                          /* Active focus timer widget viewport */
                          <div className="flex flex-col items-center gap-4 py-2">
                            <div className="flex flex-col items-center">
                              <span className="text-5xl mb-2 animate-bounce select-none">
                                {getTreeVisual(focusSession.treeType, focusSession.progress).icon}
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide">
                                {getTreeVisual(focusSession.treeType, focusSession.progress).label}
                              </span>
                            </div>

                            <div className="text-center w-full">
                              <span className="font-mono font-bold text-3xl tracking-tight">
                                {remainingTimeText}
                              </span>
                              <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${
                                darkMode ? 'bg-neutral-800' : 'bg-[#ebdcb9]'
                              }`}>
                                <div 
                                  className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-1000"
                                  style={{ width: `${focusSession.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-[9px] text-neutral-450 dark:text-neutral-500 mt-2 font-mono uppercase tracking-wider">Cultivating digital canopy</p>
                            </div>

                            <button 
                              onClick={handleYieldFocusSim}
                              className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold border border-red-500/20 text-[11px] transition-all cursor-pointer"
                            >
                              Yield Timer (Wither Sapling)
                            </button>
                          </div>
                        ) : (
                          /* Setup focus widget setup viewport */
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-[9px] font-mono uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-2 tracking-wider">Select Seed Type</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {(Object.keys(treeStages) as Array<keyof typeof treeStages>).map((tree) => (
                                  <button
                                    key={tree}
                                    onClick={() => setSelectedSetupTree(tree)}
                                    className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                      selectedSetupTree === tree 
                                        ? 'border-emerald-700 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' 
                                        : darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-400 hover:border-neutral-750' : 'border-[#ebdcb9] bg-white text-neutral-600 hover:border-neutral-300'
                                    }`}
                                  >
                                    <span className="text-xl select-none">
                                      {tree === 'oak' ? '🌳' : tree === 'sunflower' ? '🌻' : tree === 'cedar' ? '🌲' : '🎋'}
                                    </span>
                                    <span className="text-[9px] capitalize tracking-tight font-semibold">{tree}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Preset focus times */}
                            <div>
                              <p className="text-[9px] font-mono uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-2 tracking-wider">Focus Duration</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[25, 50, 90].map(mins => (
                                  <button
                                    key={mins}
                                    onClick={() => {
                                      setSelectedSetupMins(mins);
                                      setIsCustomSetup(false);
                                    }}
                                    className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                                      selectedSetupMins === mins && !isCustomSetup
                                        ? darkMode ? 'bg-white text-black border-white' : 'bg-[#1c1d1a] text-white border-[#1c1d1a] font-bold'
                                        : darkMode ? 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-800' : 'bg-white border-[#ebdcb9] hover:bg-neutral-50 text-neutral-600'
                                    }`}
                                  >
                                    {mins}m
                                  </button>
                                ))}
                                <button
                                  onClick={() => setIsCustomSetup(true)}
                                  className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                                    isCustomSetup
                                      ? darkMode ? 'bg-white text-black border-white' : 'bg-[#1c1d1a] text-white border-[#1c1d1a] font-bold'
                                      : darkMode ? 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-800' : 'bg-white border-[#ebdcb9] hover:bg-neutral-50 text-neutral-600'
                                  }`}
                                >
                                  Custom
                                </button>
                              </div>
                            </div>

                            {/* Custom slider input (if custom chosen) */}
                            {isCustomSetup && (
                              <div className={`border rounded-xl p-3 ${
                                darkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-[#ebdcb9]'
                              }`}>
                                <div className="flex justify-between text-xs mb-1 font-mono">
                                  <span className="text-neutral-400">Time:</span>
                                  <span className="font-bold">{customSliderMins} mins</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={5} 
                                  max={180} 
                                  step={5} 
                                  value={customSliderMins}
                                  onChange={(e) => setCustomSliderMins(parseInt(e.target.value, 10))}
                                  className="w-full accent-emerald-600 cursor-pointer"
                                />
                              </div>
                            )}

                            <button
                              onClick={handleStartFocusSim}
                              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] text-xs shadow-xs ${
                                darkMode 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Sow a Focus Seed
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Popup widget footer statistics */}
                      <div className={`border-t px-4 py-3 flex items-center justify-between text-[10px] font-mono font-semibold ${
                        darkMode ? 'bg-[#0f1626] border-neutral-850 text-neutral-400' : 'bg-white border-[#ebdcb9] text-neutral-500'
                      }`}>
                        <span title="Continuous Day Streaks">🔥 {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}</span>
                        <span title="Total XP Points">⭐ {stats.xp} XP</span>
                        <span title="Cumulative Duration">⏱️ {stats.totalFocusMinutes}m</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Simulated browser active viewport frame */}
            <div className="flex-1 bg-neutral-50 dark:bg-[#0c0d12] flex flex-col relative overflow-y-auto">
              
              {/* PAGE VIEWPORT CASE 1: Google Homepage Search Simulator */}
              {currentRenderedPage === 'google' && (
                <div className="flex-1 bg-white dark:bg-[#0c101b] flex flex-col justify-center items-center p-8 transition-colors duration-300">
                  <div className="flex flex-col items-center gap-1 text-center max-w-sm">
                    <span className="text-5xl select-none mb-3">🔍</span>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Arbor Search.
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                      Local sandbox web engine. Type domain directly or query below to test rules.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const sanitized = simulatedWebSearchQuery.trim();
                      if (sanitized) {
                        setBrowserUrl(sanitized);
                        handleGoUrl();
                      }
                    }}
                    className={`w-full max-w-md mt-6 flex gap-2 border rounded-xl px-4 py-2.5 transition-all focus-within:ring-1 focus-within:ring-emerald-500/40 shadow-xs ${
                      darkMode ? 'bg-black border-neutral-800' : 'bg-[#faf9f4] border-[#ebdcb9]'
                    }`}
                  >
                    <Search className="w-4 h-4 text-neutral-400 shrink-0 self-center" />
                    <input 
                      type="text" 
                      placeholder="e.g., youtube.com, reddit.com, github.com..."
                      value={simulatedWebSearchQuery}
                      onChange={(e) => setSimulatedWebSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs focus:outline-hidden font-mono"
                    />
                  </form>

                  {/* Fast shortcut trigger badges */}
                  <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
                    <span className="text-[10px] text-neutral-450 dark:text-neutral-550 font-mono tracking-wider self-center mr-2">QUICK TEST:</span>
                    <button 
                      onClick={() => { setBrowserUrl('youtube.com'); evaluateBrowserNavigation('youtube.com'); }}
                      className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 text-[10px] font-semibold transition-all hover:bg-red-500/20 cursor-pointer"
                    >
                      📺 youtube.com (Blocked)
                    </button>
                    <button 
                      onClick={() => { setBrowserUrl('youtube.com/c/takeuforward'); evaluateBrowserNavigation('youtube.com/c/takeuforward'); }}
                      className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold transition-all hover:bg-emerald-500/20 cursor-pointer"
                    >
                      🎓 Exception: takeuforward
                    </button>
                    <button 
                      onClick={() => { setBrowserUrl('github.com'); evaluateBrowserNavigation('github.com'); }}
                      className={`px-3 py-1 rounded-full border text-[10px] font-semibold transition-all cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-250 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      💻 github.com (Allowed)
                    </button>
                  </div>
                </div>
              )}

              {/* PAGE VIEWPORT CASE 2: Mock Productive Allowed Webpage view */}
              {currentRenderedPage === 'web' && (
                <div className="flex-1 bg-neutral-50 dark:bg-[#05080c] p-6 flex flex-col transition-colors duration-300">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-850 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-sm font-bold select-none">🌐</span>
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider font-mono">{browserUrl}</h2>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">Status: Allowed Bypassed</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-450 dark:text-neutral-500">Secure simulated view</span>
                  </div>

                  <div className={`flex-1 border rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-xs transition-colors ${
                    darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                  }`}>
                    <h3 className="text-emerald-700 dark:text-emerald-400 text-xl font-bold tracking-tight">
                      Productive Portal Active.
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2 max-w-sm leading-relaxed">
                      You are allowed access to this page by your current manifest configuration. Use this session to focus.
                    </p>
                    
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 max-w-md text-left">
                      <span className="text-xl select-none">💡</span>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Study Guidelines</h4>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stay focused. The seedling will mature when the countdown completes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE VIEWPORT CASE 3: INTERCEPTED / BLOCKED OVERRIDE motiv-screen */}
              {currentRenderedPage === 'blocked' && (
                <div className="flex-1 bg-neutral-50 dark:bg-[#05080c] flex items-center justify-center p-6 transition-colors duration-300">
                  <div className={`w-full max-w-md border rounded-2xl p-6 shadow-vercel text-center transition-colors ${
                    darkMode ? 'bg-black border-neutral-800' : 'bg-white border-[#ebdcb9]'
                  }`}>
                    
                    {/* Header blocker icon bar */}
                    <div className="flex items-center justify-center gap-2 mb-4 border-b border-neutral-100 dark:border-neutral-900 pb-3">
                      <span className="text-lg select-none">🌳</span>
                      <h2 className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-400">Arbor Blocker</h2>
                      <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-500/20 font-mono">
                        FOCUS LOCKED
                      </span>
                    </div>

                    {/* Growing illustration visual */}
                    <div className="my-6 flex flex-col items-center">
                      <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border shadow-inner ${
                        darkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-[#faf9f4] border-[#ebdcb9]'
                      }`}>
                        <div className="absolute inset-0.5 border border-dashed border-emerald-500/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        <span className="text-5xl select-none relative z-10 tree-glow-active">
                          {getTreeVisual(focusSession.treeType, focusSession.progress).icon}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mt-4 border border-emerald-500/20 uppercase tracking-wider font-mono">
                        {getTreeVisual(focusSession.treeType, focusSession.progress).label}
                      </span>
                    </div>

                    {/* Motivational title details */}
                    <div className="mb-6 px-2">
                      <h3 className="text-lg font-bold tracking-tight leading-snug">
                        {settings.redirectTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                        {settings.redirectSubtitle}
                      </p>
                    </div>

                    {/* Countdown clock stopwatch */}
                    <div className="border-t border-b border-neutral-100 dark:border-neutral-900 py-4 mb-6">
                      <span className="font-mono text-4xl font-bold tracking-tighter block">
                        {remainingTimeText}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-widest mt-1 block">
                        remaining focus session
                      </span>
                    </div>

                    {/* Exception shortcuts list */}
                    <div className={`border rounded-xl p-4 text-left ${
                      darkMode ? 'bg-[#0c101b] border-neutral-850' : 'bg-[#faf9f4] border-[#ebdcb9]'
                    }`}>
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        PRODUCTIVE SHORTCUTS
                      </h4>
                      
                      <div className="flex flex-wrap gap-2">
                        {allowedSites.map(site => (
                          <button
                            key={site}
                            onClick={() => {
                              setBrowserUrl(site);
                              evaluateBrowserNavigation(site);
                            }}
                            className={`px-2.5 py-1.5 border rounded-lg text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                              darkMode 
                                ? 'bg-black border-neutral-800 text-slate-300 hover:border-emerald-500' 
                                : 'bg-white border-[#ebdcb9] text-neutral-700 hover:border-emerald-700'
                            }`}
                          >
                            🌐 {site}
                          </button>
                        ))}
                        {allowedSites.length === 0 && (
                          <span className="text-[10px] text-neutral-450 italic">No exceptions configured. Add items in settings!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE VIEWPORT CASE 4: EXTENSION OPTIONS INTERACTIVE WINDOW (options.html simulator) */}
              {currentRenderedPage === 'options' && (
                <div className="flex-1 bg-[#faf9f4] dark:bg-[#05080c] p-4 md:p-6 overflow-y-auto transition-colors duration-300">
                  
                  {/* Option dashboard header */}
                  <div className={`flex flex-wrap gap-4 items-center justify-between border p-4 rounded-xl shadow-xs mb-6 ${
                    darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none">⚙️</span>
                      <div>
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Arbor Options Panel</h3>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">chrome.storage.local emulator database</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const conf = { blockedSites, allowedSites, allowedExceptions, settings, stats };
                          const blob = new Blob([JSON.stringify(conf, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'arbor-simulated-settings.json';
                          link.click();
                        }}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-colors ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-[#faf9f4] border-[#ebdcb9] text-[#1c1d1a]'
                        }`}
                      >
                        Export JSON
                      </button>
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              try {
                                const parsed = JSON.parse(evt.target?.result as string);
                                if (parsed.blockedSites) setBlockedSites(parsed.blockedSites);
                                if (parsed.allowedSites) setAllowedSites(parsed.allowedSites);
                                if (parsed.allowedExceptions) setAllowedExceptions(parsed.allowedExceptions);
                                if (parsed.settings) setSettings(parsed.settings);
                                triggerNotification("Settings Imported", "Loaded settings profile successfully.");
                              } catch(e) { alert("Invalid settings JSON structure."); }
                            };
                            reader.readAsText(file);
                          };
                          input.click();
                        }}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-colors ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-[#faf9f4] border-[#ebdcb9] text-[#1c1d1a]'
                        }`}
                      >
                        Import JSON
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Active Rules List Section */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                      
                      <div className={`border rounded-xl p-4 shadow-xs ${
                        darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                      }`}>
                        {/* Option Nav tabs bar */}
                        <div className="flex border-b border-neutral-200 dark:border-neutral-850 gap-4 mb-4">
                          <button
                            onClick={() => setSelectedOptionTab('blocklist')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'blocklist' 
                                ? darkMode ? 'border-white text-white' : 'border-[#1c1d1a] text-[#1c1d1a] font-bold' 
                                : 'border-transparent text-neutral-400 dark:text-neutral-500'
                            }`}
                          >
                            🚫 Blocklist
                          </button>
                          <button
                            onClick={() => setSelectedOptionTab('allowlist')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'allowlist' 
                                ? darkMode ? 'border-white text-white' : 'border-[#1c1d1a] text-[#1c1d1a] font-bold' 
                                : 'border-transparent text-neutral-400 dark:text-neutral-500'
                            }`}
                          >
                            ✅ Productive
                          </button>
                          <button
                            onClick={() => setSelectedOptionTab('exceptions')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'exceptions' 
                                ? darkMode ? 'border-white text-white' : 'border-[#1c1d1a] text-[#1c1d1a] font-bold' 
                                : 'border-transparent text-neutral-400 dark:text-neutral-500'
                            }`}
                          >
                            🎓 Exceptions
                          </button>
                        </div>

                        {/* Blocklist Tab panel */}
                        {selectedOptionTab === 'blocklist' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-mono">Social networks and feeds intercepted during active focus cycles:</p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. reddit.com, facebook.com"
                                value={newBlockedUrl}
                                onChange={(e) => setNewBlockedUrl(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`flex-1 text-xs border px-3 py-1.5 rounded-lg disabled:opacity-50 font-mono focus:outline-hidden ${
                                  darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-200' : 'border-[#ebdcb9] bg-[#faf9f4] text-[#1c1d1a]'
                                }`}
                              />
                              <button 
                                onClick={handleAddBlocked}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`px-3.5 py-1.5 disabled:opacity-50 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors ${
                                  darkMode ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-[#1c1d1a] hover:bg-neutral-800 text-white'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Block Domain
                              </button>
                            </div>

                            {focusSession.isActive && settings.strictMode && (
                              <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] rounded-lg flex items-center gap-1.5 font-mono">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                Strict Mode is locked under active focus session.
                              </div>
                            )}

                            <ul className={`border rounded-lg max-h-40 overflow-y-auto divide-y font-mono text-[11px] ${
                              darkMode ? 'border-neutral-850 divide-neutral-850 bg-neutral-950' : 'border-[#ebdcb9] divide-[#ebdcb9] bg-[#faf9f4]/40'
                            }`}>
                              {blockedSites.map((site, index) => (
                                <li key={site} className="px-3.5 py-2 flex items-center justify-between">
                                  <span className="text-neutral-700 dark:text-neutral-350">{site}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteBlocked(index)}
                                      className="text-neutral-400 hover:text-red-500 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Allowlist tab panel */}
                        {selectedOptionTab === 'allowlist' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-mono font-semibold">Exempted productive platforms rendering on blocker shortcuts panel:</p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. github.com, stackoverflow.com"
                                value={newAllowedUrl}
                                onChange={(e) => setNewAllowedUrl(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`flex-1 text-xs border px-3 py-1.5 rounded-lg disabled:opacity-50 font-mono focus:outline-hidden ${
                                  darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-200' : 'border-[#ebdcb9] bg-[#faf9f4] text-[#1c1d1a]'
                                }`}
                              />
                              <button 
                                onClick={handleAddAllowed}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`px-3.5 py-1.5 disabled:opacity-50 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors ${
                                  darkMode ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-[#1c1d1a] hover:bg-neutral-800 text-white'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Allow Domain
                              </button>
                            </div>

                            <ul className={`border rounded-lg max-h-40 overflow-y-auto divide-y font-mono text-[11px] ${
                              darkMode ? 'border-neutral-850 divide-neutral-850 bg-neutral-950' : 'border-[#ebdcb9] divide-[#ebdcb9] bg-[#faf9f4]/40'
                            }`}>
                              {allowedSites.map((site, index) => (
                                <li key={site} className="px-3.5 py-2 flex items-center justify-between">
                                  <span className="text-neutral-700 dark:text-neutral-350">{site}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteAllowed(index)}
                                      className="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Smart Exceptions tab panel */}
                        {selectedOptionTab === 'exceptions' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-mono leading-normal">
                              Granular paths to allow specific studies inside blocked networks:
                            </p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. youtube.com/c/takeuforward"
                                value={newExceptionPath}
                                onChange={(e) => setNewExceptionPath(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`flex-1 text-xs border px-3 py-1.5 rounded-lg disabled:opacity-50 font-mono focus:outline-hidden ${
                                  darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-200' : 'border-[#ebdcb9] bg-[#faf9f4] text-[#1c1d1a]'
                                }`}
                              />
                              <button 
                                onClick={handleAddException}
                                disabled={focusSession.isActive && settings.strictMode}
                                className={`px-3.5 py-1.5 disabled:opacity-50 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors ${
                                  darkMode ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-[#1c1d1a] hover:bg-neutral-800 text-white'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Permit Path
                              </button>
                            </div>

                            <ul className={`border rounded-lg max-h-40 overflow-y-auto divide-y font-mono text-[11px] ${
                              darkMode ? 'border-neutral-850 divide-neutral-850 bg-neutral-950' : 'border-[#ebdcb9] divide-[#ebdcb9] bg-[#faf9f4]/40'
                            }`}>
                              {allowedExceptions.map((exc, index) => (
                                <li key={exc} className="px-3.5 py-2 flex items-center justify-between">
                                  <span className="text-neutral-700 dark:text-neutral-350">{exc}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteException(index)}
                                      className="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Custom Motivation text configuration */}
                      <div className={`border rounded-xl p-4 shadow-xs ${
                        darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                      }`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono">Custom Redirect Display Copy</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono">HEADER TEXT</label>
                            <input 
                              type="text" 
                              value={expTitleInput}
                              onChange={(e) => setExpTitleInput(e.target.value)}
                              placeholder="Stay Focused, Grow Big!"
                              className={`text-xs border px-3 py-1.5 rounded-lg focus:outline-hidden ${
                                darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-200' : 'border-[#ebdcb9] bg-[#faf9f4] text-[#1c1d1a]'
                              }`}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono">BODY DESCRIPTION</label>
                            <textarea 
                              value={expSubInput}
                              onChange={(e) => setExpSubInput(e.target.value)}
                              rows={2}
                              placeholder="Your digital crops depend on you..."
                              className={`text-xs border px-3 py-1.5 rounded-lg focus:outline-hidden ${
                                darkMode ? 'border-neutral-850 bg-neutral-900 text-neutral-200' : 'border-[#ebdcb9] bg-[#faf9f4] text-[#1c1d1a]'
                              }`}
                            />
                          </div>
                        </div>

                        <button 
                          onClick={handleSaveMotivationStyle}
                          disabled={focusSession.isActive && settings.strictMode}
                          className={`px-4 py-2 disabled:opacity-50 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            darkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-[#1c1d1a] hover:bg-neutral-800 text-white'
                          }`}
                        >
                          Update Motivation Copy
                        </button>
                      </div>
                    </div>

                    {/* Right settings sidebar */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                      
                      {/* Configuration modules */}
                      <div className={`border rounded-xl p-4 shadow-xs ${
                        darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                      }`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono">Modules</h4>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-900">
                            <div>
                              <span className="text-[11px] font-bold flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                Strict Mode
                              </span>
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-normal">Locks blocklist edits during focus timers.</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={settings.strictMode}
                              onChange={(e) => {
                                if (focusSession.isActive && settings.strictMode) {
                                  alert("Strict Mode changes locked during focus.");
                                  return;
                                }
                                setSettings(prev => ({ ...prev, strictMode: e.target.checked }));
                              }}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-bold flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                Sound Alerts
                              </span>
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-normal">Chimes synthesized signals on complete focus.</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={settings.soundEnabled}
                              onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cumulative achievements metrics */}
                      <div className={`border rounded-xl p-4 shadow-xs ${
                        darkMode ? 'bg-[#0c101b] border-neutral-800' : 'bg-white border-[#ebdcb9]'
                      }`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono">Achievements</h4>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className={`border p-2.5 rounded-lg text-center ${
                            darkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-[#faf9f4] border-[#ebdcb9]'
                          }`}>
                            <span className="text-lg font-bold block font-mono">{stats.completedSessions}</span>
                            <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wide">Matured</span>
                          </div>
                          <div className={`border p-2.5 rounded-lg text-center ${
                            darkMode ? 'bg-neutral-955 border-neutral-850' : 'bg-[#faf9f4] border-[#ebdcb9]'
                          }`}>
                            <span className="text-lg font-bold block font-mono">{stats.totalFocusMinutes}m</span>
                            <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wide">Minutes</span>
                          </div>
                          <div className={`border p-2.5 rounded-lg text-center ${
                            darkMode ? 'bg-neutral-955 border-neutral-855' : 'bg-[#faf9f4] border-[#ebdcb9]'
                          }`}>
                            <span className="text-lg font-bold block font-mono">{stats.currentStreak} 🔥</span>
                            <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wide">Streak</span>
                          </div>
                          <div className={`border p-2.5 rounded-lg text-center ${
                            darkMode ? 'bg-neutral-955 border-neutral-855' : 'bg-[#faf9f4] border-[#ebdcb9]'
                          }`}>
                            <span className="text-lg font-bold block font-mono">{stats.bestStreak} 🔥</span>
                            <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wide">Best</span>
                          </div>
                        </div>

                        <div className={`rounded-lg p-2 text-center text-[10px] font-mono font-semibold mb-3 border ${
                          darkMode ? 'bg-neutral-900 border-neutral-850 text-neutral-400' : 'bg-[#faf9f4] border-[#ebdcb9] text-[#1c1d1a]'
                        }`}>
                          Intercepted Distractions: <span className="text-red-650 font-bold font-sans text-xs ml-1">{stats.distractionAttempts}</span>
                        </div>

                        <button 
                          onClick={handleResetSimulatorStats}
                          className="w-full py-2 border border-red-500/25 hover:bg-red-500/5 text-red-500 text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono"
                        >
                          Clear Statistical Logs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION: UNPACKED CODES HUB DIRECTORY (5 Columns) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="code-inspector-pane">
          <div className="bg-[#0b0f19] border border-neutral-800 rounded-2xl shadow-vercel text-slate-350 overflow-hidden flex flex-col min-h-[640px]">
            
            {/* Folder explorer header */}
            <div className="bg-[#070b13] px-4 py-3.5 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" />
                <span className="font-mono text-xs font-semibold tracking-wide text-slate-200">
                  ARBOR CODE EXPORTER
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                manifest_v3
              </span>
            </div>

            {/* Folder list and Code viewer viewport */}
            <div className="flex-1 flex flex-col sm:flex-row h-full min-h-[460px]">
              
              {/* File list sidebar */}
              <div className="w-full sm:w-44 bg-[#070a11] border-b sm:border-b-0 sm:border-r border-slate-900 p-2 flex flex-col gap-1 overflow-y-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-2.5 py-1 select-none font-mono">
                  unpacked files
                </span>
                
                {EXTENSION_FILES.map(file => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`px-2.5 py-1.5 rounded-lg text-left font-mono text-[11px] cursor-pointer flex items-center gap-2 transition-all ${
                      selectedFile.name === file.name 
                        ? 'bg-emerald-955/40 text-emerald-400 font-semibold border border-emerald-800/40' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <span className="text-xs shrink-0 select-none">
                      {file.name.endsWith('.json') ? <FileJson className="w-3.5 h-3.5 text-blue-400" /> : file.name.endsWith('.js') ? <span className="text-yellow-500">📜</span> : <span className="text-blue-500">🌐</span>}
                    </span>
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>

              {/* Code viewer display */}
              <div className="flex-1 bg-[#090d16] flex flex-col relative overflow-hidden">
                {/* Secondary details */}
                <div className="bg-[#05080e] px-4 py-2 border-b border-slate-900/80 flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono text-slate-450 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                    arbor-blocker/ {selectedFile.path}
                  </span>

                  <button
                    onClick={handleCopyFileToClipboard}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-mono font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer border border-slate-750"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>

                {/* Preformatted codebase view */}
                <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-[#c0caf5] bg-[#080b13] terminal-scrollbar">
                  <pre className="whitespace-pre">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Code compiler footer details */}
            <div className="bg-[#05080f] border-t border-slate-900 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  The compiled source repository contains the modular Chrome-compliant MV3 configuration rules, service worker, and blocks pages. Download to load locally.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDownloadUnpackedExtension}
                  disabled={isZipping}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-neutral-955" />
                  {isZipping ? "Bundling files..." : "Compile & Download ZIP Exporter"}
                </button>
                <button
                  onClick={() => {
                    const target = document.getElementById('how-to-load-unpacked');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-750"
                >
                  Load Manual
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= INSTRUCTIONS HOW-TO SECTION ================= */}
      <section className={`border-t py-12 px-6 transition-colors duration-300 ${
        darkMode ? 'border-neutral-800 bg-black/40' : 'border-[#ebdcb9] bg-white/40'
      }`} id="how-to-load-unpacked">
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl select-none">🛠️</span>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                How to Install Unpacked Blocker.
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Load the compiled Manifest V3 repository directly into Google Chrome Developer mode.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 border rounded-2xl flex flex-col shadow-xs hover:scale-[1.01] transition-all ${
              darkMode ? 'border-neutral-800 bg-[#0c101b]/60' : 'border-[#ebdcb9] bg-white'
            }`}>
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center mb-3.5 border border-emerald-500/20">1</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 font-mono">Download bundle</h4>
              <p className="text-[11px] text-neutral-450 dark:text-neutral-550 leading-relaxed">
                Click <span className="font-semibold text-neutral-800 dark:text-neutral-200">"Download Unpacked ZIP"</span> in the workspace to package canvas asset icons and Manifest rules. Extract the file directory on disk.
              </p>
            </div>

            <div className={`p-5 border rounded-2xl flex flex-col shadow-xs hover:scale-[1.01] transition-all ${
              darkMode ? 'border-neutral-800 bg-[#0c101b]/60' : 'border-[#ebdcb9] bg-white'
            }`}>
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center mb-3.5 border border-emerald-500/20">2</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 font-mono">Toggle Dev Mode</h4>
              <p className="text-[11px] text-neutral-450 dark:text-neutral-555 leading-relaxed">
                Navigate to <code className="bg-neutral-100 dark:bg-neutral-900 px-1 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-mono text-[10px]">chrome://extensions/</code> in the browser URL bar. Toggle the <span className="font-semibold text-neutral-800 dark:text-neutral-200">Developer mode</span> switch in the top-right.
              </p>
            </div>

            <div className={`p-5 border rounded-2xl flex flex-col shadow-xs hover:scale-[1.01] transition-all ${
              darkMode ? 'border-neutral-800 bg-[#0c101b]/60' : 'border-[#ebdcb9] bg-white'
            }`}>
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center mb-3.5 border border-emerald-500/20">3</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 font-mono">Load Unpacked</h4>
              <p className="text-[11px] text-neutral-450 dark:text-neutral-555 leading-relaxed">
                Click <span className="font-semibold text-neutral-800 dark:text-neutral-200">"Load unpacked"</span> and select your extracted directory. Pin the Arbor leaf icon to the browser extension bar to begin studies!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Global Notifications Toast Overlay --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 24, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-neutral-950 dark:bg-black border border-neutral-850 rounded-xl p-4 shadow-xl text-white flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-lg shrink-0 select-none">
              🌳
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-bold tracking-tight text-white">{notification.title}</h5>
              <p className="text-[11px] text-neutral-300 mt-1 leading-normal">{notification.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Footer */}
      <footer className="bg-neutral-950 dark:bg-black border-t border-neutral-900 py-6 text-center text-[10px] text-neutral-500 font-mono tracking-wide transition-colors duration-300">
        <p>Arbor Chrome Workspace — Powered by Manifest V3 & Single-Click Exporters. © 2026.</p>
      </footer>
    </div>
  );
}
