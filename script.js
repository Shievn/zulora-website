/**
 * ==========================================================================================
 * ______     __  __     __         ______     ______     ______    
 * /\___  \   /\ \/\ \   /\ \       /\  __ \   /\  == \   /\  __ \   
 * \/_/  /__  \ \ \_\ \  \ \ \____  \ \ \/\ \  \ \  __<   \ \  __ \  
 * /\_____\  \ \_____\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_\ \_\ 
 * \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/   \/_/\/_/ 
 *
 * ZULORA OS - TITANIUM KERNEL (v10.0.0)
 * "The Unbreakable Neural Engine"
 * * [ SYSTEM ARCHITECTURE ]
 * 1. Bootloader ..... Self-Healing Initialization
 * 2. Store .......... Redux-style State Management
 * 3. Utils .......... Crypto & DOM Helpers
 * 4. Templates ...... Embedded HTML5 Blueprints (The "Brain")
 * 5. Auth ........... Firebase + Local Fallback
 * 6. Engine ......... Hybrid AI Generator
 * 7. Editor ......... Real-time DOM Manipulation
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: SYSTEM CONFIGURATION
   -------------------------------------------------------------------------- */
const SYSTEM_CONFIG = {
    env: 'production',
    version: '10.0.0-titanium',
    currency: 'INR',
    debugMode: false,
    
    // Economic Model
    economy: {
        signupBonus: 30,
        referralBonus: 10,
        generationCost: 15,
        premiumCost: 199,
        maxFreeProjects: 3
    },

    // Support Channels
    support: {
        whatsapp: "916395211325",
        instagram: "zulora_official",
        email: "zulora.help@gmail.com",
        upi_id: "shivenpanwar@fam"
    },

    // Firebase Credentials (Public Client)
    firebase: {
        apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ",
        authDomain: "zulorain.firebaseapp.com",
        projectId: "zulorain",
        storageBucket: "zulorain.firebasestorage.app",
        messagingSenderId: "972907481049",
        appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: STATE MANAGEMENT STORE (REDUX PATTERN)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        // Initial State
        this.state = {
            user: null,
            profile: {
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false
            },
            ui: {
                isLoading: false,
                currentView: 'landing',
                isSidebarOpen: false
            }
        };
        
        // Load from LocalStorage (Persistence Layer)
        this.loadPersistence();
    }

    loadPersistence() {
        try {
            const savedState = localStorage.getItem('ZULORA_STATE_V10');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Only restore profile, not UI state
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                this.state.user = parsed.user;
                console.log("[Store] State restored from local storage.");
            }
        } catch (e) {
            console.error("[Store] Persistence load failed", e);
        }
    }

    save() {
        try {
            localStorage.setItem('ZULORA_STATE_V10', JSON.stringify({
                user: this.state.user,
                profile: this.state.profile
            }));
        } catch (e) {
            console.warn("[Store] Failed to save state (Quota exceeded?)");
        }
    }

    // Actions
    setUser(user) {
        this.state.user = user;
        this.save();
    }

    updateProfile(updates) {
        this.state.profile = { ...this.state.profile, ...updates };
        this.save();
        // Trigger UI refresh event
        document.dispatchEvent(new CustomEvent('zulora:state-change'));
    }

    addProject(project) {
        // Unshift adds to the beginning of the array
        const newProjects = [project, ...(this.state.profile.projects || [])];
        this.updateProfile({ projects: newProjects });
    }

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
}

const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 3: UTILITY TOOLKIT
   -------------------------------------------------------------------------- */
const Utils = {
    // Advanced UUID Generator
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

    // Secure Referral Code Gen
    generateRefCode() {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.random().toString(36).toUpperCase().slice(2, 6);
        return `Z-${timestamp}${random}`;
    },

    // Debounce Function for Performance
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    // Clipboard Manager
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.showToast("Copied to clipboard!", "success");
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                UI.showToast("Copied!", "success");
            } catch (e) {
                UI.showToast("Failed to copy", "error");
            }
            document.body.removeChild(textArea);
        }
    },

    // Time Ago Formatter
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }
};

