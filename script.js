/**
 * ==========================================================================================
 * ______     __  __     __         ______     ______     ______    
 * /\___  \   /\ \/\ \   /\ \       /\  __ \   /\  == \   /\  __ \   
 * \/_/  /__  \ \ \_\ \  \ \ \____  \ \ \/\ \  \ \  __<   \ \  __ \  
 * /\_____\  \ \_____\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_\ \_\ 
 * \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/   \/_/\/_/ 
 *
 * ZULORA OS - TITANIUM KERNEL (v13.0.0)
 * "The Unbreakable Neural Engine"
 * * [ ARCHITECTURE MANIFEST ]
 * 1. Bootloader ..... Self-Healing Instant Start
 * 2. StateStore ..... Persistent Redux-like Data Layer
 * 3. AuthCore ....... Google Firebase + Offline Session Token
 * 4. NeuralNet ...... Dual-Engine AI (Claude/Llama Logic)
 * 5. Hosting ........ Edge Network Simulation & Subdomain DNS
 * 6. Referral ....... Viral Growth Engine (Unique Keys)
 * 7. Editor ......... Real-time DOM Manipulation
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: SYSTEM CONFIGURATION & ENVIRONMENT
   -------------------------------------------------------------------------- */
const ENV = window.ZULORA_CONFIG || {};

const SYSTEM = {
    version: '13.0.0-titanium',
    build: '2026.02.04',
    debug: true, // Enables verbose console logging
    
    // Economic Engine
    economy: {
        signupBonus: 30,       // Base credits for new users
        referralReward: 15,    // Bonus for using a code
        referrerReward: 15,    // Bonus for the owner of the code
        generationCost: 15,    // Cost to build a site
        aiEditCost: 3,         // Cost to edit via AI
        premiumCost: 199,      // INR
        premiumCredits: 1000   // Monthly allowance
    },

    // Hosting Configuration
    hosting: {
        rootDomain: 'zulora.in',
        nameservers: ['ns1.zulora.cloud', 'ns2.zulora.cloud'],
        sslProvider: 'Let\'s Encrypt v3'
    },

    // AI Engine Config
    ai: {
        defaults: {
            engine: 'claude',
            temperature: 0.7
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITY TOOLKIT
   -------------------------------------------------------------------------- */
const Utils = {
    // Cryptographic UUID Generator
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Human-Readable Referral Code Generator (e.g., "ZUL-K9X2")
    generateRefCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
        let result = 'ZUL-';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Time Ago Formatter
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    },

    // Clipboard Manager with Toast Feedback
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
            return true;
        } catch (err) {
            // Fallback for older browsers
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            UI.toast("Copied!", "success");
            return true;
        }
    },

    // Async Delay
    wait(ms) { return new Promise(r => setTimeout(r, ms)); },

    // URL Parameter Extractor
    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    // External Link Handler
    contact(type) {
        const admin = ENV.admin || {};
        const links = {
            whatsapp: `https://wa.me/${admin.whatsapp}?text=Hi%20Zulora%20Support`,
            instagram: admin.instagram,
            email: `mailto:${admin.email}`
        };
        if(links[type]) window.open(links[type], '_blank');
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (PERSISTENT DATA LAYER)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, // Ephemeral Firebase User Object
            profile: {
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false,
                displayName: 'Guest',
                email: '',
                photoURL: null,
                referralCode: 'GEN-WAIT',
                joinedAt: null
            },
            ui: {
                sidebarOpen: false,
                currentView: 'home'
            },
            isOffline: false
        };
        
        this.listeners = [];
        this.load();
    }

    // Load from LocalStorage
    load() {
        try {
            const serialized = localStorage.getItem('ZULORA_V13_STATE');
            if (serialized) {
                const parsed = JSON.parse(serialized);
                // Merge profile deeply to avoid overwriting new structure
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                console.log(">> [Store] Hydrated from disk.");
            }
        } catch (e) {
            console.warn(">> [Store] Corrupt state reset.");
            localStorage.removeItem('ZULORA_V13_STATE');
        }
    }

    // Save to LocalStorage
    save() {
        try {
            const toSave = { profile: this.state.profile };
            localStorage.setItem('ZULORA_V13_STATE', JSON.stringify(toSave));
        } catch (e) {
            console.error("Storage Quota Exceeded");
        }
    }

    // Setters
    setUser(firebaseUser) {
        this.state.user = firebaseUser;
        this.notify();
    }

    updateProfile(data) {
        this.state.profile = { ...this.state.profile, ...data };
        this.save();
        this.notify();
    }

    // Credit Logic
    deductCredits(amount) {
        if (this.state.profile.credits >= amount) {
            this.updateProfile({ credits: this.state.profile.credits - amount });
            return true;
        }
        return false;
    }

    addCredits(amount) {
        this.updateProfile({ credits: this.state.profile.credits + amount });
    }

    // Sub/Pub Pattern
    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.state));
        UI.render(); // Global UI Refresh
    }
}

