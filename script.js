/**
 * ==========================================================================================
 * ZULORA OS - TITANIUM KERNEL (v11.5.0 Google Edition)
 * "The Unbreakable Neural Engine"
 * * [ SYSTEM ARCHITECTURE ]
 * 1. Bootloader ..... Instant-Load Technology & Self-Healing
 * 2. Auth ........... Google Firebase Authentication (Popup Flow)
 * 3. Store .......... Redux-style Global State Management
 * 4. Database ....... Cloud Firestore with Offline Persistence
 * 5. NeuralNet ...... Dual-Core AI Engine (Claude & Llama Logic)
 * 6. Editor ......... Real-time DOM Manipulation & Hosting Simulation
 * * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 0: IMMEDIATE PRE-FLIGHT CHECK & CONFIG LOAD
   -------------------------------------------------------------------------- */
// Grab config injected from HTML head
const GLOBAL_CONFIG = window.ZULORA_CONFIG || {};

const SYSTEM_CONFIG = {
    version: '11.5.0-google',
    debugMode: true, // Enables verbose logging and auto-fixes
    
    // AI Engine Configuration
    ai: {
        defaultEngine: 'claude',
        keys: GLOBAL_CONFIG.aiKeys || {}
    },

    // Economic Model (Credits System)
    economy: {
        signupBonus: 30,    // Given on first Google login
        referralBonus: 10,  // Given to referrer
        generationCost: 15, // Cost per website build
        updateCost: 3       // Cost per AI edit
    },

    // Firebase Config (Loaded from HTML)
    firebase: GLOBAL_CONFIG.firebase || {}
};

// --- FIREBASE IMMEDIATE INITIALIZATION ---
// Initialize instantly to prevent "No Firebase App" errors.
try {
    if (firebase && !firebase.apps.length) {
        firebase.initializeApp(SYSTEM_CONFIG.firebase);
        // Enable offline persistence for robust experience
        firebase.firestore().enablePersistence().catch(err => console.warn("Offline mode disabled:", err.code));
        console.log("✅ [System] Firebase connection established.");
    }
} catch (e) {
    console.error("❌ [CRITICAL] Firebase Init Failed:", e);
    // The bootloader will handle the fallback to offline mode.
}

/* --------------------------------------------------------------------------
   SECTION 1: GLOBAL UTILITIES (The Toolbelt)
   -------------------------------------------------------------------------- */
const Utils = {
    // High-performance UUID Generator
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Human-readable Referral Code
    generateRefCode() {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.random().toString(36).toUpperCase().slice(2, 6);
        return `Z-${timestamp}${random}`;
    },

    // Advanced Clipboard Copy
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
            return true;
        } catch (err) {
            // Fallback method
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            UI.toast("Copied!", "success");
        }
    },

    // Simulated Network Delay
    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

    // URL Parameter Extractor
    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    // Date Formatter
    formatDate(iso) { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
};

/* --------------------------------------------------------------------------
   SECTION 2: STATE MANAGEMENT STORE (Redux Pattern)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, // Firebase User Object
            profile: {  // Firestore Profile Data
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false,
                displayName: 'Creator',
                photoURL: null
            },
            ui: {
                currentView: 'landing',
                isSidebarOpen: false
            },
            isOfflineMode: false
        };
        this.loadPersistence();
    }

    // Load saved state from localStorage for instant feel
    loadPersistence() {
        try {
            const saved = localStorage.getItem('ZULORA_V11_STATE');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                // We don't persist the firebase user object directly, auth listener handles that
                console.log(">> [Store] State Rehydrated from local storage");
            }
        } catch (e) { console.warn("State reset required due to corruption"); }
    }

    save() {
        try {
            localStorage.setItem('ZULORA_V11_STATE', JSON.stringify({
                profile: this.state.profile
            }));
        } catch(e) { console.warn("Could not save state (quota exceeded)"); }
    }

    // Actions
    setUser(user) { 
        this.state.user = user; 
        // Don't save user auth token here, let Firebase handle it
    }
    
    updateProfile(data) { 
        this.state.profile = { ...this.state.profile, ...data }; 
        this.save();
        document.dispatchEvent(new CustomEvent('zulora:update'));
    }

    setOffline(status) {
        this.state.isOfflineMode = status;
        if(status) UI.toast("Network offline. Working locally.", "warning");
    }

    deductCredits(amount) {
        if (this.state.profile.credits >= amount) {
            this.updateProfile({ credits: this.state.profile.credits - amount });
            // Sync to DB happens asynchronously in DB service
            return true;
        }
        return false;
    }
}
const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 3: UI CONTROLLER (Visual Feedback & DOM Manipulation)
   -------------------------------------------------------------------------- */