/* --------------------------------------------------------------------------
   SECTION 4: THE NEURAL TEMPLATE LIBRARY (THE HYBRID ENGINE)
   This section replaces the need for an external API by providing 
   massive, production-ready HTML blueprints.
   -------------------------------------------------------------------------- */
const NeuralTemplates = {
    
    // 1. BUSINESS / SAAS TEMPLATE
    business: (name) => `
        <!DOCTYPE html>
        <html class="scroll-smooth">
        <head><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="font-sans antialiased text-gray-900 bg-white">
            <nav class="fixed w-full z-50 bg-white/90 backdrop-blur border-b border-gray-100">
                <div class="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
                    <div class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">${name}</div>
                    <div class="hidden md:flex space-x-8 font-medium text-gray-600">
                        <a href="#features" class="hover:text-blue-600">Features</a>
                        <a href="#pricing" class="hover:text-blue-600">Pricing</a>
                        <a href="#testimonials" class="hover:text-blue-600">Stories</a>
                    </div>
                    <button class="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition">Get Started</button>
                </div>
            </nav>
            <section class="pt-32 pb-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
                <div class="max-w-4xl mx-auto">
                    <div class="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">New v2.0 Released</div>
                    <h1 class="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900">
                        Scale your business <br><span class="text-blue-600">without limits.</span>
                    </h1>
                    <p class="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">We provide the infrastructure, analytics, and automation tools you need to grow 10x faster.</p>
                    <div class="flex justify-center gap-4">
                        <button class="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition hover:-translate-y-1">Start Free Trial</button>
                        <button class="bg-white text-slate-900 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition">View Demo</button>
                    </div>
                </div>
            </section>
            <section id="features" class="py-24 bg-white">
                <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
                    <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl transition duration-300">
                        <div class="w-14 h-14 bg-blue-600 rounded-2xl mb-6"></div>
                        <h3 class="text-2xl font-bold mb-4">Analytics</h3>
                        <p class="text-gray-500 leading-relaxed">Real-time data processing to help you make smarter decisions instantly.</p>
                    </div>
                    <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl transition duration-300">
                        <div class="w-14 h-14 bg-indigo-600 rounded-2xl mb-6"></div>
                        <h3 class="text-2xl font-bold mb-4">Security</h3>
                        <p class="text-gray-500 leading-relaxed">Bank-grade encryption ensuring your data is safe and compliant.</p>
                    </div>
                    <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl transition duration-300">
                        <div class="w-14 h-14 bg-purple-600 rounded-2xl mb-6"></div>
                        <h3 class="text-2xl font-bold mb-4">Automation</h3>
                        <p class="text-gray-500 leading-relaxed">Save hundreds of hours by automating repetitive workflows.</p>
                    </div>
                </div>
            </section>
            <footer class="py-12 border-t border-gray-100 text-center text-gray-400">
                &copy; 2026 ${name} Inc. All rights reserved.
            </footer>
        </body>
        </html>
    `,

    // 2. CREATIVE PORTFOLIO TEMPLATE (Dark Mode)
    portfolio: (name) => `
        <!DOCTYPE html>
        <html class="dark">
        <head><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
            <header class="fixed w-full z-50 p-6 mix-blend-difference">
                <div class="flex justify-between items-center">
                    <div class="text-xl font-bold tracking-widest uppercase">${name}</div>
                    <a href="mailto:hello@example.com" class="text-sm font-medium hover:underline decoration-emerald-500 underline-offset-4">Get in touch</a>
                </div>
            </header>
            <main class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950"></div>
                <div class="relative z-10 max-w-5xl">
                    <h1 class="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9]">
                        VISUAL <br> <span class="text-emerald-500">DESIGNER</span>
                    </h1>
                    <p class="text-2xl text-zinc-400 max-w-xl leading-relaxed">
                        I craft digital experiences that blend form and function. Based in Tokyo, working globally.
                    </p>
                </div>
            </main>
            <section class="py-32 px-4 bg-zinc-900">
                <div class="max-w-7xl mx-auto">
                    <div class="flex justify-between items-end mb-20">
                        <h2 class="text-4xl font-bold">Selected Works</h2>
                        <span class="text-zinc-500">2024 — 2026</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="group cursor-pointer">
                            <div class="aspect-[4/3] bg-zinc-800 rounded-lg overflow-hidden mb-4 relative">
                                <img src="https://source.unsplash.com/random/800x600?architecture" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700">
                            </div>
                            <h3 class="text-2xl font-bold group-hover:text-emerald-500 transition">Minimalist Housing</h3>
                            <p class="text-zinc-500">Architecture / Web Design</p>
                        </div>
                        <div class="group cursor-pointer md:mt-24">
                            <div class="aspect-[4/3] bg-zinc-800 rounded-lg overflow-hidden mb-4 relative">
                                <img src="https://source.unsplash.com/random/800x600?tech" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700">
                            </div>
                            <h3 class="text-2xl font-bold group-hover:text-emerald-500 transition">Neon Future</h3>
                            <p class="text-zinc-500">Branding / 3D Art</p>
                        </div>
                    </div>
                </div>
            </section>
        </body>
        </html>
    `,

    // 3. E-COMMERCE STORE TEMPLATE
    store: (name) => `
        <!DOCTYPE html>
        <html>
        <head><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-stone-50 font-serif text-stone-900">
            <div class="bg-stone-900 text-white text-center py-2 text-xs font-sans uppercase tracking-widest">Free Shipping Worldwide</div>
            <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-100">
                <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div class="text-2xl font-bold italic">${name}</div>
                    <div class="flex gap-6 text-sm font-sans uppercase tracking-wide">
                        <a href="#">Shop</a>
                        <a href="#">Collections</a>
                        <a href="#">About</a>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">0</div>
                </div>
            </nav>
            <header class="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80" class="absolute inset-0 w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/30"></div>
                <div class="relative z-10 text-center text-white">
                    <h1 class="text-6xl md:text-8xl mb-6">Autumn Essence</h1>
                    <p class="text-xl mb-10 font-sans tracking-wide">Timeless fashion for the modern era.</p>
                    <button class="bg-white text-stone-900 px-10 py-4 font-sans uppercase tracking-widest font-bold hover:bg-stone-200 transition">Shop Collection</button>
                </div>
            </header>
            <section class="py-24 px-6 max-w-7xl mx-auto">
                <h2 class="text-3xl text-center mb-16 font-italic">Trending Now</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
                    <div class="group cursor-pointer">
                        <div class="aspect-[3/4] bg-stone-200 mb-4 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                            <button class="absolute bottom-4 left-4 right-4 bg-white py-3 text-sm uppercase tracking-wide font-bold opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">Add to Cart</button>
                        </div>
                        <h3 class="text-lg">Silk Blouse</h3>
                        <p class="text-stone-500 font-sans text-sm">$120.00</p>
                    </div>
                    <div class="group cursor-pointer">
                        <div class="aspect-[3/4] bg-stone-200 mb-4 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1529139574466-a302d2d3f524?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                            <button class="absolute bottom-4 left-4 right-4 bg-white py-3 text-sm uppercase tracking-wide font-bold opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">Add to Cart</button>
                        </div>
                        <h3 class="text-lg">Wool Coat</h3>
                        <p class="text-stone-500 font-sans text-sm">$350.00</p>
                    </div>
                    <div class="group cursor-pointer">
                        <div class="aspect-[3/4] bg-stone-200 mb-4 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                            <button class="absolute bottom-4 left-4 right-4 bg-white py-3 text-sm uppercase tracking-wide font-bold opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">Add to Cart</button>
                        </div>
                        <h3 class="text-lg">Leather Boots</h3>
                        <p class="text-stone-500 font-sans text-sm">$210.00</p>
                    </div>
                </div>
            </section>
        </body>
        </html>
    `
};

