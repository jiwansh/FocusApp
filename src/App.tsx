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
  BookOpen
} from 'lucide-react';
import JSZip from 'jszip';
import { EXTENSION_FILES, ExtensionFile } from './extensionCodeData';

export default function App() {
  // --- Applet Metadata Naming ---
  const appVersion = "1.0.0";
  const appAuthor = "Arbor Focus Group";

  // --- Real-time Local Date state ---
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

  // --- Core Extension Emulated storage (Equivalent of chrome.storage.local) ---
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

  const [focusSession, setFocusSession] = useState<{
    isActive: boolean;
    startTime: number | null;
    endTime: number | null;
    duration: number;
    treeType: 'oak' | 'bonsai' | 'cedar' | 'bamboo';
    progress: number;
  }>({
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 25,
    treeType: 'oak',
    progress: 0
  });

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

  // --- Code Hub states ---
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(EXTENSION_FILES[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [selectedOptionTab, setSelectedOptionTab] = useState<'blocklist' | 'allowlist' | 'exceptions' | 'experience'>('blocklist');

  // --- Browser Simulator States ---
  const [browserUrl, setBrowserUrl] = useState<string>('google.com');
  const [currentRenderedPage, setCurrentRenderedPage] = useState<'google' | 'web' | 'blocked' | 'options'>('google');
  const [previousUrl, setPreviousUrl] = useState<string>('google.com');
  const [extensionPopupOpened, setExtensionPopupOpened] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ title: string; text: string } | null>(null);

  // --- Popup Setup states ---
  const [selectedSetupTree, setSelectedSetupTree] = useState<'oak' | 'bonsai' | 'cedar' | 'bamboo'>('oak');
  const [selectedSetupMins, setSelectedSetupMins] = useState<number>(25);
  const [isCustomSetup, setIsCustomSetup] = useState<boolean>(false);
  const [customSliderMins, setCustomSliderMins] = useState<number>(30);

  // --- Inputs ---
  const [newBlockedUrl, setNewBlockedUrl] = useState<string>('');
  const [newAllowedUrl, setNewAllowedUrl] = useState<string>('');
  const [newExceptionPath, setNewExceptionPath] = useState<string>('');

  const [expTitleInput, setExpTitleInput] = useState<string>(settings.redirectTitle);
  const [expSubInput, setExpSubInput] = useState<string>(settings.redirectSubtitle);

  // Sync Experience form fields on start
  useEffect(() => {
    setExpTitleInput(settings.redirectTitle);
    setExpSubInput(settings.redirectSubtitle);
  }, [settings]);

  // --- Simulator Web Page content generator ---
  const [simulatedWebSearchQuery, setSimulatedWebSearchQuery] = useState<string>('');
  const [simulatedLoadProgress, setSimulatedLoadProgress] = useState<boolean>(false);

  // --- Real-time Countdown clock for Active Session ---
  const [remainingTimeText, setRemainingTimeText] = useState<string>('25:00');
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tree Visual Stage Mapping
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

  // Logic: Calculate tree visual stage based on elapsed progress ratio
  const getTreeVisual = (type: 'oak' | 'bonsai' | 'cedar' | 'bamboo', pct: number) => {
    const list = treeStages[type] || treeStages.oak;
    if (pct < 10) return { icon: list[0], label: "Planted Seedling" };
    if (pct < 40) return { icon: list[1], label: "Sprouting Roots" };
    if (pct < 75) return { icon: list[2], label: "Sapling Stage" };
    return { icon: list[3], label: "Majestic Mature Canopy!" };
  };

  // Toast notifier helper
  const triggerNotification = (title: string, text: string) => {
    setNotification({ title, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Audio simulator (utilizes standard web synthesizers so that sound works offline & locally)
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

  // Timer Effect
  useEffect(() => {
    if (focusSession.isActive && focusSession.endTime) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      
      const updateTimer = () => {
        const remainingMs = focusSession.endTime! - Date.now();
        if (remainingMs <= 0) {
          // Complete focus!
          completeSession();
          return;
        }

        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setRemainingTimeText(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);

        // Progress Percent
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

  // Handle Complete Focus success
  const completeSession = () => {
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
    
    // Redirect browser simulation back to standard home if blocked
    if (currentRenderedPage === 'blocked') {
      setCurrentRenderedPage('google');
      setBrowserUrl('google.com');
    }
  };

  // Block Evaluation function
  const evaluateBrowserNavigation = (targetUrl: string, startSessionObj?: typeof focusSession) => {
    const sanitizedInput = targetUrl.trim().toLowerCase();
    
    // Check if redirect is required
    const sessionActive = startSessionObj ? startSessionObj.isActive : focusSession.isActive;

    if (!sessionActive) {
      // Free browsing!
      if (sanitizedInput.includes('options.html') || sanitizedInput.includes('chrome-extension://')) {
        setCurrentRenderedPage('options');
      } else if (sanitizedInput === 'google.com' || sanitizedInput === '') {
        setCurrentRenderedPage('google');
      } else {
        setCurrentRenderedPage('web');
      }
      return;
    }

    // Timer IS active. Inspect blocking rules!
    // Check if domain is blocked
    const isMatchingBlock = blockedSites.some(blockedDomain => {
      // Matches domain if URL contains the domain, e.g. "youtube.com/something" matches "youtube.com"
      return sanitizedInput.includes(blockedDomain);
    });

    if (isMatchingBlock) {
      // Check if URL matches any SMART EXCEPTION path rule
      const matchesException = allowedExceptions.some(excPath => {
        return excPath && excPath.trim() && sanitizedInput.includes(excPath.toLowerCase().trim());
      });

      if (matchesException) {
        // Exempt block! Let it load
        setCurrentRenderedPage('web');
        triggerNotification("Smart Exception Allowed 🎓", `Bypassing filter block because "${sanitizedInput}" matches allowed study path.`);
      } else {
        // Redirection triggered!
        setCurrentRenderedPage('blocked');
        setStats(prev => ({
          ...prev,
          distractionAttempts: prev.distractionAttempts + 1
        }));
        triggerNotification("Website Intercepted! 🚫", "You attempted to open a blocked site. Redirected to Arbor focus clock.");
      }
    } else {
      // Not on blocklist, check if on productive allowlist or just standard web-url
      setCurrentRenderedPage('web');
    }
  };

  // Navigation handlers
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

  // Actions trigger: Start Focus Sim
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

    // Evaluate current simulator window path immediately (if already sitting on a blocked site, trigger immediate block)
    evaluateBrowserNavigation(browserUrl, newSession);
  };

  // Actions trigger: Stop Focus Sim (Yield)
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

      // Restore blocked simulator pages if necessary
      if (currentRenderedPage === 'blocked') {
        setCurrentRenderedPage('google');
        setBrowserUrl('google.com');
      }
    }
  };

  // Core add delete handlers (Storage modifiers)
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

  const handleDeleteBlocked = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active! Modifications suspended.");
      return;
    }
    const filtered = blockedSites.filter((_, i) => i !== idx);
    setBlockedSites(filtered);
    triggerNotification("Blocklist Cleaned", "Removed site filter.");
  };

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

  const handleDeleteAllowed = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active!");
      return;
    }
    setAllowedSites(allowedSites.filter((_, i) => i !== idx));
  };

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

  const handleDeleteException = (idx: number) => {
    if (focusSession.isActive && settings.strictMode) {
      alert("Strict Focus Mode is Active!");
      return;
    }
    setAllowedExceptions(allowedExceptions.filter((_, i) => i !== idx));
  };

  // Sync custom messages submit
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

  // Reset metrics
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

  // --- Real extension Unpacked compiler & ZIP Packager ---
  const handleDownloadUnpackedExtension = async () => {
    setIsZipping(true);
    triggerNotification("Building Extension ZIP...", "Drawing circular canvases and packaging Manifest V3 files...");
    
    try {
      const zip = new JSZip();

      // Write code files
      EXTENSION_FILES.forEach(file => {
        // For actual files, we can preserve folder paths
        zip.file(file.path, file.content);
      });

      // Draw custom tree icons dynamically in HTML canvas and add as high-contrast PNG blobs!
      // This is dynamic asset generation requested for perfect MV3 loading in developers modes!
      const drawIconBlob = (size: number): Promise<Blob> => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;

          // Forest Green circular badge
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#16a34a';
          ctx.fill();

          // Outer light border
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = size * 0.08;
          ctx.stroke();

          // Emoji drawing or beautiful stylized leaf shapes
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

      // Package everything
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `arbor-blocker-extension.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerNotification("Package Compiled! 🎉", "ZIP bundle downloaded successfully. Head to chrome://extensions/ to load it!");
    } catch (err) {
      console.error(err);
      triggerNotification("Build Failure", "Error compiling chrome zip package.");
    } finally {
      setIsZipping(false);
    }
  };

  // Copy helper
  const handleCopyFileToClipboard = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf9f4] text-[#1c1d1a] font-sans selection:bg-emerald-100 selection:text-emerald-800 antialiased flex flex-col">
      {/* --- Page Header --- */}
      <header className="border-b border-[#ebdcb9] bg-white px-6 py-4 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-md shadow-emerald-700/15">
            <span className="text-xl text-white">🌳</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              Arbor Chrome Workspace <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Manifest V3</span>
            </h1>
            <p className="text-xs text-slate-500">Chrome extension builder, dynamic blocker simulator, and direct exporter</p>
          </div>
        </div>

        {/* Live system state bar */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">WORKSPACE CLOCK</span>
            <span className="text-xs font-semibold text-slate-800 font-mono">{currentTime || "Loading Date..."}</span>
          </div>

          <button 
            id="download-unpacked-header-btn"
            onClick={handleDownloadUnpackedExtension}
            disabled={isZipping}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 active:transform active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isZipping ? (
              <span className="animate-spin text-sm">🌱</span>
            ) : (
              <Download className="w-4 h-4 text-emerald-400" />
            )}
            Download Unpacked ZIP
          </button>
        </div>
      </header>

      {/* --- Main Dashboard Container --- */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT AREA: COGNITIVE INTERACTIVE SIMULATOR (7 Columns) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="simulator-sandbox">
          
          <div className="bg-white border border-[#e5d4ab] rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[580px]">
            {/* Window control header bar */}
            <div className="bg-[#f0ebd7] px-4 py-3 border-b border-[#e5d4ab] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="ml-2 font-mono text-xs font-semibold text-emerald-900 tracking-wider">CHROME DESKTOP SIMULATOR</span>
              </div>
              
              <div className="flex items-center gap-3">
                {focusSession.isActive && (
                  <span className="animate-pulse inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[10px] font-bold text-red-700 border border-red-200">
                    <Shield className="w-3 h-3 text-red-500 fill-red-100" />
                    BLOCKER ACTIVE ({remainingTimeText})
                  </span>
                )}
                <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold bg-[#dfd8be] px-2 py-0.5 rounded-md">Vite Browser</span>
              </div>
            </div>

            {/* Virtual address bar panel with extension icon */}
            <div className="bg-slate-50 border-b border-[#e5d4ab] p-2 flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                <button 
                  onClick={() => {
                    setBrowserUrl(previousUrl);
                    evaluateBrowserNavigation(previousUrl);
                  }}
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors" 
                  title="Go back"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>

              {/* URL Form bar */}
              <form onSubmit={handleGoUrl} className="flex-1 flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-2xs hover:border-slate-400 transition-colors">
                <Chrome className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="Type a web domain e.g. youtube.com, github.com, x.com..."
                  className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-hidden"
                />
                <button type="submit" className="hidden">Go</button>
              </form>

              {/* Extension Actions area */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 mr-1">EXTENSION BAR:</span>
                
                {/* Pinned main extension action button */}
                <button
                  id="target-extension-icon"
                  onClick={() => setExtensionPopupOpened(!extensionPopupOpened)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 ${
                    focusSession.isActive 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm shadow-emerald-500/15' 
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                  title="Arbor Blocker Extension Overlay"
                >
                  {focusSession.isActive ? (
                    <div className="relative">
                      <span className="text-lg">🌳</span>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-[8px] font-mono font-bold text-white flex items-center justify-center scale-90 border border-white">
                        {Math.ceil((focusSession.endTime! - Date.now()) / 60000)}m
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg opacity-85">🌱</span>
                  )}
                </button>

                {/* Options button */}
                <button
                  onClick={() => {
                    setBrowserUrl('chrome-extension://options.html');
                    setCurrentRenderedPage('options');
                    setExtensionPopupOpened(false);
                  }}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    currentRenderedPage === 'options' 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Extension Options Screen"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* ================= SIMULATOR FLOATING EXTENSION POPUP DRAW ================= */}
                <AnimatePresence>
                  {extensionPopupOpened && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-11 w-[335px] bg-[#fbf9f4] border border-[#e5d4ab] rounded-2xl shadow-xl z-50 overflow-hidden text-slate-800"
                    >
                      {/* Popup header */}
                      <div className="bg-white border-b border-[#e5d4ab] px-3.5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌳</span>
                          <span className="font-bold text-sm text-slate-800 tracking-tight">Arbor focus</span>
                        </div>
                        <button 
                          onClick={() => {
                            setBrowserUrl('chrome-extension://options.html');
                            setCurrentRenderedPage('options');
                            setExtensionPopupOpened(false);
                          }}
                          className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Popup core main content */}
                      <div className="p-4 flex flex-col gap-4">
                        {focusSession.isActive ? (
                          /* Active Stage Mode */
                          <div className="flex flex-col items-center gap-4 py-2">
                            <div className="flex flex-col items-center">
                              <span className="text-6xl animate-bounce duration-1000 mb-2">
                                {getTreeVisual(focusSession.treeType, focusSession.progress).icon}
                              </span>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold tracking-wide">
                                {getTreeVisual(focusSession.treeType, focusSession.progress).label}
                              </span>
                            </div>

                            <div className="text-center w-full">
                              <span className="font-mono font-extrabold text-4xl text-slate-800 tracking-tight">
                                {remainingTimeText}
                              </span>
                              <div className="w-full bg-slate-200 rounded-full h-2 mt-3.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full transition-all duration-1000"
                                  style={{ width: `${focusSession.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2">Diverting pages to motivational message. Keep going!</p>
                            </div>

                            <button 
                              onClick={handleYieldFocusSim}
                              className="w-full py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100 active:transform active:scale-[0.98] text-xs transition-all cursor-pointer"
                            >
                              Yield (Give Up Seed)
                            </button>
                          </div>
                        ) : (
                          /* Setup focus mode selection */
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2 text-center tracking-wider">Select Tree Seeds</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {(Object.keys(treeStages) as Array<keyof typeof treeStages>).map((tree) => (
                                  <button
                                    key={tree}
                                    onClick={() => setSelectedSetupTree(tree)}
                                    className={`py-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                      selectedSetupTree === tree 
                                        ? 'border-emerald-700 bg-emerald-50 text-emerald-800 font-bold shadow-xs' 
                                        : 'border-slate-300 bg-white hover:border-slate-400 text-slate-600'
                                    }`}
                                  >
                                    <span className="text-xl">
                                      {tree === 'oak' ? '🌳' : tree === 'bonsai' ? '🪴' : tree === 'cedar' ? '🌲' : '🎋'}
                                    </span>
                                    <span className="text-[9px] capitalize">{tree}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Presets times rows */}
                            <div>
                              <p className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2 text-center tracking-wider">Focus Duration</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[25, 50, 90].map(mins => (
                                  <button
                                    key={mins}
                                    onClick={() => {
                                      setSelectedSetupMins(mins);
                                      setIsCustomSetup(false);
                                    }}
                                    className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                      selectedSetupMins === mins && !isCustomSetup
                                        ? 'bg-slate-900 border-slate-900 text-white'
                                        : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    {mins}m
                                  </button>
                                ))}
                                <button
                                  onClick={() => setIsCustomSetup(true)}
                                  className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    isCustomSetup
                                      ? 'bg-slate-900 border-slate-900 text-white'
                                      : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  Custom
                                </button>
                              </div>
                            </div>

                            {/* Slider (if custom enabled) */}
                            {isCustomSetup && (
                              <div className="bg-white border border-[#e5d4ab] rounded-xl p-3">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>Time frame:</span>
                                  <span className="font-bold text-slate-800">{customSliderMins} mins</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={5} 
                                  max={180} 
                                  step={5} 
                                  value={customSliderMins}
                                  onChange={(e) => setCustomSliderMins(parseInt(e.target.value, 10))}
                                  className="w-full accent-emerald-700 cursor-pointer"
                                />
                              </div>
                            )}

                            <button
                              onClick={handleStartFocusSim}
                              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] text-xs shadow-md shadow-emerald-700/10"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Sow a Focus Seed
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Popup Footer stats pills */}
                      <div className="bg-white border-t border-[#e5d4ab] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span title="Continuous Day Streaks">🔥 {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}</span>
                        <span title="Total XP Points">⭐ {stats.xp} XP</span>
                        <span title="Cumulative Duration">⏱️ {stats.totalFocusMinutes}m</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Simulated browser page viewport wrapper */}
            <div className="flex-1 bg-slate-100 flex flex-col relative overflow-y-auto">
              {simulatedLoadProgress && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 animate-[pulse_1.5s_infinite] w-2/3"></div>
                </div>
              )}

              {/* RENDER CASE 1: Google Homepage default search */}
              {currentRenderedPage === 'google' && (
                <div className="flex-1 bg-white flex flex-col justify-center items-center p-8">
                  <div className="flex flex-col items-center gap-1 text-center max-w-sm">
                    <span className="text-5xl">🔍</span>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight font-[#font-sans] mt-2">
                      Vite<span className="text-emerald-600">Search</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Simulator network engine. Test blocklists by searching below.</p>
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
                    className="w-full max-w-md mt-6 flex gap-2 border border-slate-200 bg-[#f8fafc] rounded-xl px-4 py-2 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-700 transition-all shadow-xs"
                  >
                    <Search className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                    <input 
                      type="text" 
                      placeholder="Search website name e.g. youtube.com, docs.oracle.com"
                      value={simulatedWebSearchQuery}
                      onChange={(e) => setSimulatedWebSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs text-slate-800 focus:outline-hidden"
                    />
                  </form>

                  {/* Quick helpful seed recommendations */}
                  <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
                    <span className="text-[10px] text-slate-400 font-bold self-center mr-1">TEST CLICKS:</span>
                    <button 
                      onClick={() => { setBrowserUrl('youtube.com'); evaluateBrowserNavigation('youtube.com'); }}
                      className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      📺 youtube.com (Blocked)
                    </button>
                    <button 
                      onClick={() => { setBrowserUrl('youtube.com/c/takeuforward'); evaluateBrowserNavigation('youtube.com/c/takeuforward'); }}
                      className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      🎓 Exception: takeuforward
                    </button>
                    <button 
                      onClick={() => { setBrowserUrl('github.com'); evaluateBrowserNavigation('github.com'); }}
                      className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-850 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      💻 github.com (Allowed)
                    </button>
                    <button 
                      onClick={() => { setBrowserUrl('reddit.com'); evaluateBrowserNavigation('reddit.com'); }}
                      className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      👽 reddit.com (Blocked)
                    </button>
                  </div>
                </div>
              )}

              {/* RENDER CASE 2: Permissive/Neutral mock website page */}
              {currentRenderedPage === 'web' && (
                <div className="flex-1 bg-[#f8fafc] p-6 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold">🌐</span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{browserUrl}</h2>
                        <span className="text-[10px] text-emerald-600 font-semibold">Loaded successfully</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Simulated Net Sandbox</span>
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                    <h1 className="text-emerald-700 text-3xl font-black tracking-tight">Productive Page Active</h1>
                    <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
                      This website is currently allowed by your configuration rules. Bypassed block check successfully.
                    </p>
                    
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3 max-w-md text-left">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h3 className="text-xs font-bold text-emerald-900">Good Job Focusing!</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5">Use this space on {browserUrl} to finish your work tasks.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER CASE 3: THE EMBARRASSING INTERSTELLAR MOTIVATING BLOCK PAGE (Exact replica of blocked.html) */}
              {currentRenderedPage === 'blocked' && (
                <div className="flex-1 bg-[#f1f5f9] flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center">
                    
                    {/* Header bar of block detail */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-xl">🌳</span>
                      <h1 className="text-xs font-black tracking-tighter text-slate-800 uppercase">Arbor Blocker</h1>
                      <span className="bg-red-50 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                        FOCUS ACTIVE
                      </span>
                    </div>

                    {/* Central illustration */}
                    <div className="my-5 flex flex-col items-center">
                      <span className="text-7xl animate-pulse">
                        {getTreeVisual(focusSession.treeType, focusSession.progress).icon}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full mt-3.5 border border-emerald-100">
                        {getTreeVisual(focusSession.treeType, focusSession.progress).label}
                      </span>
                    </div>

                    {/* Customized motivational strings */}
                    <div className="mb-5 px-3">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                        {settings.redirectTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {settings.redirectSubtitle}
                      </p>
                    </div>

                    {/* Timer Stopwatch details */}
                    <div className="border-t border-b border-slate-100 py-3 mb-5">
                      <span className="font-mono text-4xl font-extrabold text-slate-800 block">
                        {remainingTimeText}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                        remaining focus session
                      </span>
                    </div>

                    {/* Allow shortcuts panel */}
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-4 text-left">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        🚀 Productive Shortcuts
                      </h3>
                      <p className="text-[9px] text-slate-400 mb-2.5">Skip to your specified allowlist hubs instead:</p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {allowedSites.map(site => (
                          <button
                            key={site}
                            onClick={() => {
                              setBrowserUrl(site);
                              evaluateBrowserNavigation(site);
                            }}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:border-emerald-700 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer transition-all active:transform active:scale-95"
                          >
                            🌐 {site}
                          </button>
                        ))}
                        {allowedSites.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">No shortcut items provided. Add them in Options!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER CASE 4: THE EXTENSION SETTINGS DETAILS WINDOW (options.html mock) */}
              {currentRenderedPage === 'options' && (
                <div className="flex-1 bg-[#f8fafc] p-4 lg:p-6 overflow-y-auto">
                  
                  {/* Option UI title */}
                  <div className="flex flex-wrap gap-4 items-center justify-between border-b border-[#ebdcb9] pb-4 mb-4 bg-white p-4 rounded-xl border border-[#ebdcb9]">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚙️</span>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">Arbor Options Workspace</h2>
                        <span className="text-[10px] text-slate-500">chrome.storage.local mock controller</span>
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
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-md"
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
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-md"
                      >
                        Import JSON
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left Lists Section */}
                    <div className="md:col-span-8 flex flex-col gap-4">
                      
                      <div className="bg-white border border-[#ebdcb9] rounded-xl p-4 shadow-2xs">
                        {/* Tab header buttons */}
                        <div className="flex border-b border-slate-200 gap-4 mb-4">
                          <button
                            onClick={() => setSelectedOptionTab('blocklist')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'blocklist' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400'
                            }`}
                          >
                            🚫 Blocklist Filter
                          </button>
                          <button
                            onClick={() => setSelectedOptionTab('allowlist')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'allowlist' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400'
                            }`}
                          >
                            ✅ Productive Sites
                          </button>
                          <button
                            onClick={() => setSelectedOptionTab('exceptions')}
                            className={`pb-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                              selectedOptionTab === 'exceptions' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400'
                            }`}
                          >
                            🎓 Smart Exceptions
                          </button>
                        </div>

                        {/* Blocklist tab rendering */}
                        {selectedOptionTab === 'blocklist' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[11px] text-slate-400">Attempts to visit these pages during an active session will trigger block overrides:</p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. reddit.com, instagram.com"
                                value={newBlockedUrl}
                                onChange={(e) => setNewBlockedUrl(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="flex-1 text-xs border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                              />
                              <button 
                                onClick={handleAddBlocked}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" /> Clear Domain
                              </button>
                            </div>

                            {focusSession.isActive && settings.strictMode && (
                              <div className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg">
                                🔒 Strict Focus Mode is active! Modifications are frozen until session completes.
                              </div>
                            )}

                            <ul className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100 bg-[#fbfbfc]">
                              {blockedSites.map((site, index) => (
                                <li key={site} className="px-3.5 py-2 flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-700">{site}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteBlocked(index)}
                                      className="text-slate-405 hover:text-red-500"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                              {blockedSites.length === 0 && (
                                <li className="p-6 text-slate-400 italic text-center text-xs">No blocked domains. Click free!</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Allowlist Tab */}
                        {selectedOptionTab === 'allowlist' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[11px] text-slate-400">Designate constructive work portals that bypass check constraints and render shortcut cards:</p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. github.com, stackoverflow.com"
                                value={newAllowedUrl}
                                onChange={(e) => setNewAllowedUrl(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="flex-1 text-xs border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                              />
                              <button 
                                onClick={handleAddAllowed}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" /> Ensure Domain
                              </button>
                            </div>

                            <ul className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100 bg-[#fbfbfc]">
                              {allowedSites.map((site, index) => (
                                <li key={site} className="px-3.5 py-2 flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-700">{site}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteAllowed(index)}
                                      className="text-slate-405 hover:text-red-500"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Smart Exceptions tab */}
                        {selectedOptionTab === 'exceptions' && (
                          <div className="flex flex-col gap-3">
                            <p className="text-[11px] text-slate-400">
                              Bypass block filters for educational paths on blacklisted sites (e.g. allow only takeuforward playlist on youtube.com):
                            </p>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g. youtube.com/c/takeuforward"
                                value={newExceptionPath}
                                onChange={(e) => setNewExceptionPath(e.target.value)}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="flex-1 text-xs border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                              />
                              <button 
                                onClick={handleAddException}
                                disabled={focusSession.isActive && settings.strictMode}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" /> Permit Path
                              </button>
                            </div>

                            <ul className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100 bg-[#fbfbfc]">
                              {allowedExceptions.map((exc, index) => (
                                <li key={exc} className="px-3.5 py-2 flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-700">{exc}</span>
                                  {!(focusSession.isActive && settings.strictMode) && (
                                    <button 
                                      onClick={() => handleDeleteException(index)}
                                      className="text-slate-405 hover:text-red-500"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                retention-</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Custom Motivation Layout settings */}
                      <div className="bg-white border border-[#ebdcb9] rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Custom Block Page Copy</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-slate-400">Header Title text</label>
                            <input 
                              type="text" 
                              value={expTitleInput}
                              onChange={(e) => setExpTitleInput(e.target.value)}
                              placeholder="Stay Focused, Grow Big!"
                              className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-slate-400">Sub-headline Description</label>
                            <textarea 
                              value={expSubInput}
                              onChange={(e) => setExpSubInput(e.target.value)}
                              rows={2}
                              placeholder="Your digital crops depend on you..."
                              className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={handleSaveMotivationStyle}
                          disabled={focusSession.isActive && settings.strictMode}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold font-[#font-sans] disabled:opacity-50 cursor-pointer"
                        >
                          Update Block Screen Text
                        </button>
                      </div>
                    </div>

                    {/* Right options sidebar details */}
                    <div className="md:col-span-4 flex flex-col gap-4">
                      {/* Configuration modules */}
                      <div className="bg-white border border-[#ebdcb9] rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Configuration Modules</h3>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                Strict Blocker Mode
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Locks blocklists while timer counts down.</p>
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
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                Audio Alarms
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">Plays audio on timer completions.</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={settings.soundEnabled}
                              onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                              className="w-4 h-4 accent-emerald-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cumulative metrics stats */}
                      <div className="bg-white border border-[#ebdcb9] rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Forest Achievements</h3>

                        <div className="grid grid-cols-2 gap-2 mb-3.5">
                          <div className="bg-[#fcfbfc] border border-slate-150 p-2.5 rounded-lg text-center">
                            <span className="text-xl font-bold text-slate-800 block">{stats.completedSessions}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Completed Trees</span>
                          </div>
                          <div className="bg-[#fcfbfc] border border-slate-150 p-2.5 rounded-lg text-center">
                            <span className="text-xl font-bold text-slate-800 block">{stats.totalFocusMinutes}m</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Focus Duration</span>
                          </div>
                          <div className="bg-[#fcfbfc] border border-slate-150 p-2.5 rounded-lg text-center">
                            <span className="text-xl font-bold text-slate-800 block">{stats.currentStreak} 🔥</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-semibold">Active Streak</span>
                          </div>
                          <div className="bg-[#fcfbfc] border border-slate-150 p-2.5 rounded-lg text-center">
                            <span className="text-xl font-bold text-slate-800 block">{stats.bestStreak} 🔥</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-semibold">Best Streak</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 text-center text-xs font-semibold mb-3">
                          ⚡ Intercepted Attempts: <span className="text-red-700 font-bold">{stats.distractionAttempts}</span>
                        </div>

                        <button 
                          onClick={handleResetSimulatorStats}
                          className="w-full py-2 border border-rose-100 hover:bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
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

        {/* ================= RIGHT AREA: ACTIVE FILE INSPECTOR & CODES HUB (5 Columns) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="code-inspector-pane">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm text-slate-300 overflow-hidden flex flex-col flex-1 min-h-[580px]">
            {/* Folder Header bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" />
                <span className="font-mono text-xs font-semibold tracking-wide text-slate-200">UNPACKED DIRECTORY VIEWER</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">manifest_v3</span>
            </div>

            {/* Sidebar Folder list and Editor viewport core */}
            <div className="flex-1 flex flex-col sm:flex-row h-full min-h-[400px]">
              {/* File list side panel of repo */}
              <div className="w-full sm:w-44 bg-slate-950 border-r border-slate-850 p-2 flex flex-col gap-1 overflow-y-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 px-2 py-1 select-none">Folder: arbor-extension</span>
                {EXTENSION_FILES.map(file => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`px-3 py-1.5 rounded-lg text-left font-mono text-xs cursor-pointer flex items-center gap-2 transition-all ${
                      selectedFile.name === file.name 
                        ? 'bg-emerald-950/75 border border-emerald-800 text-emerald-400 font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <span className="text-[10px]" role="img" aria-label="icon">
                      {file.name.endsWith('.json') ? '⚙️' : file.name.endsWith('.js') ? '📜' : file.name.endsWith('.html') ? '🌐' : '📖'}
                    </span>
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>

              {/* Code visual pre-formatted content view area */}
              <div className="flex-1 bg-[#0b0f19] flex flex-col relative overflow-hidden">
                {/* Editor subheader info */}
                <div className="bg-[#111625] px-3.5 py-2 border-b border-slate-850/80 flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-medium text-slate-400 flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                    arbor-blocker/ {selectedFile.path}
                  </span>

                  <button
                    onClick={handleCopyFileToClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 animate-pulse" />
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

                {/* Main preformatted block */}
                <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-[#a9b2c3] bg-[#0c1020]">
                  <pre className="whitespace-pre scrollbar-thin">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Downloader controller footer block */}
            <div className="bg-slate-950 border-t border-slate-850 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  The compiled source repository contains the modular Chrome-compliant MV3 configuration rules, service worker, and blocks pages. No dependencies needed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDownloadUnpackedExtension}
                  disabled={isZipping}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-700/15"
                >
                  {isZipping ? (
                    <span className="animate-spin text-sm">🌱 Packing...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Completed ZIP Folder
                    </>
                  )}
                </button>
                <a 
                  href="#how-to-load-unpacked"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center font-sans"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Read Setup Instructions
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- Step-by-Step Developer instructions section --- */}
      <section className="bg-white border-t border-[#ebdcb9] mt-12 py-12 px-6" id="how-to-load-unpacked">
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">🛠️</span>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">How to Install Unpacked Extension in Chrome</h2>
              <p className="text-xs text-slate-400">Step-by-step developer load guide for Windows, MacOS, and ChromeOS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-[#eeddbb] bg-[#fafbfc]/40 rounded-2xl flex flex-col">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-3">1</span>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-1">Download Zip bundle</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click <span className="font-semibold text-slate-800">"Download Unpacked ZIP"</span> above of this portal to export the completed repository containing pre-mapped canvas circular asset icons. Extract the folders on your storage space.
              </p>
            </div>

            <div className="p-5 border border-[#eeddbb] bg-[#fafbfc]/40 rounded-2xl flex flex-col">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-3">2</span>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-1">Toggle Dev Mode</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                In Google Chrome, navigate to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[10px]">chrome://extensions/</code> in the browser address. Locate and turn on the <span className="font-semibold text-slate-800">Developer mode</span> slider in the upper right.
              </p>
            </div>

            <div className="p-5 border border-[#eeddbb] bg-[#fafbfc]/40 rounded-2xl flex flex-col">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-3">3</span>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-1">Load Unpacked</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tap the <span className="font-semibold text-slate-800">"Load unpacked"</span> button in top-left, select the extracted folder directory on disk, and pin the newly grown seedling icon to begin focusing!
              </p>
            </div>
          </div>

          {/* Clean disclaimer footnote */}
          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="text-xs leading-relaxed text-slate-500">
              <span className="font-bold text-slate-700">Developer Note on Sandbox Permissions:</span> Arbor Blocker adheres to strict declarative net request scopes. The included permissions <code className="font-mono bg-slate-100 text-[10px] px-1 py-0.5 rounded">declarativeNetRequest</code> and <code className="font-mono bg-slate-100 text-[10px] px-1 py-0.5 rounded">storage</code> are default secure Chromium controls that run locally without reporting server telemetry logs.
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
            className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-white flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-lg shrink-0">
              🌳
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold tracking-tight text-white">{notification.title}</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">{notification.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Arbor Blocker Workspace — Powered by Manifest V3 & Single-Click Exporters. Created by AI Studio build. © 2026.</p>
      </footer>
    </div>
  );
}