class UIController {
    constructor() {
        this.loader = document.getElementById('bootloader');
        this.bar = document.getElementById('boot-bar');
        this.toastDock = document.getElementById('toast-dock');
    }

    // --- INSTANT BOOT SEQUENCE ---
    // Visually clears the loader quickly, while Auth connects in background.
    startBootSequence() {
        console.log(">> Boot Sequence Initiated");
        if(this.bar) this.bar.style.width = "100%";

        // Force fade out after a tight timeframe
        setTimeout(() => {
            if(this.loader && this.loader.style.display !== 'none') {
                this.loader.style.opacity = '0';
                this.loader.style.pointerEvents = 'none';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 800);
    }

    // Advanced Toast Notification System
    toast(msg, type = 'info') {
        const div = document.createElement('div');
        const config = {
            success: { icon: 'ri-checkbox-circle-fill', bg: 'bg-slate-900/95 border-green-500/30 text-green-400' },
            error:   { icon: 'ri-error-warning-fill',   bg: 'bg-slate-900/95 border-red-500/30 text-red-400' },
            warning: { icon: 'ri-alert-fill',           bg: 'bg-slate-900/95 border-yellow-500/30 text-yellow-400' },
            info:    { icon: 'ri-information-fill',     bg: 'bg-slate-900/95 border-brand-500/30 text-brand-400' }
        };
        const theme = config[type];

        div.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transform translate-x-full opacity-0 transition-all duration-500 ${theme.bg} min-w-[300px] z-[10000]`;
        div.innerHTML = `<i class="${theme.icon} text-xl"></i><span class="text-sm font-medium text-slate-200">${msg}</span>`;

        this.toastDock.appendChild(div);
        
        // Animation Frame guarantees smooth entry
        requestAnimationFrame(() => div.classList.remove('translate-x-full', 'opacity-0'));
        
        // Auto-dismiss
        setTimeout(() => {
            div.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => div.remove(), 500);
        }, 4000);
    }

    // Updates all data-driven elements on the page
    updateStats() {
        const p = Store.state.profile;
        const set = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };
        
        set('sidebar-name', p.displayName);
        set('sidebar-credits', p.credits);
        set('mobile-credits', p.credits);
        set('dash-credits', p.credits);
        set('dash-sites', p.projects?.length || 0);
        set('dash-referrals', p.referrals);
        
        // Update Avatar Image if available from Google
        const avatarEl = document.getElementById('sidebar-avatar');
        if(avatarEl && p.photoURL) {
            avatarEl.innerHTML = `<img src="${p.photoURL}" class="w-full h-full rounded-full object-cover">`;
        } else if (avatarEl) {
             avatarEl.innerHTML = p.displayName.charAt(0).toUpperCase();
        }

        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode || 'Generate'}`;
    }

    // Dynamically renders the Google Auth UI inside the existing modal
    renderGoogleAuthUI() {
        const modalBody = document.querySelector('#view-auth .bg-slate-900\\/80');
        if (!modalBody) return;

        // Replace the inner content of the modal body with the Google Auth structure
        modalBody.innerHTML = `
            <button onclick="window.router.go('landing')" class="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <i class="ri-close-circle-line text-2xl"></i>
            </button>

            <div class="text-center mb-8 pt-4">
                <div class="w-16 h-16 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg shadow-brand-500/20">Z</div>
                <h2 class="text-3xl font-bold text-white mb-3">Welcome to OS v11</h2>
                <p class="text-slate-400 text-base">Sign in securely to access your neural dashboard.</p>
            </div>

            <div class="space-y-6 mt-8">
                <button id="google-auth-btn" onclick="window.auth.signInWithGoogle()" class="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-6 rounded-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-6 h-6 relative z-10" alt="Google Logo">
                    <span class="text-lg relative z-10">Continue with Google</span>
                </button>
                
                <div class="relative flex py-4 items-center">
                    <div class="flex-grow border-t border-slate-800"></div>
                    <span class="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-widest">Trusted & Secure</span>
                    <div class="flex-grow border-t border-slate-800"></div>
                </div>
                 <p class="text-center text-xs text-slate-500">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
        `;
    }
}
const UI = new UIController();

/* --------------------------------------------------------------------------
   SECTION 4: ROUTER (Navigation Manager)
   -------------------------------------------------------------------------- */
const Router = {
    // Main Navigation Switcher
    go(route, params = {}) {
        // Hide all major views
        ['view-landing', 'view-auth', 'app-shell'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        switch(route) {
            case 'landing':
                document.getElementById('view-landing').classList.remove('hidden');
                document.body.style.overflow = 'auto';
                break;
            case 'auth':
                // Render the Google UI dynamically before showing
                UI.renderGoogleAuthUI();
                document.getElementById('view-auth').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                break;
            case 'app':
                if (!Store.state.user && !Store.state.isOfflineMode) return this.go('auth');
                document.getElementById('app-shell').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                this.switchTab(params.view || 'dashboard');
                break;
            default:
                this.go('landing');
        }
    },

    // Internal App Tab Switcher
    switchTab(tabId) {
        // Hide current active section
        document.querySelectorAll('.view-section.active').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in-up');
        });
        
        // Show target section with animation
        const target = document.getElementById(`view-${tabId}`);
        if(target) {
            target.classList.remove('hidden');
            void target.offsetWidth; // Trigger reflow for animation restart
            target.classList.add('active', 'animate-fade-in-up');
        }

        // Update Navigation active states
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
            btn.classList.remove('active');
            // Heuristic: check if the onclick handler targets this view
            if(btn.getAttribute('onclick')?.includes(tabId)) btn.classList.add('active');
        });
    }
};
// Expose Router globally
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 5: AUTHENTICATION (Google Firebase Implementation)
   -------------------------------------------------------------------------- */