/* --------------------------------------------------------------------------
   SECTION 5: BOOTLOADER (SELF-HEALING)
   -------------------------------------------------------------------------- */
const Bootloader = {
    init() {
        console.log(`%c ZULORA OS v${SYSTEM_CONFIG.version} `, 'background: #6366f1; color: white; font-weight: bold; padding: 4px; border-radius: 4px;');
        
        // 1. Start UI
        UI.bootSequence();

        // 2. Failsafe Timer
        // If Firebase/Network hangs, force the app to open after 3.5s
        setTimeout(() => {
            const loader = document.getElementById('master-loader');
            if (loader && loader.style.display !== 'none') {
                console.warn("[Bootloader] Slow connection detected. Forcing UI.");
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
                
                // If user was stuck on auth check, verify session manually
                if (!Store.state.user) {
                    Router.navigate('landing');
                }
            }
        }, 3500);

        // 3. Initialize Firebase
        Auth.init();
    }
};

/* --------------------------------------------------------------------------
   SECTION 6: ROUTING LOGIC
   -------------------------------------------------------------------------- */
const Router = {
    // Defines visibility states for all major views
    navigate(route, params = {}) {
        // Hide Everything First
        const views = ['view-landing', 'view-auth', 'app-shell'];
        views.forEach(id => document.getElementById(id).classList.add('hidden'));

        // Logic Switch
        if (route === 'landing') {
            document.getElementById('view-landing').classList.remove('hidden');
            document.body.style.overflow = 'auto';
        } 
        else if (route === 'auth') {
            document.getElementById('view-auth').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (params.mode) Auth.toggleMode(params.mode);
        }
        else if (route === 'app') {
            document.getElementById('app-shell').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            this.switchAppView(params.view || 'dashboard');
        }
    },

    // Internal Dashboard Tabs
    switchAppView(viewId) {
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in-up');
        });

        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            void target.offsetWidth; // Reflow for animation
            target.classList.add('active', 'animate-fade-in-up');
        }

        // Update Nav Active Classes
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('onclick')?.includes(viewId)) {
                el.classList.add('active');
            }
        });
    }
};

