# FocusApp 🌳 (Arbor Blocker & Focus Companion)

FocusApp is a modern, gamified productivity suite designed to help you carve out deep, distraction-free work blocks. It contains two main components:
1. **Arbor Blocker Chrome Extension:** Intercepts distractions, gamifies timer counts, plays warnings, and shows a floating timer widget on all web pages.
2. **Focus Web App Dashboard:** A React-based companion dashboard designed to sync and monitor your progress.

---

## 🚀 Key Features

### 1. 🚫 "Padh Lo Beta!" Interception Page
When you attempt to navigate to a blocked website (e.g., `x.com`, `instagram.com`), you are immediately redirected to a custom warning screen saying **"पढ़ लो बेटा! (PADH LO BETA!)"** with a crying tree (`😢`).

### 2. 🔊 Distraction Auto-Pause & Beep Alarm
* When a distraction is opened, your active focus timer is automatically **paused** so you don't lose progress or wither your tree.
* The redirected page plays a **continuous synthesizer-based beeping alarm** to notify you of the distraction.
* As soon as you **close the distracted tab**, the alarm stops, and the focus timer automatically **resumes** exactly where it left off.

### 3. ⏱️ Injected Floating Timer Widget
* A beautiful, glassmorphic floating timer card is injected into the bottom-right corner of all active web pages.
* It displays your remaining focus countdown, active tree type, and status indicator.
* **Draggable:** Grab and move the widget anywhere on the viewport. Its position is saved across page reloads.
* **Collapsible:** Minimize the widget to a tiny bubble by double-clicking it or pressing the minimize button.
* Turns red and pulses when the focus timer is paused.

### 4. 🌳 Seed Growth Gamification & Streak tracking
* Choose from 4 seedling types: **Oak, Sunflower, Cedar, or Bamboo**.
* Earn **10 XP per minute** focused.
* Complete sessions to grow full majestic trees. Aborting a session will wither and kill the tree.
* Track daily streaks and lifetime stats.

---

## 📂 Repository Structure

* [extension/](file:///D:/jiwanshu/bluej/Downloads/FocusApp/extension) — Chrome Extension source code (HTML, CSS, Vanilla JS, Manifest V3).
* [src/](file:///D:/jiwanshu/bluej/Downloads/FocusApp/src) — React-based web companion dashboard source files.
* [vite.config.ts](file:///D:/jiwanshu/bluej/Downloads/FocusApp/vite.config.ts) / [package.json](file:///D:/jiwanshu/bluej/Downloads/FocusApp/package.json) — Build configuration for the React application.

---

## 🛠️ Step-by-Step Installation & Setup

### Part A: Load the Chrome Extension

1. Launch Google Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`extension`** folder inside this directory:
   `D:\jiwanshu\bluej\Downloads\FocusApp\extension`
5. Click **Select Folder**. The extension is now active!
6. Pin **Arbor Blocker** to your toolbar to get started.

### Part B: Run the React Web Dashboard

1. **Prerequisites:** Make sure you have [Node.js](https://nodejs.org/) installed.
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. View the dashboard locally at `http://localhost:3000`.