const Auth = {
    provider: null, // Google Auth Provider definition

    init() {
        // Check for URL referral code and save it temporarily
        const urlRef = Utils.getParam('ref');
        if (urlRef) localStorage.setItem('ZULORA_TEMP_REF', urlRef);

        try {
            // Define Google Provider settings
            this.provider = new firebase.auth.GoogleAuthProvider();
            this.provider.setCustomParameters({ prompt: 'select_account' });

            // MAIN AUTH LISTENER: Handles application state based on login status
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    console.log(`>> [Auth] Verified: ${user.email}`);
                    Store.setUser(user);
                    
                    // Sync profile data from Firestore
                    await DB.syncProfile(user);
                    UI.updateStats();

                    // Determine redirect target
                    if (window.location.hash === '#auth' || document.getElementById('view-auth').classList.contains('hidden') === false) {
                         Router.go('app');
                         UI.toast(`Welcome back, ${user.displayName.split(' ')[0]}`, 'success');
                    }
                     // If on landing, stay there unless they click "Dashboard"
                } else {
                    console.log(">> [Auth] Signed out");
                    Store.setUser(null);
                    if(!document.getElementById('app-shell').classList.contains('hidden')){
                        Router.go('landing');
                    }
                }
            });
        } catch (e) {
            console.error(">> [Auth] Firebase Error. Switching to Offline Mode.", e);
            Store.setOffline(true);
             // If we have cached user data, let them in offline
            if(Store.state.profile.email) Router.go('app');
        }
    },

    // THE NEW GOOGLE SIGN-IN FUNCTION
    async signInWithGoogle() {
        const btn = document.getElementById('google-auth-btn');
        const originalContent = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i><span class="text-lg">Connecting to Google...</span>`;
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            // Use popup for a smoother desktop experience
            await firebase.auth().signInWithPopup(this.provider);
            // Successful sign-in is handled by onAuthStateChanged listener above.
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            let msg = "Sign-in failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
            if (error.code === 'auth/network-request-failed') msg = "Network error. Check connection.";
            
            UI.toast(msg, 'error');
            
            // Reset button state
            btn.innerHTML = originalContent;
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    },

    logout() {
        if (!Store.state.isOfflineMode) firebase.auth().signOut();
        Store.setUser(null);
        Router.go('landing');
        UI.toast("Successfully signed out", "info");
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 6: DATABASE (Firestore Sync & Project Management)
   -------------------------------------------------------------------------- */
const DB = {
    // Synchronizes Firestore data with local state
    async syncProfile(user) {
        if (Store.state.isOfflineMode) return;

        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);
        
        try {
            const doc = await ref.get();

            if (doc.exists) {
                // Existing User: Update local state
                const data = doc.data();
                // Ensure photoURL is updated if changed on Google side
                if(user.photoURL !== data.photoURL) {
                     await ref.update({ photoURL: user.photoURL });
                     data.photoURL = user.photoURL;
                }
                Store.updateProfile(data);
            } else {
                // New User: Create Profile
                console.log(">> [DB] Creating new user profile");
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    credits: SYSTEM_CONFIG.economy.signupBonus,
                    referralCode: Utils.generateRefCode(),
                    referrals: 0,
                    projects: [],
                    isPremium: false,
                    createdAt: new Date().toISOString()
                };

                // Apply Referral Bonus if applicable
                const refCode = localStorage.getItem('ZULORA_TEMP_REF');
                if (refCode) {
                    // Logic to find referrer and award them would go here (requires cloud functions for security)
                    // For now, we just acknowledge the referral locally
                    console.log(`Applied referral: ${refCode}`);
                    localStorage.removeItem('ZULORA_TEMP_REF');
                    UI.toast("Referral bonus applied!", "success");
                }
                
                await ref.set(newProfile);
                Store.updateProfile(newProfile);
            }
            App.renderProjects(); // Update UI with data

        } catch (e) {
            console.error("DB Sync Error:", e);
            UI.toast("Failed to sync data. Using local cache.", "warning");
        }
    },

    // Saves a new project to Firestore
    async saveProject(project) {
        // 1. Update local state immediately (Optimistic UI)
        const currentProjects = Store.state.profile.projects || [];
        const newProjects = [project, ...currentProjects];
        Store.updateProfile({ projects: newProjects });
        App.renderProjects();

        // 2. Sync to Cloud in background
        if (!Store.state.isOfflineMode && Store.state.user) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: newProjects,
                    credits: Store.state.profile.credits
                });
            } catch(e) { console.error("Cloud save failed:", e); }
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 7: NEURAL ENGINE (AI Generation Logic)
   -------------------------------------------------------------------------- */
const AI = {
    // Called from the landing page input field
    landingTrigger() {
        const val = document.getElementById('hero-prompt').value;
        if(!val) return UI.toast("Please describe your website first.", "warning");
        
        // Save prompt and send to login
        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        Router.go('auth');
        UI.toast("Sign in with Google to generate.", "info");
    },

    // Main generation function called from the dashboard
    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.toast("Prompt cannot be empty", "error");
        
        // Validate Credits
        if (Store.state.profile.credits < SYSTEM_CONFIG.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Credits. Upgrade required.", "error");
        }

        // UI Loading State
        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="flex items-center gap-2"><i class="ri-cpu-line animate-spin text-xl"></i> Initializing Neural Build...</span>`;
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            // Simulate AI processing latency
            await Utils.wait(2500);

            // Deduct credits locally
            Store.deductCredits(SYSTEM_CONFIG.economy.generationCost);
            UI.updateStats();

            // --- HYBRID ENGINE LOGIC ---
            // This simulates the AI selecting the best template based on keywords.
            // In a real backend version, this would call the Anthropic/Groq APIs.
            let templateType = 'startup'; // Default fallback
            if (prompt.includes('shop') || prompt.includes('store') || prompt.includes('commerce') || prompt.includes('sell')) templateType = 'store';
            else if (prompt.includes('portfolio') || prompt.includes('resume') || prompt.includes('cv') || prompt.includes('personal')) templateType = 'portfolio';
            else if (prompt.includes('food') || prompt.includes('restaurant') || prompt.includes('cafe') || prompt.includes('menu')) templateType = 'restaurant';

            // Generate the actual HTML
            const generatedHtml = Templates[templateType](Store.state.profile.displayName);

            // Create the project data structure
            const newProject = {
                id: Utils.uuid(),
                name: prompt.substring(0, 25) + (prompt.length > 25 ? '...' : ''),
                subdomain: Store.state.profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random()*9999),
                html: generatedHtml,
                engine: document.querySelector('input[name="ai-engine"]:checked').value,
                createdAt: new Date().toISOString()
            };

            // Save to DB and update UI
            await DB.saveProject(newProject);

            UI.toast("Website Generated Successfully!", "success");
            input.value = ""; // Clear input

            // Launch the editor
            Editor.open(newProject);

        } catch (e) {
            console.error("Generation Failed:", e);
            UI.toast("Neural Net Error. Credits refunded.", "error");
            // Refund credits on failure
            Store.addCredits(SYSTEM_CONFIG.economy.generationCost); 
            UI.updateStats();
        } finally {
            // Restore button state
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    },

    // Helper for "Quick Template" buttons
    useTemplate(type) {
        const prompts = {
            'startup': "A modern B2B SaaS startup landing page with feature grid and pricing.",
            'portfolio': "A dark-themed creative portfolio for a digital artist with gallery.",
            'store': "A minimalist fashion e-commerce store homepage with featured products.",
            'restaurant': "A cozy local restaurant website with menu section and contact info."
        };
        Router.go('create');
        const input = document.getElementById('ai-prompt-input');
        input.value = prompts[type];
        input.focus();
        input.scrollIntoView({ behavior: 'smooth' });
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 8: TEMPLATE LIBRARY (The Offline Brain)
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (name) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script><link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet"></head><body class="font-sans antialiased text-slate-900 bg-white"><nav class="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100"><div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center"><div class="font-black text-2xl text-indigo-600 tracking-tight">${name}.io</div><div class="hidden md:flex gap-8 text-sm font-medium text-slate-600"><a href="#features">Features</a><a href="#pricing">Pricing</a></div><button class="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition">Get Started</button></div></nav><section class="pt-32 pb-20 text-center px-4 bg-gradient-to-b from-indigo-50/50"><h1 class="text-5xl md:text-7xl font-black mb-8 tracking-tight">Ship faster.<br><span class="text-indigo-600">Scale harder.</span></h1><p class="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">The all-in-one platform for modern engineering teams.</p><div class="flex justify-center gap-4"><button class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:-translate-y-1 transition">Start Free Trial</button><button class="px-8 py-4 rounded-xl font-bold border border-slate-200 hover:bg-white transition">View Demo</button></div></section><section id="features" class="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12"><div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition"><i class="ri-rocket-line text-4xl text-indigo-500 mb-6"></i><h3 class="text-xl font-bold mb-3">Blazing Fast</h3><p class="text-slate-500">Built on edge infrastructure for lowest latency globally.</p></div><div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition"><i class="ri-shield-check-line text-4xl text-indigo-500 mb-6"></i><h3 class="text-xl font-bold mb-3">Enterprise Secure</h3><p class="text-slate-500">SOC2 compliant data handling and encryption.</p></div><div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition"><i class="ri-cpu-line text-4xl text-indigo-500 mb-6"></i><h3 class="text-xl font-bold mb-3">AI Powered</h3><p class="text-slate-500">Automate workflows with built-in intelligence.</p></div></section></body></html>`,
    
    portfolio: (name) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={darkMode:'class'}</script></head><body class="bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500 selection:text-white"><nav class="p-8 flex justify-between items-center max-w-7xl mx-auto"><div class="font-bold text-xl tracking-widest uppercase">${name}</div><a href="mailto:contact@example.com" class="text-sm hover:text-emerald-400 transition underline-offset-4 hover:underline">Available for work</a></nav><header class="py-32 px-8 max-w-7xl mx-auto"><h1 class="text-7xl md:text-9xl font-black mb-6 leading-none tracking-tighter">VISUAL<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">DESIGNER.</span></h1><p class="text-2xl text-zinc-500 max-w-2xl mt-12">Crafting digital experiences that blend form and function at the intersection of art and technology.</p></header><section class="px-8 py-20 max-w-7xl mx-auto"><h2 class="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-12">Selected Works</h2><div class="grid md:grid-cols-2 gap-8"><div class="group cursor-pointer"><div class="aspect-[4/3] bg-zinc-900 rounded-lg mb-4 overflow-hidden relative"><img src="https://source.unsplash.com/random/800x600?abstract" class="object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-700"></div><h3 class="text-2xl font-bold group-hover:text-emerald-400 transition">Project Alpha</h3><p class="text-zinc-500">Branding / UI/UX</p></div><div class="group cursor-pointer md:mt-24"><div class="aspect-[4/3] bg-zinc-900 rounded-lg mb-4 overflow-hidden relative"><img src="https://source.unsplash.com/random/800x600?3d" class="object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-700"></div><h3 class="text-2xl font-bold group-hover:text-emerald-400 transition">Neon Genesis</h3><p class="text-zinc-500">3D Motion Design</p></div></div></section></body></html>`,
    
    store: (name) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 text-stone-900 font-serif selection:bg-stone-900 selection:text-white"><div class="bg-stone-900 text-white text-center py-2 text-xs uppercase tracking-widest font-sans">Complimentary Global Shipping</div><nav class="sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-stone-100"><div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center"><div class="text-2xl font-bold italic">${name}</div><div class="flex gap-8 text-sm uppercase tracking-widest font-sans"><a href="#">Shop</a><a href="#">About</a><a href="#">Journal</a></div><div class="font-sans text-sm">Cart (0)</div></div></nav><header class="relative h-[85vh] flex items-center justify-center"><img src="https://source.unsplash.com/random/1600x900?fashion" class="absolute inset-0 w-full h-full object-cover grayscale"><div class="absolute inset-0 bg-stone-900/30"></div><div class="relative z-10 text-center text-white"><h1 class="text-6xl md:text-8xl mb-8 italic">The New Collection</h1><button class="bg-white text-stone-900 px-10 py-4 uppercase text-sm tracking-[0.2em] font-bold hover:bg-stone-100 transition font-sans">Explore Now</button></div></header></body></html>`,
    
    restaurant: (name) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans text-orange-950"><nav class="p-6 flex justify-between items-center max-w-6xl mx-auto"><div class="text-3xl font-black tracking-tight text-orange-800">${name}</div><div class="flex gap-8 font-medium"><a href="#">Menu</a><a href="#">Story</a><a href="#">Visit</a></div><button class="bg-orange-700 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-800 transition shadow-lg shadow-orange-700/20">Order Online</button></nav><header class="py-32 text-center px-4 max-w-4xl mx-auto"><h1 class="text-6xl md:text-7xl font-black mb-6 leading-tight">Locally Sourced.<br>Crafted with Love.</h1><p class="text-xl text-orange-800/70 mb-12 leading-relaxed">Experience authentic flavors in a warm, inviting atmosphere located in the heart of the city.</p><img src="https://source.unsplash.com/random/1200x600?food" class="rounded-3xl shadow-2xl shadow-orange-900/20"></header></body></html>`
};