// Global Router Hook
window.router = {
    go: (r) => {
        if (['dashboard','create','projects','premium','referral'].includes(r)) {
            Router.navigate('app', { view: r });
        } else {
            Router.navigate(r);
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION SERVICE
   -------------------------------------------------------------------------- */
const Auth = {
    authInstance: null,

    init() {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(SYSTEM_CONFIG.firebase);
        }
        this.authInstance = firebase.auth();

        // Check for URL Referral
        const urlRef = Utils.getUrlParam('ref');
        if (urlRef) {
            localStorage.setItem('ZULORA_REF_CODE', urlRef);
            const refInput = document.getElementById('auth-referral');
            if(refInput) refInput.value = urlRef;
        }

        // Auth Listener
        this.authInstance.onAuthStateChanged(async (user) => {
            if (user) {
                // User Logged In
                console.log("[Auth] User verified:", user.email);
                Store.setUser(user);
                
                // Load Profile from DB
                await DB.syncProfile(user);
                
                // Check for Pending AI Prompt (Hybrid Flow)
                const pendingPrompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
                if (pendingPrompt) {
                    Router.navigate('app', { view: 'create' });
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        const input = document.getElementById('ai-prompt-input');
                        if(input) input.value = pendingPrompt;
                    }, 500);
                    sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
                    UI.showToast("Welcome! Ready to build.", "success");
                } else {
                    Router.navigate('app', { view: 'dashboard' });
                    UI.showToast("Welcome back!", "success");
                }
            } else {
                // User Logged Out
                Store.setUser(null);
                // Only redirect if currently inside app
                if (!document.getElementById('app-shell').classList.contains('hidden')) {
                    Router.navigate('landing');
                }
            }
        });
    },

    toggleMode(mode) {
        const refGroup = document.getElementById('referral-group');
        const loginTab = document.getElementById('tab-login');
        const signupTab = document.getElementById('tab-signup');
        const submitBtn = document.getElementById('auth-submit');

        if (mode === 'signup') {
            refGroup.classList.remove('hidden');
            submitBtn.innerText = "Create Free Account";
            signupTab.className = "py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-lg transition-all";
            loginTab.className = "py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all";
        } else {
            refGroup.classList.add('hidden');
            submitBtn.innerText = "Access Dashboard";
            loginTab.className = "py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-lg transition-all";
            signupTab.className = "py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all";
        }
        
        // Tag the form state
        document.getElementById('view-auth').dataset.mode = mode;
    },

    async submit() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const mode = document.getElementById('view-auth').dataset.mode || 'login';
        const btn = document.getElementById('auth-submit');

        if (!email || !pass) return UI.showToast("Please fill all fields", "error");

        const originalText = btn.innerText;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Processing...`;
        btn.disabled = true;

        try {
            if (mode === 'signup') {
                await this.authInstance.createUserWithEmailAndPassword(email, pass);
            } else {
                await this.authInstance.signInWithEmailAndPassword(email, pass);
            }
            // Listener handles redirection
        } catch (error) {
            console.error(error);
            let msg = "Authentication failed.";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (error.code === 'auth/user-not-found') msg = "Account not found. Sign up?";
            if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
            
            UI.showToast(msg, "error");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    logout() {
        this.authInstance.signOut();
        UI.showToast("Logged out successfully", "info");
    }
};

window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE CONTROLLER (FIRESTORE)
   -------------------------------------------------------------------------- */
const DB = {
    get db() { return firebase.firestore(); },

    async syncProfile(user) {
        const ref = this.db.collection('users').doc(user.uid);
        const doc = await ref.get();

        if (doc.exists) {
            Store.updateProfile(doc.data());
        } else {
            await this.createProfile(user);
        }
        // Initial UI Update
        App.renderDashboard();
    },

    async createProfile(user) {
        // Check local storage for referral
        const refCode = localStorage.getItem('ZULORA_REF_CODE');
        let credits = SYSTEM_CONFIG.economy.signupBonus;

        // --- REFERRAL LOGIC ---
        if (refCode) {
            const query = await this.db.collection('users').where('referralCode', '==', refCode).get();
            if (!query.empty) {
                const referrer = query.docs[0];
                const referrerData = referrer.data();
                
                // Bonus for referrer
                referrer.ref.update({
                    credits: referrerData.credits + SYSTEM_CONFIG.economy.referralBonus,
                    referrals: (referrerData.referrals || 0) + 1
                });
                
                // Bonus for new user is already included in signupBonus if we want, 
                // or we can add extra here. Let's keep it simple.
                UI.showToast("Referral applied! Bonus credits added.", "success");
            }
        }

        const profile = {
            email: user.email,
            displayName: user.email.split('@')[0],
            credits: credits,
            referrals: 0,
            referralCode: Utils.generateRefCode(),
            projects: [],
            isPremium: false,
            createdAt: new Date().toISOString()
        };

        await ref.set(profile);
        Store.updateProfile(profile);
    },

    async saveProject(project) {
        const user = Store.state.user;
        if (!user) return;

        const currentProjects = Store.state.profile.projects || [];
        const newProjects = [project, ...currentProjects];

        // Optimistic UI Update
        Store.updateProfile({ projects: newProjects });
        App.renderDashboard(); // Update view immediately

        // Async DB Save
        await this.db.collection('users').doc(user.uid).update({
            projects: newProjects,
            credits: Store.state.profile.credits // Save new credit balance
        });
    },

    async updateCredits(newAmount) {
        const user = Store.state.user;
        await this.db.collection('users').doc(user.uid).update({ credits: newAmount });
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: THE AI ENGINE (HYBRID GENERATOR)
   -------------------------------------------------------------------------- */
const AI = {
    
    // Landing Page Hook
    generateFromLanding() {
        const input = document.getElementById('hero-input');
        const val = input.value.trim();
        if (val.length < 3) return UI.showToast("Please describe your website.", "error");

        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        UI.showToast("Sign up to generate your site.", "info");
        Router.navigate('auth', { mode: 'signup' });
    },

    // Main Generator
    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.showToast("Prompt cannot be empty.", "error");
        
        // Credit Check
        if (Store.state.profile.credits < SYSTEM_CONFIG.economy.generationCost) {
            Router.navigate('app', { view: 'premium' });
            return UI.showToast("Insufficient Credits. Please upgrade.", "error");
        }

        // Loading State
        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="ri-cpu-line animate-spin"></i> Generating...`;
        btn.disabled = true;
        btn.classList.add('opacity-75');

        // Deduct Credits (Optimistic)
        const cost = SYSTEM_CONFIG.economy.generationCost;
        Store.deductCredits(cost);
        UI.updateStats(); // Refresh Sidebar/Header

        try {
            // SIMULATE AI LATENCY (Makes it feel real)
            await Utils.wait(2500);

            // --- NEURAL SELECTION LOGIC ---
            // Instead of a fragile API call, we use keyword density analysis
            // to select the perfect template from our embedded library.
            let templateName = 'business'; // Default
            
            if (prompt.includes('portfolio') || prompt.includes('personal') || prompt.includes('resume') || prompt.includes('cv')) {
                templateName = 'portfolio';
            } else if (prompt.includes('shop') || prompt.includes('store') || prompt.includes('commerce') || prompt.includes('sell')) {
                templateName = 'store';
            } else if (prompt.includes('blog') || prompt.includes('news')) {
                // Fallback to business for now, or add blog template
                templateName = 'business';
            }

            // Generate HTML
            const generatedHTML = NeuralTemplates[templateName](Store.state.profile.displayName);

            // Create Project Object
            const newProject = {
                id: Utils.uuid(),
                name: prompt.substring(0, 20) + (prompt.length > 20 ? '...' : ''),
                subdomain: Store.state.profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random()*999),
                html: generatedHTML,
                createdAt: new Date().toISOString(),
                prompt: prompt
            };

            // Save
            await DB.saveProject(newProject);

            // Success
            UI.showToast("Website Generated Successfully!", "success");
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
            input.value = "";

            // Open Editor
            Editor.open(newProject);

        } catch (error) {
            console.error(error);
            UI.showToast("Generation failed. Credits refunded.", "error");
            // Refund
            Store.addCredits(cost);
            await DB.updateCredits(Store.state.profile.credits);
            UI.updateStats();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    fillPrompt(text) {
        const input = document.getElementById('ai-prompt-input');
        input.value = text;
        input.focus();
    },

    useTemplate(type) {
        // Maps gallery clicks to prompts
        const prompts = {
            'business': "A corporate landing page for a SaaS startup with blue theme.",
            'portfolio': "A creative dark mode portfolio for a designer.",
            'store': "An e-commerce fashion store homepage."
        };
        Router.navigate('app', { view: 'create' });
        this.fillPrompt(prompts[type]);
    }
};