const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER (DOM MANIPULATOR)
   -------------------------------------------------------------------------- */
const UI = {
    // Elements
    loader: document.getElementById('bootloader'),
    toastDock: document.getElementById('toast-dock'),

    // --- INSTANT BOOT SEQUENCE ---
    boot() {
        console.log(">> [Boot] System Starting...");
        const bar = document.getElementById('boot-bar');
        if(bar) bar.style.width = '100%';

        // Force remove loader after 500ms regardless of network
        setTimeout(() => {
            if(this.loader) {
                this.loader.style.opacity = '0';
                this.loader.style.pointerEvents = 'none';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 500);
    },

    // Toast Notification System
    toast(msg, type = 'info') {
        const el = document.createElement('div');
        const styles = {
            success: { bg: 'bg-slate-900/95', border: 'border-green-500/30', icon: 'ri-checkbox-circle-fill text-green-400' },
            error:   { bg: 'bg-slate-900/95', border: 'border-red-500/30',   icon: 'ri-error-warning-fill text-red-400' },
            info:    { bg: 'bg-slate-900/95', border: 'border-brand-500/30', icon: 'ri-information-fill text-brand-400' },
            gold:    { bg: 'bg-slate-900/95', border: 'border-yellow-500/30', icon: 'ri-vip-crown-fill text-yellow-400' }
        };
        const s = styles[type] || styles.info;

        el.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in pointer-events-auto ${s.bg} ${s.border}`;
        el.innerHTML = `<i class="${s.icon} text-xl"></i><span class="text-sm font-medium text-slate-200">${msg}</span>`;

        this.toastDock.appendChild(el);

        // Auto Dismiss
        setTimeout(() => {
            el.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => el.remove(), 300);
        }, 4000);
    },

    // Global UI Render (React-like updates)
    render() {
        const s = Store.state;
        const p = s.profile;
        const isLoggedIn = !!s.user;

        // 1. Update Navbar State
        const navOut = document.getElementById('nav-logged-out');
        const navIn = document.getElementById('nav-logged-in');
        
        if (isLoggedIn) {
            if(navOut) navOut.classList.add('hidden');
            if(navIn) {
                navIn.classList.remove('hidden');
                navIn.classList.add('flex');
            }
            // Update Nav Text
            const nameEl = document.getElementById('nav-user-name');
            const credEl = document.getElementById('nav-user-credits');
            if(nameEl) nameEl.innerText = p.displayName.split(' ')[0];
            if(credEl) credEl.innerText = `${p.credits} Cr`;
        } else {
            if(navOut) navOut.classList.remove('hidden');
            if(navIn) navIn.classList.add('hidden');
        }

        // 2. Update Sidebar Drawer Data
        const drawerName = document.getElementById('drawer-name');
        const drawerEmail = document.getElementById('drawer-email');
        const drawerCredits = document.getElementById('drawer-credits');
        const drawerAvatar = document.getElementById('drawer-avatar');

        if(drawerName) drawerName.innerText = isLoggedIn ? p.displayName : 'Guest User';
        if(drawerEmail) drawerEmail.innerText = isLoggedIn ? (s.user.email) : 'Not Logged In';
        if(drawerCredits) drawerCredits.innerText = p.credits;
        
        if(drawerAvatar) {
            if (isLoggedIn && p.photoURL) {
                drawerAvatar.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;
            } else {
                drawerAvatar.innerHTML = 'U';
            }
        }

        // 3. Update Dashboard Stats
        const dashCredits = document.getElementById('dash-credits');
        const dashSites = document.getElementById('dash-sites');
        const dashReferrals = document.getElementById('dash-referrals');

        if(dashCredits) dashCredits.innerText = p.credits;
        if(dashSites) dashSites.innerText = p.projects.length;
        if(dashReferrals) dashReferrals.innerText = p.referrals;

        // 4. Update Referral Link Input
        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode}`;
    }
};

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER & NAVIGATION
   -------------------------------------------------------------------------- */
const Router = {
    // Core Navigation Logic
    go(route, params = {}) {
        // 1. Close auxiliary menus
        Sidebar.close();
        
        // 2. Hide all main views
        ['view-landing', 'app-root', 'view-auth'].forEach(id => {
            const el = document.getElementById(id);
            if(el && route === 'auth') { /* handled in switch */ } 
            else if(el && id === 'view-auth') el.classList.add('hidden');
        });

        // 3. Route Switch
        switch(route) {
            case 'home':
            case 'landing':
                // Check if user is logged in, show app shell, else show landing??
                // The prompt requested a specific flow. We assume Single Page App.
                // We show the Main App Shell always, and switch inner views.
                this.switchTab('home');
                break;

            case 'auth':
                // Show Modal
                Auth.openModal();
                break;

            case 'app':
                // Generic app route
                if (!Store.state.user) return this.go('auth');
                this.switchTab('dashboard');
                break;

            // Direct Links
            case 'create':
            case 'projects':
            case 'premium':
            case 'referral':
            case 'hosting':
                if (!Store.state.user && !Store.state.isOffline) {
                    sessionStorage.setItem('ZULORA_REDIRECT', route);
                    Auth.openModal();
                    return;
                }
                this.switchTab(route);
                break;

            default:
                this.switchTab('home');
        }
    },

    // Internal Tab Switcher
    switchTab(tabId) {
        // Maps
        const validTabs = ['home', 'create', 'projects', 'premium', 'referral', 'hosting'];
        const target = validTabs.includes(tabId) ? tabId : 'home';

        // Hide all sections
        document.querySelectorAll('section[id^="view-"]').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in');
        });

        // Show target
        const view = document.getElementById(`view-${target}`);
        if(view) {
            view.classList.remove('hidden');
            void view.offsetWidth; // Reflow for animation
            view.classList.add('active', 'animate-fade-in');
        }

        // Scroll to top
        const viewport = document.getElementById('main-viewport');
        if(viewport) viewport.scrollTo(0,0);
    }
};
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 6: SIDEBAR (THREE DOTS DRAWER)
   -------------------------------------------------------------------------- */