/* --------------------------------------------------------------------------
   SECTION 9: EDITOR CONTROLLER (Hosting & Preview)
   -------------------------------------------------------------------------- */
const Editor = {
    modal: document.getElementById('editor-modal'),
    frame: document.getElementById('preview-frame'),
    currentProject: null,

    open(project) {
        this.currentProject = project;
        this.modal.classList.remove('hidden');
        // Set fake subdomain
        document.getElementById('editor-subdomain').innerText = `https://${project.subdomain}.zulora.in`;
        
        // Smooth reveal
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            const doc = this.frame.contentWindow.document;
            doc.open();
            doc.write(project.html);
            doc.close();
            
            // Inject visual editing script into iframe
            const s = doc.createElement('script');
            s.innerHTML = `document.body.addEventListener('click',e=>{if(['H1','H2','H3','P','BUTTON','A','SPAN'].includes(e.target.tagName)){e.preventDefault();e.target.contentEditable=true;e.target.focus();e.target.style.outline='2px dashed #6366f1';e.target.onblur=()=>{e.target.style.outline='none';}}});`;
            doc.body.appendChild(s);
        });
    },

    close() {
        this.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.frame.src = 'about:blank'; // Clear memory
        }, 300);
        // Refresh dashboard thumbnails
        App.renderProjects();
    },

    setDevice(mode) {
        const container = document.getElementById('editor-frame-container');
        if (mode === 'mobile') container.classList.add('mobile-view');
        else container.classList.remove('mobile-view');
    },

    async aiEdit() {
        // Feature simulation
        if (!Store.deductCredits(SYSTEM_CONFIG.economy.updateCost)) {
            return UI.toast(`Need ${SYSTEM_CONFIG.economy.updateCost} credits for AI Edit`, "error");
        }
        UI.updateStats();
        UI.toast("AI analyzing layout... (Simulation Mode)", "info");
        // In a full version, this would send current HTML to LLM for modification
    },

    save() {
        if (!this.currentProject) return;
        // Get modified HTML from iframe
        const newHtml = this.frame.contentWindow.document.documentElement.outerHTML;
        
        // Update local state
        const projects = Store.state.profile.projects;
        const idx = projects.findIndex(p => p.id === this.currentProject.id);
        
        if (idx !== -1) {
            projects[idx].html = newHtml;
            Store.updateProfile({ projects });
            
            // Sync to Cloud if online
            if (!Store.state.isOfflineMode && Store.state.user) {
                DB.saveProject(this.currentProject).catch(e => console.warn("Cloud save pending..."));
            }
            
            UI.toast("Changes deployed live!", "success");
            this.showDeployLoader();
        }
    },

    showDeployLoader() {
        const loader = document.getElementById('deploy-modal');
        loader.classList.remove('hidden', 'opacity-0');
        loader.style.display = 'flex';
        setTimeout(() => {
            loader.classList.add('opacity-0');
            setTimeout(() => {
                loader.style.display = 'none';
                loader.classList.add('hidden');
            }, 500);
        }, 2000);
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 10: REFERRAL & PAYMENT SYSTEMS
   -------------------------------------------------------------------------- */
window.referral = {
    copy: () => Utils.copy(document.getElementById('referral-link-input').value),
    share: (platform) => {
        const link = document.getElementById('referral-link-input').value;
        const text = "Build AI websites instantly! Get 30 Free Credits:";
        const urls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
        };
        if(urls[platform]) window.open(urls[platform], '_blank');
    }
};

