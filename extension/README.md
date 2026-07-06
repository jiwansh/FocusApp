# Arbor Blocker - Forest Focus Chrome Extension (Manifest V3)

Arbor Blocker is a lightweight, gamified focus companion designed for Chrome and modern Chromium-based browsers. It helps you carve out deep distraction-free work blocks by redirecting procrastinating pages, growing virtual trees, and tracking your daily focus streaks.

---

## 🚀 Core Features

- **🌳 Real-Time Tree Growth:** Choose your focus seeds (Oak, Cedar, Bonsai, Bamboo) and nurture them. If you cancel focus, your tree withers.
- **🚫 "Padh Lo Beta!" Redirects:** Instantly intercepts visits to blocked domains (like `x.com` or `instagram.com`) and displays a funny Hindi warning alert card ("पढ़ लो बेटा!").
- **🔊 Auto-Pause & Synthesized Beeping:** 
  * Pauses the active focus session when a blocked page is open.
  * Plays a synthesized alert beep continuously until you close the tab.
  * Once the tab is closed, the focus timer automatically shifts and resumes.
- **⏱️ Injected Floating Widget:** 
  * Displays a gorgeous glassmorphic timer directly in the bottom-right corner of all web pages.
  * Fully draggable with position memory (retains coordinates across tab reloads).
  * Double-click the widget to collapse it into a minimal circle avatar.
- **🎓 Smart Exceptions:** Block main domains (like `youtube.com`) but bypass exceptions (like coding playlists or tutorial channels).
- **🔒 Strict Focus Mode:** Prevents you from disabling settings or modifying the blocklist while a focus timer is running.
- **🔥 Gamification:** Earn XP (10 XP per minute focused), record completed trees, and track your daily & best focusing streaks.
- **📤 Settings Sync:** Export and import configurations instantly as structured JSON files.

---

## 🛠️ Step-by-Step Installation Instructions

To install and load this unpacked extension in your Chrome browser locally:

1. **Open Chrome Extensions:**
   * Launch Google Chrome.
   * Type or copy `chrome://extensions/` into the URL bar and press Enter.

2. **Activate Developer Mode:**
   * Toggle the **Developer mode** switch in the top-right corner of the Extensions dashboard to **ON**.

3. **Load Unpacked Extension:**
   * Click the **Load unpacked** button in the top-left corner.
   * Select the local folder: `D:\jiwanshu\bluej\Downloads\FocusApp\extension`.
   * Click **Select Folder**.

4. **Pin & Focus:**
   * Click the puzzle piece icon in the Chrome toolbar.
   * Pin **Arbor Blocker** to your bar, open the popup, choose your seed, and sow focus!

---

## 📂 File Architecture

- [manifest.json](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/manifest.json) — Chrome Manifest V3 configuration defining content scripts, permissions (`tabs`, `alarms`, `storage`, `declarativeNetRequest`), and resources.
- [background.js](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/background.js) — Core service worker that maintains state, schedules alarms, intercept/redirects tabs, handles timer pause/resume triggers, and updates the action badge.
- [content.js](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/content.js) — Injected content script that inserts the floating, draggable timer card inside an isolated shadow DOM root.
- [content.css](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/content.css) — Styles the glassmorphic aesthetic of the floating widget.
- [popup.*](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/popup.html) — Floating dropdown menu UI appearing when tapping the toolbar extension icon. Contains timer presets, tree selectors, and active state dials.
- [options.*](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/options.html) — Options page for managing blocked websites, allowlists, smart exceptions, customization headers, and cumulative stats.
- [blocked.*](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension/blocked.html) — Intercept warning page loaded when users attempt to open blocked sites. Plays the warning beep audio and houses the "Padh Lo Beta" Indian meme dialogue.

Enjoy cultivating focus, one tree at a time! 🌳✨