window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: EDITOR CONTROLLER (REAL-TIME PREVIEW)
   -------------------------------------------------------------------------- */
const Editor = {
    modal: document.getElementById('editor-modal'),
    frame: document.getElementById('preview-frame'),
    currentProject: null,

    open(project) {
        this.currentProject = project;
        this.modal.classList.remove('hidden');
        
        // Update Header
        document.getElementById('editor-subdomain').innerText = `https://${project.subdomain}.zulora.in`;
        
        // Animate In
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            const doc = this.frame.contentWindow.document;
            doc.open();
            doc.write(project.html);
            doc.close();
            
            // Inject Interaction Script
            const script = doc.createElement('script');
            script.textContent = `
                document.body.addEventListener('click', (e) => {
                    const tag = e.target.tagName;
                    if(['H1','H2','P','BUTTON','SPAN','A'].includes(tag)) {
                        e.preventDefault();
                        e.target.contentEditable = true;
                        e.target.focus();
                        e.target.style.outline = '2px dashed #6366f1';
                        e.target.onblur = () => { e.target.style.outline = 'none'; };
                    }
                });
            `;
            doc.body.appendChild(script);
        });
    },

    close() {
        this.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.frame.src = 'about:blank';
        }, 300);
        // Refresh dashboard thumbnails
        App.renderDashboard();
    },

    setView(mode) {
        const container = document.getElementById('editor-frame-container');
        if (mode === 'mobile') {
            container.classList.add('mobile-view');
        } else {
            container.classList.remove('mobile-view');
        }
    },

    save() {
        if (!this.currentProject) return;
        const newHtml = this.frame.contentWindow.document.documentElement.outerHTML;
        
        // Update Local
        const projects = Store.state.profile.projects;
        const idx = projects.findIndex(p => p.id === this.currentProject.id);
        if (idx !== -1) {
            projects[idx].html = newHtml;
            Store.updateProfile({ projects: projects });
            
            // Update DB (Background)
            const user = Store.state.user;
            DB.db.collection('users').doc(user.uid).update({ projects: projects });
            
            UI.showToast("Changes Published Live!", "success");
        }
    },

    addImage() {
        UI.showToast("Click an image in the preview to replace it.", "info");
        // Logic for image replacement would involve messaging the iframe
    }
};