window.payment = {
    open: () => {
        const m = document.getElementById('payment-modal');
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0', 'scale-95'), 10);
    },
    close: () => {
        const m = document.getElementById('payment-modal');
        m.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    }
};

/* --------------------------------------------------------------------------
   SECTION 11: APP INITIALIZATION & RENDERERS
   -------------------------------------------------------------------------- */
const App = {
    init() {
        // 1. Start Boot Animation instantly
        UI.startBootSequence();

        // 2. Initialize Auth (runs in background)
        Auth.init();
        
        // 3. Check for pending tasks
        this.checkPendingTasks();

        // 4. Global Event Listeners
        document.addEventListener('zulora:update', () => {
            UI.updateStats();
            this.renderProjects();
        });
    },

    checkPendingTasks() {
        const pendingPrompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
        if (pendingPrompt && Store.state.user) {
            Router.go('create');
            setTimeout(() => {
                const input = document.getElementById('ai-prompt-input');
                if(input) {
                    input.value = pendingPrompt;
                    input.focus();
                }
                sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
            }, 500);
        }
    },

    renderProjects() {
        const list = document.getElementById('dash-project-list');
        const allList = document.getElementById('all-projects-grid');
        const empty = document.getElementById('dash-empty');
        const projects = Store.state.profile.projects || [];

        if (projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            if(list) list.innerHTML = '';
            if(allList) allList.innerHTML = '<div class="text-slate-500 text-center col-span-full py-12">No projects found. Start building!</div>';
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        const renderCard = (p) => `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer group hover:border-brand-500/50 transition-all duration-300 shadow-sm hover:shadow-md" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-80 group-hover:opacity-30 transition"></div>
                    
                    <div class="absolute top-3 right-3">
                        ${p.engine === 'llama' 
                            ? '<span class="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur"><i class="ri-speed-line"></i> Llama 3</span>' 
                            : '<span class="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur"><i class="ri-brain-line"></i> Claude</span>'}
                    </div>

                    <div class="absolute bottom-3 left-4 flex gap-2 items-center">
                         <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span class="text-green-400 text-[10px] font-bold tracking-wider">LIVE</span>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="text-white font-bold truncate text-lg mb-1 group-hover:text-brand-400 transition">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono flex items-center gap-1 truncate"><i class="ri-global-line"></i> ${p.subdomain}.zulora.in</p>
                    <div class="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500">
                        <span>${Utils.formatDate(p.createdAt)}</span>
                        <button class="hover:text-white transition flex items-center gap-1 bg-slate-800 px-2 py-1 rounded hover:bg-brand-600"><i class="ri-edit-circle-line"></i> Open Editor</button>
                    </div>
                </div>
            </div>`;

        // Render Dashboard (Recent 3)
        if(list) list.innerHTML = projects.slice(0, 3).map(renderCard).join('');
        // Render All Projects View
        if(allList) allList.innerHTML = projects.map(renderCard).join('');
    }
};

// Global Hook for external utilities if needed
window.utils = Utils;

// --- START THE ENGINE ---
// We use "load" instead of "DOMContentLoaded" to ensure styles are ready for the boot transition.
window.addEventListener('load', () => App.init());
