/* ==========================================================================
   ZULORA OS - ENTERPRISE DESIGN SYSTEM (v6.0 Ultimate)
   "The Neural Interface" Theme
   Status: Production Ready
   Author: Zulora Dev Team
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CORE VARIABLES & TOKENS
   -------------------------------------------------------------------------- */
:root {
    /* --- Brand Palette (Indigo-Violet Fusion) --- */
    --brand-50: #eef2ff;
    --brand-100: #e0e7ff;
    --brand-200: #c7d2fe;
    --brand-300: #a5b4fc;
    --brand-400: #818cf8;
    --brand-500: #6366f1; /* Primary Core */
    --brand-600: #4f46e5;
    --brand-700: #4338ca;
    --brand-800: #3730a3;
    --brand-900: #312e81;
    --brand-950: #1e1b4b; /* Deep Space */

    /* --- Secondary Palette (Emerald/Teal) --- */
    --secondary-500: #10b981;
    --secondary-600: #059669;
    --secondary-glow: rgba(16, 185, 129, 0.5);

    /* --- Accent Palette (Electric Pink) --- */
    --accent-500: #ec4899;
    --accent-glow: rgba(236, 72, 153, 0.5);

    /* --- Functional Colors --- */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --info: #3b82f6;

    /* --- Surface & Backgrounds (Dark Mode Base) --- */
    --bg-void: #020617;   /* Absolute Black/Blue */
    --bg-surface: #0f172a; /* Slate 900 */
    --bg-card: #1e293b;    /* Slate 800 */
    --bg-glass: rgba(15, 23, 42, 0.7);
    --bg-glass-light: rgba(255, 255, 255, 0.8);
    --bg-overlay: rgba(0, 0, 0, 0.6);

    /* --- Typography & Borders --- */
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --text-disabled: #475569;
    --border-light: rgba(255, 255, 255, 0.1);
    --border-dark: rgba(0, 0, 0, 0.1);
    --border-highlight: rgba(99, 102, 241, 0.3);

    /* --- Effects & Shadows --- */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --shadow-neon: 0 0 15px rgba(99, 102, 241, 0.6), 0 0 30px rgba(99, 102, 241, 0.3);
    
    /* --- Animation Timings (Physics Based) --- */
    --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
    
    /* --- Z-Index Hierarchy --- */
    --z-base: 0;
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
    --z-loader: 9999;
}

/* --------------------------------------------------------------------------
   2. GLOBAL RESET & BASE SETTINGS
   -------------------------------------------------------------------------- */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent; /* Mobile Optimization */
}

html {
    scroll-behavior: smooth;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
}

body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow-x: hidden; /* Prevent horizontal scrollbars */
    background-color: var(--bg-void);
    color: var(--text-main);
    line-height: 1.5;
    height: 100%;
}

/* Custom Selection Style */
::selection {
    background: var(--brand-500);
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

img, video, iframe {
    max-width: 100%;
    display: block;
}

a {
    text-decoration: none;
    color: inherit;
    transition: color 0.2s var(--ease-smooth);
}

button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
}

/* --------------------------------------------------------------------------
   3. UTILITY CLASSES & MIXINS
   -------------------------------------------------------------------------- */

/* Custom Scrollbar - The "Invisible" Feel */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 99px;
    border: 2px solid transparent; /* Creates padding effect */
    background-clip: content-box;
    transition: background 0.3s;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #475569;
}

/* Glassmorphism Engine */
.glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.glass-panel-dark {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Text Gradient Utility */
.text-gradient {
    background: linear-gradient(135deg, var(--brand-400), #c084fc 50%, #f472b6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
}

/* Focus Ring Utility */
.focus-ring:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg-void), 0 0 0 4px var(--brand-500);
}

/* --------------------------------------------------------------------------
   4. ADVANCED KEYFRAME ANIMATIONS
   -------------------------------------------------------------------------- */

/* A. Fade In Up (Smooth Entry) */
@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translate3d(0, 40px, 0);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.8s var(--ease-snappy) forwards;
}

/* B. Background Blob Floating (Organic Movement) */
@keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
    animation: blob 15s infinite ease-in-out;
}

/* C. Shimmer Effect (For skeletons/loading) */
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.shimmer-bg {
    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
}

/* D. Pulse Slow (Breathing Effect) */
@keyframes pulseSlow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}