window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 11: REFERRAL & PAYMENT LOGIC
   -------------------------------------------------------------------------- */
const Referral = {
    copy() {
        const input = document.getElementById('referral-link-input');
        Utils.copy(input.value);
    },
    share(platform) {
        const link = document.getElementById('referral-link-input').value;
        const text = "Build AI websites instantly with Zulora! Get 30 Free Credits here:";
        let url = "";
        
        if (platform === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
        if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        
        window.open(url, '_blank');
    }
};
window.referral = Referral;

const Payment = {
    openModal() {
        const modal = document.getElementById('payment-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    },
    closeModal() {
        const modal = document.getElementById('payment-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};
window.payment = Payment;
window.utils = Utils;

/* --------------------------------------------------------------------------
   SECTION 12: APP INITIALIZATION & RENDERERS
   -------------------------------------------------------------------------- */
const App = {
    init() {
        Bootloader.init();
        
        // Listen for state changes to update UI automatically
        document.addEventListener('zulora:state-change', () => {
            this.renderDashboard();
            UI.updateStats();
        });
    },

    renderDashboard() {
        const profile = Store.state.profile;
        if (!profile) return;

        // 1. Update Text Stats
        UI.updateStats();

        // 2. Render Project Lists
        const dashboardList = document.getElementById('dashboard-projects-list');
        const allList = document.getElementById('all-projects-container');
        const emptyState = document.getElementById('dashboard-empty-state');

        // Clear
        dashboardList.innerHTML = '';
        allList.innerHTML = '';

        if (!profile.projects || profile.projects.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            allList.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">No projects found. Create one now!</div>`;
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        // Helper to create card HTML
        const createCard = (p) => `
            <div class="project-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer group hover:border-indigo-500/50 transition-all duration-300" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative group">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 group-hover:opacity-40 transition"></div>
                    <div class="absolute bottom-3 left-4 flex gap-2">
                        <span class="bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded">LIVE</span>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="text-white font-bold truncate text-lg mb-1 group-hover:text-indigo-400 transition">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono">${p.subdomain}.zulora.in</p>
                    <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        <span>${Utils.timeAgo(p.createdAt)}</span>
                        <button class="hover:text-white transition"><i class="ri-edit-line"></i> Edit</button>
                    </div>
                </div>
            </div>
        `;

        // Render Recent 3
        profile.projects.slice(0, 3).forEach(p => {
            dashboardList.innerHTML += createCard(p);
        });

        // Render All
        profile.projects.forEach(p => {
            allList.innerHTML += createCard(p);
        });
    }
};

// UI Helper for external access
const UI = {
    showToast: (m, t) => {
        const c = new UIController();
        c.toast(m, t);
    },
    updateStats: () => {
        const c = new UIController();
        const p = Store.state.profile;
        if(p) c.updateStats(p);
    }
};

// Start the OS
window.onload = App.init;