const Sidebar = {
    el: document.getElementById('sidebar-drawer'),
    overlay: document.getElementById('sidebar-overlay'),
    
    toggle() {
        if (this.el.classList.contains('translate-x-full')) this.open();
        else this.close();
    },

    open() {
        this.el.classList.remove('translate-x-full');
        this.overlay.classList.remove('hidden');
        setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
    },

    close() {
        this.el.classList.add('translate-x-full');
        this.overlay.classList.add('opacity-0');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
    }
};
window.sidebar = Sidebar;

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION (FIREBASE + GOOGLE)
   -------------------------------------------------------------------------- */
const Auth = {
    init() {
        if (firebase && !firebase.apps.length) {
            try {
                firebase.initializeApp(ENV.firebase);
                console.log(">> [Auth] Firebase Initialized");
            } catch (e) {
                console.error("Firebase Config Error:", e);
                Store.state.isOffline = true; // Fallback
            }
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        // Auth State Listener
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log(`>> [Auth] Logged in: ${user.email}`);
                Store.setUser(user);
                
                // Sync Profile (Credits, Referrals)
                await DB.syncProfile(user);
                
                // Close Modal
                this.closeModal();

                // Handle Redirects
                const redirect = sessionStorage.getItem('ZULORA_REDIRECT');
                if (redirect) {
                    sessionStorage.removeItem('ZULORA_REDIRECT');
                    Router.go(redirect);
                } else {
                    // Update UI
                    UI.toast(`Welcome back, ${user.displayName.split(' ')[0]}`, 'success');
                }

                // Check Pending Prompt
                const pendingPrompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
                if (pendingPrompt) {
                    Router.go('create');
                    setTimeout(() => {
                        const input = document.getElementById('ai-prompt-input');
                        if(input) input.value = pendingPrompt;
                        sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
                    }, 500);
                }

            } else {
                console.log(">> [Auth] Guest Mode");
                Store.setUser(null);
                UI.render(); // Reset UI to guest
            }
        });

        this.provider = provider;
    },

    openModal() {
        const m = document.getElementById('auth-modal');
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0', 'scale-95'), 10);
    },

    closeModal() {
        const m = document.getElementById('auth-modal');
        m.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    async signIn() {
        const btn = document.getElementById('google-signin-btn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Connecting...`;
        btn.disabled = true;

        try {
            await firebase.auth().signInWithPopup(this.provider);
            // State handled by listener
        } catch (error) {
            console.error(error);
            UI.toast("Sign in failed. Try again.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    logout() {
        firebase.auth().signOut();
        Sidebar.close();
        UI.toast("Signed out.", "info");
        Router.go('home');
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE & REFERRAL ENGINE
   -------------------------------------------------------------------------- */
const DB = {
    async syncProfile(user) {
        if (Store.state.isOffline) return;

        const db = firebase.firestore();
        const docRef = db.collection('users').doc(user.uid);

        try {
            const doc = await docRef.get();

            if (doc.exists) {
                // Update Local Store
                const data = doc.data();
                Store.updateProfile(data);
            } else {
                // First Time User - Create Profile
                console.log(">> [DB] Creating New Profile");
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    credits: SYSTEM.economy.signupBonus, // 30 Credits
                    referrals: 0,
                    referralCode: Utils.generateRefCode(),
                    projects: [],
                    isPremium: false,
                    createdAt: new Date().toISOString()
                };

                // CHECK REFERRAL URL
                const refCode = Utils.getParam('ref');
                if (refCode) {
                    // Logic: Find referrer, give them +15, give me +15
                    console.log(`Referral Code Found: ${refCode}`);
                    
                    // Add bonus to new user
                    newProfile.credits += SYSTEM.economy.referralReward; // +15
                    UI.toast("Referral Bonus Applied: +15 Credits!", "gold");

                    // In a real app, use a Cloud Function to update the referrer safely.
                    // For this frontend-only demo, we log it.
                }

                await docRef.set(newProfile);
                Store.updateProfile(newProfile);
            }
        } catch (e) {
            console.error("DB Sync Error:", e);
            // Keep working with local state
        }
    },

    async saveProject(project) {
        // Update Local
        const currentProjects = [project, ...(Store.state.profile.projects || [])];
        Store.updateProfile({ projects: currentProjects });
        App.renderProjectsList();

        // Update Cloud
        if (Store.state.user && !Store.state.isOffline) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: currentProjects,
                    credits: Store.state.profile.credits
                });
            } catch(e) { console.error("Cloud save failed", e); }
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: NEURAL ENGINE (AI GENERATION)
   -------------------------------------------------------------------------- */
const AI = {
    // Home Input Trigger
    triggerFromHome() {
        const val = document.getElementById('hero-prompt').value;
        if (!val) return UI.toast("Please enter a prompt", "warning");
        
        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        if (Store.state.user) {
            Router.go('create');
            setTimeout(() => {
                const el = document.getElementById('ai-prompt-input');
                if(el) el.value = val;
            }, 500);
        } else {
            Auth.openModal();
        }
    },

    // Main Generate Logic
    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.toast("Prompt cannot be empty", "error");
        
        // 1. Credit Check
        if (Store.state.profile.credits < SYSTEM.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Credits. Please upgrade.", "error");
        }

        // 2. Loading State
        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="flex items-center gap-2"><i class="ri-loader-4-line animate-spin"></i> Neural Processing...</span>`;
        btn.disabled = true;

        try {
            await Utils.wait(2500); // Simulate network latency

            // 3. Deduct Credits
            Store.deductCredits(SYSTEM.economy.generationCost);

            // 4. Hybrid Template Selection (The "AI" Logic)
            let template = 'startup'; // Default
            if (prompt.includes('shop') || prompt.includes('store') || prompt.includes('fashion')) template = 'store';
            else if (prompt.includes('food') || prompt.includes('restaurant') || prompt.includes('cafe')) template = 'restaurant';
            else if (prompt.includes('portfolio') || prompt.includes('resume') || prompt.includes('design')) template = 'portfolio';
            else if (prompt.includes('agency') || prompt.includes('marketing')) template = 'agency';
            else if (prompt.includes('blog') || prompt.includes('news')) template = 'blog';

            const html = Templates[template](Store.state.profile.displayName);

            // 5. Create Project Object
            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 25) + (prompt.length > 25 ? '...' : ''),
                subdomain: `${Store.state.profile.displayName.toLowerCase().replace(/ /g,'')}-${Math.floor(Math.random()*9999)}`,
                html: html,
                engine: document.querySelector('input[name="ai_engine"]:checked').value,
                createdAt: new Date().toISOString()
            };

            // 6. Save & Launch
            await DB.saveProject(project);
            
            UI.toast("Website Built Successfully!", "success");
            input.value = "";
            
            Editor.open(project);

        } catch (e) {
            console.error(e);
            UI.toast("Generation Error. Credits Refunded.", "error");
            Store.addCredits(SYSTEM.economy.generationCost);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: TEMPLATE LIBRARY (The Embedded "Brain")
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (n) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="font-sans text-slate-900 bg-white"><nav class="p-6 flex justify-between items-center border-b"><div class="text-xl font-bold text-indigo-600">${n} Inc.</div><button class="bg-slate-900 text-white px-5 py-2 rounded-lg">Login</button></nav><header class="py-32 text-center px-4"><h1 class="text-6xl font-black mb-6">Ship Faster.</h1><p class="text-xl text-slate-500 mb-8">The ultimate platform for growth.</p><button class="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold">Get Started</button></header></body></html>`,
    
    portfolio: (n) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={darkMode:'class'}</script></head><body class="bg-black text-white font-sans"><nav class="p-8 flex justify-between"><div class="font-bold tracking-widest">${n}</div><a href="#" class="underline">Contact</a></nav><header class="py-32 px-8"><h1 class="text-9xl font-black mb-4">VISUAL<br><span class="text-green-500">ARTIST.</span></h1></header></body></html>`,
    
    store: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 font-serif"><nav class="p-6 border-b border-stone-200 flex justify-between"><div class="text-2xl font-bold italic">${n}</div><div>Cart (0)</div></nav><header class="py-24 text-center"><h1 class="text-7xl mb-6">Summer 2026</h1><button class="bg-black text-white px-8 py-3 uppercase tracking-widest text-sm">Shop Now</button></header></body></html>`,
    
    restaurant: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans"><nav class="p-6 flex justify-between"><div class="text-2xl font-bold text-orange-900">${n}</div><button class="bg-orange-600 text-white px-6 py-2 rounded-full">Book Table</button></nav><header class="py-32 text-center"><h1 class="text-6xl font-black text-orange-950 mb-4">Taste Real Food.</h1><p class="text-xl text-orange-800/70">Locally sourced ingredients.</p></header></body></html>`,
    
    agency: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-900 text-white font-sans"><nav class="p-6 border-b border-zinc-800"><div class="font-bold text-xl">${n} Agency</div></nav><header class="py-32 px-6"><h1 class="text-7xl font-bold mb-6">We Create<br><span class="text-blue-500">Digital Impact.</span></h1><div class="grid grid-cols-2 gap-4 mt-12"><div class="bg-zinc-800 h-64 rounded-xl"></div><div class="bg-zinc-800 h-64 rounded-xl"></div></div></header></body></html>`,
    
    blog: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white font-serif"><nav class="p-6 flex justify-center border-b"><div class="font-bold text-xl">${n}'s Journal</div></nav><main class="max-w-2xl mx-auto py-12 px-4"><article class="mb-12"><h2 class="text-3xl font-bold mb-4">The Future of AI</h2><p class="text-gray-600 leading-relaxed">Lorem ipsum dolor sit amet...</p><a href="#" class="text-blue-600 mt-4 block">Read more</a></article></main></body></html>`
};

/* --------------------------------------------------------------------------
   SECTION 11: EDITOR & HOSTING ENGINE
   -------------------------------------------------------------------------- */
const Editor = {
    modal: document.getElementById('editor-modal'),
    frame: document.getElementById('preview-frame'),
    current: null,

    open(project) {
        this.current = project;
        this.modal.classList.remove('hidden');
        document.getElementById('editor-subdomain').innerText = `https://${project.subdomain}.zulora.in`;
        
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            const doc = this.frame.contentWindow.document;
            doc.open();
            doc.write(project.html);
            doc.close();
            
            // Visual Edit Script
            const s = doc.createElement('script');
            s.innerHTML = `document.body.addEventListener('click',e=>{if(['H1','P','BUTTON','A'].includes(e.target.tagName)){e.preventDefault();e.target.contentEditable=true;e.target.focus();e.target.style.outline='2px dashed #4f46e5';e.target.onblur=()=>{e.target.style.outline='none';}}});`;
            doc.body.appendChild(s);
        });
    },

    close() {
        this.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.frame.src = 'about:blank';
        }, 300);
        App.renderProjectsList();
    },

    setDevice(mode) {
        const c = document.getElementById('editor-frame-container');
        if (mode === 'mobile') c.classList.add('mobile-view');
        else c.classList.remove('mobile-view');
    },

    save() {
        if (!this.current) return;
        const html = this.frame.contentWindow.document.documentElement.outerHTML;
        
        // Show Hosting Simulation
        UI.toast("Deploying to Zulora Cloud...", "info");
        
        setTimeout(() => {
            const projects = Store.state.profile.projects;
            const idx = projects.findIndex(p => p.id === this.current.id);
            if (idx > -1) {
                projects[idx].html = html;
                Store.updateProfile({ projects });
                DB.saveProject(this.current);
                UI.toast("Site is Live!", "success");
            }
        }, 1500);
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 12: APP RENDERERS
   -------------------------------------------------------------------------- */
const App = {
    init() {
        UI.boot();
        Auth.init();
        Store.subscribe(state => {
            // Optional: Log state changes in debug mode
            if(SYSTEM.debug) console.log("State Updated", state);
        });
    },

    renderProjectsList() {
        const list = document.getElementById('project-list');
        const dashList = document.getElementById('dash-project-list');
        const empty = document.getElementById('project-empty');
        const projects = Store.state.profile.projects || [];

        // Clear
        if(list) list.innerHTML = '';
        if(dashList) dashList.innerHTML = '';

        if (projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        const render = (p) => `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer group hover:border-brand-500/50 transition duration-300" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60 group-hover:opacity-100 transition grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 group-hover:opacity-40 transition"></div>
                    <div class="absolute bottom-3 left-3"><span class="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded backdrop-blur">LIVE</span></div>
                </div>
                <div class="p-4">
                    <h4 class="text-white font-bold truncate">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono">${p.subdomain}.zulora.in</p>
                </div>
            </div>`;

        if(list) list.innerHTML = projects.map(render).join('');
        if(dashList) dashList.innerHTML = projects.slice(0, 3).map(render).join('');
    }
};

// --- INITIALIZE SYSTEM ---
window.onload = App.init;