.animate-pulse-slow {
    animation: pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* E. Pop In (Modals) */
@keyframes popIn {
    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-pop-in {
    animation: popIn 0.4s var(--ease-spring) forwards;
}

/* F. Slide In From Right (Toasts) */
@keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* G. Spin (Loaders) */
@keyframes spin {
    to { transform: rotate(360deg); }
}

.animate-spin-slow {
    animation: spin 3s linear infinite;
}

/* H. Float Y (Hover effect simulation) */
@keyframes floatY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.animate-float {
    animation: floatY 6s ease-in-out infinite;
}

/* --------------------------------------------------------------------------
   5. COMPONENT STYLING: NAVIGATION
   -------------------------------------------------------------------------- */

/* Landing Page Nav */
#landing-nav {
    transition: all 0.4s var(--ease-smooth);
}

#landing-nav.scrolled {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    padding-top: 0;
    padding-bottom: 0;
    height: 64px;
}

/* Sidebar Navigation Items */
.nav-item {
    position: relative;
    overflow: hidden;
    transition: all 0.2s var(--ease-smooth);
    border: 1px solid transparent;
}

/* Active State Indicator */
.nav-item.active {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
    color: #fff !important;
    border-left: 3px solid var(--brand-500);
    padding-left: calc(1rem - 3px); /* Compensate for border width */
}

.nav-item.active i {
    color: var(--brand-400);
    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
}

/* Hover Shine Effect */
.nav-item::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transition: 0.5s;
    pointer-events: none;
    transform: skewX(-20deg);
}

.nav-item:hover::after {
    left: 150%;
    transition: 0.7s ease-in-out;
}

/* --------------------------------------------------------------------------
   6. COMPONENT STYLING: INPUTS & FORMS
   -------------------------------------------------------------------------- */

/* The Hero Input Field */
#hero-input {
    transition: all 0.3s;
    background: transparent;
    font-weight: 500;
}
#hero-input:focus {
    color: var(--brand-900);
}
#hero-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
    transition: opacity 0.2s;
}
#hero-input:focus::placeholder {
    opacity: 0.5;
}

/* AI Prompt Input (Dark Mode) */
#ai-prompt-input {
    background-image: linear-gradient(#1e293b, #1e293b), linear-gradient(to right, #334155, #334155);
    background-origin: border-box;
    background-clip: padding-box, border-box;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    line-height: 1.6;
}

#ai-prompt-input:focus {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px rgba(99, 102, 241, 0.3);
    border-color: var(--brand-500);
}

/* Auth Input Fields */
.auth-input {
    transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s;
}

.auth-input:focus {
    border-color: var(--brand-500);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    background-color: rgba(30, 41, 59, 0.8);
}

/* --------------------------------------------------------------------------
   7. COMPONENT STYLING: BUTTONS
   -------------------------------------------------------------------------- */

/* Base Button Physics */
button {
    transition: transform 0.1s var(--ease-smooth), box-shadow 0.2s var(--ease-smooth), background-color 0.2s;
}
button:active {
    transform: scale(0.97);
}

/* Primary "Generate" Button with Pulse */
#btn-generate {
    position: relative;
    overflow: hidden;
    background-size: 200% auto;
    transition: 0.5s;
}

#btn-generate:hover {
    background-position: right center; /* change the direction of the change here */
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
}

#btn-generate::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
}

#btn-generate:active::before {
    width: 300px;
    height: 300px;
}

/* Loading State for Buttons */
.btn-loading {
    color: transparent !important;
    pointer-events: none;
    position: relative;
}

.btn-loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1.2em;
    height: 1.2em;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    transform: translate(-50%, -50%);
}

/* --------------------------------------------------------------------------
   8. COMPONENT STYLING: CARDS & CONTAINERS
   -------------------------------------------------------------------------- */

/* Stat Cards (Dashboard) */
.stat-card-hover:hover {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.15);
    transform: translateY(-4px);
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
}

/* Project Cards */
.project-card {
    transition: all 0.4s var(--ease-spring);
    position: relative;
    isolation: isolate;
}

.project-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    z-index: -1;
    background: linear-gradient(to bottom, rgba(99, 102, 241, 0.3), transparent);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s;
}

.project-card:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.4);
    z-index: 10;
}

.project-card:hover::before {
    opacity: 1;
}

/* Premium Plan - "Most Popular" Badge Ribbon */
.premium-ribbon {
    position: absolute;
    top: 20px;
    right: -30px;
    background: linear-gradient(90deg, var(--brand-600), var(--brand-500));
    width: 120px;
    text-align: center;
    transform: rotate(45deg);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    z-index: 20;
}

/* --------------------------------------------------------------------------
   9. EDITOR INTERFACE
   -------------------------------------------------------------------------- */

/* Editor Iframe Container */
#editor-frame-container {
    background: #fff;
    transition: width 0.6s var(--ease-elastic), height 0.6s var(--ease-elastic), border-radius 0.6s;
    box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7);
    transform-origin: center top;
}

/* Desktop View */
#editor-frame-container.desktop-view {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    border: 1px solid #334155;
}

/* Mobile View Simulation */
#editor-frame-container.mobile-view {
    width: 375px !important;
    height: 720px !important;
    max-height: 85vh;
    border-radius: 40px;
    border: 12px solid #1e293b;
    position: relative;
    margin: 0 auto;
}

/* Mobile View Notch Simulation */
#editor-frame-container.mobile-view::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 24px;
    background: #1e293b;
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 14px;
    z-index: 50;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Loader inside editor */
.iframe-loader {
    position: absolute;
    inset: 0;
    background: #fff;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* --------------------------------------------------------------------------
   10. TOAST NOTIFICATIONS (SLICK ANIMATIONS)
   -------------------------------------------------------------------------- */
#toast-container {
    perspective: 1000px;
}

.animate-bounce-in {
    animation: toastBounceIn 0.6s var(--ease-elastic) forwards;
}

@keyframes toastBounceIn {
    0% {
        opacity: 0;
        transform: translateX(100%) scale(0.8) skewX(-10deg);
    }
    60% {
        transform: translateX(-5%) scale(1.02) skewX(2deg);
    }
    100% {
        opacity: 1;
        transform: translateX(0) scale(1) skewX(0);
    }
}

/* --------------------------------------------------------------------------
   11. LOADING SPINNERS & PROGRESS
   -------------------------------------------------------------------------- */
/* Master Loader Progress Bar */
#loader-bar {
    box-shadow: 0 0 15px var(--brand-500);
    position: relative;
    overflow: hidden;
}

#loader-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-image: linear-gradient(
        -45deg, 
        rgba(255, 255, 255, 0.2) 25%, 
        transparent 25%, 
        transparent 50%, 
        rgba(255, 255, 255, 0.2) 50%, 
        rgba(255, 255, 255, 0.2) 75%, 
        transparent 75%, 
        transparent
    );
    background-size: 20px 20px;
    animation: moveStripes 1s linear infinite;
}

@keyframes moveStripes {
    0% { background-position: 0 0; }
    100% { background-position: 50px 50px; }
}

/* AI Thinking Dots */
.typing-dot {
    width: 6px;
    height: 6px;
    background: #94a3b8;
    border-radius: 50%;
    display: inline-block;
    animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.5); background-color: var(--brand-400); }
}

/* --------------------------------------------------------------------------
   12. RESPONSIVE UTILITIES & MEDIA QUERIES
   -------------------------------------------------------------------------- */

/* --- Mobile Specific ( < 768px ) --- */
@media (max-width: 768px) {
    /* Hide decorative blobs on mobile to save battery */
    .animate-blob {
        opacity: 0.15; /* Dim them instead of hiding completely */
        animation-duration: 20s; /* Slower animation */
    }
    
    /* Typography Adjustments */
    h1 { font-size: 2.5rem !important; }
    h2 { font-size: 2rem !important; }
    
    /* Sidebar collapse logic logic */
    aside {
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    aside.open {
        transform: translateX(0);
        box-shadow: 0 0 50px rgba(0,0,0,0.5);
    }

    /* Mobile Nav Bar */
    .mobile-nav-item {
        position: relative;
    }
    .mobile-nav-item.active {
        color: var(--brand-400);
    }
    .mobile-nav-item.active::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background: var(--brand-400);
        border-radius: 50%;
        box-shadow: 0 0 5px var(--brand-400);
    }
}

/* --- Tablet Specific ( 768px - 1024px ) --- */
@media (min-width: 768px) and (max-width: 1024px) {
    #view-create {
        padding-bottom: 100px;
    }
    .grid-cols-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

/* --- Desktop Specific ( > 1024px ) --- */
@media (min-width: 1024px) {
    .hover-lift:hover {
        transform: translateY(-5px);
    }
    
    /* Custom Scrollbar only for desktop mouse users */
    * {
        scrollbar-width: thin;
        scrollbar-color: var(--border-light) transparent;
    }
}

/* --- Large Screens ( > 1440px ) --- */
@media (min-width: 1440px) {
    .max-w-7xl {
        max-width: 90rem; /* 1440px */
    }
    
    /* Enhance font sizes for big monitors */
    body {
        font-size: 1.05rem;
    }
}

/* --------------------------------------------------------------------------
   13. PRINT STYLES (Just in case)
   -------------------------------------------------------------------------- */
@media print {
    body { background: white; color: black; }
    .no-print { display: none; }
    /* Hide navs, sidebars, buttons */
    nav, aside, button, .hidden { display: none !important; }
}

/* End of Stylesheet */
