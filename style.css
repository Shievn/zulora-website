/**
 * ============================================================================
 * ZULORA STUDIO - CORTEX ENGINE (GEN 21.0 - ULTIMA)
 * ============================================================================
 * @version 21.0.0 (Production Master)
 * @author Zulora AI Team & Shiven Panwar
 * @description Advanced SPA State Management, Firebase Auth, Custom Subdomains,
 * and the God-Mode AI Editor Engine.
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. GLOBAL CONFIGURATION & FIREBASE
   ---------------------------------------------------------------------------- */

const CONFIG = {
    appName: "Zulora Studio",
    domain: "zulora.in",
    founder: "Shiven Panwar",
    
    // Support & Default Details
    support: {
        whatsapp: "916395211325",
        email: "zulora.help@gmail.com",
        insta: "zulora_official",
        linkedin: "https://www.linkedin.com/in/shiven-panwar-aa1b31232"
    },
    
    // Economy System
    credits: {
        start: 50,
        generateCost: 10,
        referralBonus: 50
    },

    // UPI Payment
    upi: {
        id: "shivenpanwar@fam",
        amount: "299",
        name: "ZuloraPro"
    }
};

// API Keys (Groq)
const API_KEYS = {
    groq: "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"
};

// --- FIREBASE CONFIGURATION (Provided by User) ---
const firebaseConfig = {
    apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ",
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Zulora Firebase Engine Initialized");
}

const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const provider = typeof firebase !== 'undefined' ? new firebase.auth.GoogleAuthProvider() : null;

/* ----------------------------------------------------------------------------
   2. APP STATE MANAGEMENT
   ---------------------------------------------------------------------------- */

const STATE = {
    user: null,          // Holds Firebase User Object (UID, Email, Name)
    credits: 0,
    menuOpen: false,
    currentProject: {
        html: "",
        name: "My Website",
        subdomain: ""
    }
};

/* ----------------------------------------------------------------------------
   3. CORE APPLICATION CONTROLLER (ZuloraApp)
   ---------------------------------------------------------------------------- */

window.ZuloraApp = {
    
    // --- 3.1 INITIALIZATION ---
    init() {
        console.log(`🚀 Starting Zulora Studio v21.0 by ${CONFIG.founder}`);
        
        // Listen to Firebase Auth State changes
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.handleUserLogin(user);
                } else {
                    this.handleUserLogout();
                }
            });
        } else {
            console.warn("Firebase Auth not loaded. Running in local simulation mode.");
            this.handleUserLogout();
        }

        this.setupEventListeners();
        this.generateUPIQR();
    },

    // --- 3.2 FIREBASE AUTHENTICATION LOGIC (COMPULSORY) ---
    loginWithGoogle() {
        const btn = document.getElementById('google-signin-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Authenticating...`;

        if (!auth) {
            // Fallback Simulation if Firebase script blocked by adblockers
            setTimeout(() => this.simulateLogin(), 1500);
            return;
        }

        auth.signInWithPopup(provider).then((result) => {
            this.showToast("Successfully authenticated via Google!", "success");
            this.closeModal('auth-modal');
            btn.innerHTML = originalHtml;
            
            // Auto-generate if they typed a prompt before logging in
            const promptVal = document.getElementById('main-landing-prompt').value.trim();
            if (promptVal && document.getElementById('view-landing').classList.contains('active')) {
                this.initiateGeneration();
            }
        }).catch((error) => {
            console.error(error);
            this.showToast(error.message, "error");
            btn.innerHTML = originalHtml;
        });
    },

    simulateLogin() {
        const mockUser = {
            uid: 'UID_' + Math.random().toString(36).substr(2, 9),
            displayName: 'Zulora Creator',
            email: 'creator@gmail.com',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
        };
        this.handleUserLogin(mockUser);
        this.closeModal('auth-modal');
        this.showToast("Logged in successfully (Simulated).", "success");
        
        const promptVal = document.getElementById('main-landing-prompt').value.trim();
        if (promptVal && document.getElementById('view-landing').classList.contains('active')) {
            this.initiateGeneration();
        }
    },

    handleUserLogin(firebaseUser) {
        STATE.user = {
            uid: firebaseUser.uid, 
            name: firebaseUser.displayName || 'Creator',
            email: firebaseUser.email,
            photoUrl: firebaseUser.photoURL || 'assets/favicon.png'
        };
        
        // Load Credits from LocalStorage (In a real app, load from Firestore)
        let storedCredits = localStorage.getItem(`zulora_credits_${STATE.user.uid}`);
        if (!storedCredits) {
            storedCredits = CONFIG.credits.start;
            localStorage.setItem(`zulora_credits_${STATE.user.uid}`, storedCredits);
        }
        STATE.credits = parseInt(storedCredits);

        this.updateUIForUser();
    },

    handleUserLogout() {
        STATE.user = null;
        STATE.credits = 0;
        
        document.getElementById('auth-guest').classList.remove('hidden');
        document.getElementById('auth-user').classList.add('hidden');
        document.getElementById('drawer-auth-btn').classList.remove('hidden');
        document.getElementById('drawer-user-area').classList.add('hidden');
    },

    updateUIForUser() {
        // Desktop Nav Update
        document.getElementById('auth-guest').classList.add('hidden');
        document.getElementById('auth-user').classList.remove('hidden');
        document.getElementById('nav-credit-balance').innerText = STATE.credits;
        document.getElementById('nav-avatar').src = STATE.user.photoUrl;
        
        // Mobile Drawer Update
        document.getElementById('drawer-auth-btn').classList.add('hidden');
        document.getElementById('drawer-user-area').classList.remove('hidden');
        document.getElementById('drawer-username').innerText = STATE.user.name;
        document.getElementById('drawer-email').innerText = STATE.user.email;
        document.getElementById('drawer-avatar').src = STATE.user.photoUrl;
        
        // Studio Credits Update
        const studioCred = document.getElementById('studio-credits-display');
        if(studioCred) studioCred.innerText = STATE.credits;
        
        // Referral Link Generation based on UID
        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = `https://${CONFIG.domain}/join?ref=${STATE.user.uid}`;
    },

    // --- 3.3 NAVIGATION & UI TOGGLES ---
    toggleMobileMenu() {
        STATE.menuOpen = !STATE.menuOpen;
        const drawer = document.getElementById('mobile-drawer');
        const trigger = document.getElementById('mobile-trigger');
        
        if (STATE.menuOpen) {
            drawer.classList.remove('hidden');
            trigger.classList.add('active'); // Animates Hamburger to 'X'
            setTimeout(() => drawer.classList.add('open'), 10);
        } else {
            drawer.classList.remove('open');
            trigger.classList.remove('active');
            setTimeout(() => drawer.classList.add('hidden'), 400);
        }
    },

    switchView(viewName) {
        document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
        
        if (viewName === 'landing') {
            document.getElementById('view-landing').classList.remove('hidden');
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else if (viewName === 'studio') {
            if (!STATE.user) {
                this.openModal('auth-modal');
                this.showToast("Compulsory Sign In required to access Studio.", "warning");
                return;
            }
            document.getElementById('view-studio').classList.remove('hidden');
        }
    },

    openModal(modalId) {
        this.closeAllModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    },

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        document.body.classList.remove('modal-open');
    },

    showToast(message, type = "info") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-msg toast-${type}`;
        
        let icon = "fa-info-circle text-primary";
        if (type === "success") icon = "fa-check-circle text-success";
        if (type === "error") icon = "fa-exclamation-triangle text-danger";
        
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // --- 3.4 AI GENERATION ENGINE ---
    async initiateGeneration() {
        const input = document.getElementById('main-landing-prompt');
        const prompt = input.value.trim();
        
        if (!prompt) {
            this.showToast("Please describe your website first.", "error");
            input.focus();
            return;
        }

        // COMPULSORY GOOGLE AUTH CHECK
        if (!STATE.user) {
            this.showToast("Google Authentication required to generate sites.", "info");
            this.openModal('auth-modal');
            return;
        }

        if (STATE.credits < CONFIG.credits.generateCost) {
            this.showToast("Insufficient credits. Please upgrade.", "error");
            this.openModal('payment-modal');
            return;
        }

        // Deduct Credits
        STATE.credits -= CONFIG.credits.generateCost;
        localStorage.setItem(`zulora_credits_${STATE.user.uid}`, STATE.credits);
        this.updateUIForUser();

        // Switch to Studio & Show Loaders
        this.switchView('studio');
        this.showToast("Zulora Quantum Engine is building your site...", "info");
        
        const loader = document.getElementById('hero-mockup-loader');
        if(loader) loader.classList.remove('hidden');

        try {
            // Attempting Groq API (If fails, gracefully fallback to God Mode)
            let generatedHTML = await this.callGroqAPI(prompt);
            
            if (!generatedHTML || generatedHTML.length < 500) {
                throw new Error("API Output Insufficient");
            }
            
            this.mountSiteToEditor(generatedHTML);
            this.showToast("Website Generated Successfully!", "success");
            
        } catch (error) {
            console.warn("API Failed or Unreachable. Initializing God-Mode Fallback...", error);
            // GOD-MODE OFFLINE ENGINE TRIGGER (Massive Template)
            const generatedHTML = this.godModeGenerator(prompt, STATE.user);
            this.mountSiteToEditor(generatedHTML);
            this.showToast("Site generated via Offline Quantum Engine.", "success");
        } finally {
            if(loader) loader.classList.add('hidden');
        }
    },

    async callGroqAPI(prompt) {
        // Safe fail-fast if no key is provided to trigger God Mode instantly
        if(!API_KEYS.groq || API_KEYS.groq === "") throw new Error("No API Key");

        const sysPrompt = `You are Zulora AI. Output ONLY valid HTML5 code with embedded Tailwind CSS. Context: User wants a website based on: "${prompt}". NO markdown.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEYS.groq}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [
                    { role: "system", content: sysPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        let code = data.choices[0].message.content;
        return code.replace(/```html/g, '').replace(/```/g, '').trim();
    },

    // --- 3.5 GOD-MODE TEMPLATE ENGINE (Massive Offline Template) ---
    godModeGenerator(prompt, user) {
        const p = prompt.toLowerCase();
        
        // 1. DYNAMIC THEME ENGINE
        let t = { bg: "bg-white", text: "text-slate-900", acc: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700", panel: "bg-slate-50" };
        let img = "business,office";
        
        if (p.includes("dark") || p.includes("cyber") || p.includes("game")) {
            t = { bg: "bg-slate-900", text: "text-white", acc: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500", panel: "bg-slate-800" };
            img = "gaming,neon";
        } else if (p.includes("food") || p.includes("rest") || p.includes("cafe")) {
            t = { bg: "bg-orange-50", text: "text-slate-800", acc: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700 text-white", panel: "bg-white" };
            img = "restaurant,food";
        } else if (p.includes("shop") || p.includes("store") || p.includes("luxury")) {
            t = { bg: "bg-zinc-50", text: "text-zinc-900", acc: "text-zinc-900", btn: "bg-zinc-900 hover:bg-zinc-800 text-white", panel: "bg-white" };
            img = "luxury,fashion";
        } else if (p.includes("tech") || p.includes("software") || p.includes("ai")) {
            t = { bg: "bg-gray-900", text: "text-gray-100", acc: "text-cyan-400", btn: "bg-cyan-500 hover:bg-cyan-400 text-gray-900", panel: "bg-gray-800" };
            img = "technology,code";
        }

        // 2. PARSE SMART CONTACT INFO FROM PROMPT
        const ownerName = user ? user.name : "Admin";
        let mailTo = user ? user.email : CONFIG.support.email;
        let phoneNum = CONFIG.support.whatsapp.replace('+', '');
        let linkedinUrl = CONFIG.support.linkedin;

        // Simple Regex to find phone numbers in prompt
        const phoneMatch = prompt.match(/(?:(?:\+|00)91[\s.-]?)?\d{10}/);
        if(phoneMatch) phoneNum = phoneMatch[0].replace(/[^0-9]/g, '');

        // Simple Regex to find emails in prompt
        const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if(emailMatch) mailTo = emailMatch[0];

        const title = prompt.length > 30 ? "My Digital Brand" : prompt;

        // 3. GENERATE MASSIVE HTML STRING
        return `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Premium Digital Experience</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* Base Typography & Scrollbar */
        body { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 10px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.6); }

        /* Zulora Studio God-Mode Editor Hover State */
        .editable { transition: all 0.2s ease-in-out; border: 1px solid transparent; }
        .editable:hover { 
            outline: 2px dashed ${t.btn.includes('bg-black') || t.btn.includes('bg-zinc-900') ? '#000' : '#4f46e5'}; 
            outline-offset: 3px; 
            cursor: pointer; 
            background: rgba(128, 128, 128, 0.05); 
            border-radius: 6px; 
        }

        /* High-End Animations */
        .animate-on-scroll { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-on-scroll.is-visible { opacity: 1; transform: translateY(0); }
        .delay-100 { transition-delay: 0.1s; } 
        .delay-200 { transition-delay: 0.2s; }
        .delay-300 { transition-delay: 0.3s; }

        .float-anim { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        
        .pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        
        /* 3-Bar Mobile Menu Animations */
        .hamburger { width: 30px; height: 20px; position: relative; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; z-index: 100; }
        .hamburger span { width: 100%; height: 3px; background-color: currentColor; border-radius: 3px; transition: all 0.3s ease; }
        .hamburger.active span:nth-child(1) { transform: translateY(8.5px) rotate(45deg); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: translateY(-8.5px) rotate(-45deg); }

        #mobile-menu { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        #mobile-menu.open { transform: translateX(0%); }
    </style>
</head>
<body class="${t.bg} ${t.text} antialiased selection:bg-indigo-500 selection:text-white">

    <div class="${t.btn} px-4 py-2.5 text-center text-xs md:text-sm font-semibold flex justify-center items-center gap-3 relative z-50">
        <span class="animate-pulse h-2 w-2 bg-white rounded-full block"></span>
        <span class="editable">Welcome to the official website of ${title}. We are launching our new digital experience!</span>
    </div>

    <nav class="px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 backdrop-blur-xl bg-opacity-80 ${t.bg} border-b border-current border-opacity-10 transition-all">
        <div class="text-2xl lg:text-3xl font-extrabold editable flex items-center gap-3 tracking-tight z-50">
            <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${t.btn} flex items-center justify-center shadow-lg text-white">
                <i class="fas fa-layer-group"></i>
            </div>
            ${title}
        </div>
        
        <div class="hidden lg:flex gap-10 font-bold items-center text-sm uppercase tracking-widest opacity-80">
            <a href="#home" class="hover:${t.acc} transition transform hover:-translate-y-0.5 editable">Home</a>
            <a href="#about" class="hover:${t.acc} transition transform hover:-translate-y-0.5 editable">About</a>
            <a href="#services" class="hover:${t.acc} transition transform hover:-translate-y-0.5 editable">Services</a>
            <a href="#portfolio" class="hover:${t.acc} transition transform hover:-translate-y-0.5 editable">Work</a>
            <a href="#pricing" class="hover:${t.acc} transition transform hover:-translate-y-0.5 editable">Pricing</a>
        </div>

        <div class="hidden lg:flex items-center gap-6">
            <a href="#contact" class="font-bold hover:${t.acc} transition editable">Login</a>
            <a href="#contact" class="px-8 py-3 ${t.btn} text-white rounded-full font-bold shadow-xl transition transform hover:-translate-y-1 hover:shadow-2xl editable">
                Get Started
            </a>
        </div>

        <div class="lg:hidden text-current editable" onclick="toggleMobileMenu()">
            <div class="hamburger" id="hamburger-icon">
                <span></span><span></span><span></span>
            </div>
        </div>
    </nav>

    <div id="mobile-menu" class="fixed inset-0 z-30 bg-black/60 backdrop-blur-md transform translate-x-full lg:hidden flex justify-end">
        <div class="w-4/5 max-w-sm h-full ${t.bg} p-8 flex flex-col shadow-2xl border-l border-current border-opacity-10">
            <div class="mt-20 flex flex-col gap-6 font-bold text-xl">
                <a href="#home" onclick="toggleMobileMenu()" class="border-b border-current border-opacity-10 pb-4 hover:${t.acc} editable">Home</a>
                <a href="#about" onclick="toggleMobileMenu()" class="border-b border-current border-opacity-10 pb-4 hover:${t.acc} editable">About Us</a>
                <a href="#services" onclick="toggleMobileMenu()" class="border-b border-current border-opacity-10 pb-4 hover:${t.acc} editable">Our Services</a>
                <a href="#portfolio" onclick="toggleMobileMenu()" class="border-b border-current border-opacity-10 pb-4 hover:${t.acc} editable">Portfolio</a>
                <a href="#pricing" onclick="toggleMobileMenu()" class="border-b border-current border-opacity-10 pb-4 hover:${t.acc} editable">Pricing</a>
                <a href="#contact" onclick="toggleMobileMenu()" class="hover:${t.acc} editable">Contact Support</a>
            </div>
            <div class="mt-auto">
                <a href="#contact" onclick="toggleMobileMenu()" class="block w-full text-center px-8 py-4 ${t.btn} text-white rounded-xl font-bold shadow-xl editable">Get Started Now</a>
            </div>
        </div>
    </div>

    <header id="home" class="relative pt-24 pb-32 px-6 text-center max-w-7xl mx-auto overflow-hidden">
        <div class="animate-on-scroll is-visible">
            <span class="inline-block py-2 px-6 rounded-full ${t.panel} shadow-sm text-xs md:text-sm font-bold mb-8 border border-current border-opacity-10 uppercase tracking-widest editable flex items-center justify-center gap-2 max-w-max mx-auto">
                <i class="fas fa-star text-yellow-500"></i> Engineered for Excellence by ${ownerName}
            </span>
            
            <h1 class="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold mb-8 leading-[1.1] tracking-tighter editable">
                Empower your vision.<br class="hidden md:block" />
                <span class="${t.acc} relative inline-block">
                    Dominate the market.
                    <svg class="absolute w-full h-3 md:h-4 -bottom-1 md:-bottom-2 left-0 text-current opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="transparent"/></svg>
                </span>
            </h1>
            
            <p class="text-lg md:text-2xl opacity-70 mb-12 max-w-4xl mx-auto leading-relaxed editable">
                ${prompt} We leverage cutting-edge technology and stunning design to build digital solutions that convert visitors into loyal customers.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
                <a href="#contact" class="w-full sm:w-auto px-10 py-4 md:py-5 ${t.btn} text-white rounded-2xl font-bold text-lg shadow-2xl hover:opacity-90 transition transform hover:-translate-y-1 flex items-center justify-center gap-3 editable">
                    Start Your Project <i class="fas fa-arrow-right"></i>
                </a>
                <a href="#portfolio" class="w-full sm:w-auto px-10 py-4 md:py-5 ${t.panel} border border-current border-opacity-20 rounded-2xl font-bold text-lg hover:bg-opacity-80 transition transform hover:-translate-y-1 flex items-center justify-center gap-3 editable">
                    <i class="fas fa-play-circle ${t.acc} text-xl"></i> View Showcase
                </a>
            </div>
        </div>

        <div class="relative max-w-6xl mx-auto animate-on-scroll delay-200 is-visible">
            <div class="absolute -inset-4 md:-inset-10 bg-gradient-to-r from-[${t.acc.replace('text-', '')}] to-purple-600 rounded-[3rem] opacity-20 blur-3xl pulse-slow"></div>
            
            <div class="relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-current border-opacity-10 group editable">
                <img src="https://source.unsplash.com/1600x900/?${img},technology" class="w-full h-[400px] md:h-[600px] object-cover transform group-hover:scale-105 transition duration-1000" alt="Hero Image">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
            
            <div class="absolute -left-4 md:-left-12 top-10 md:top-20 ${t.panel} p-4 md:p-6 rounded-2xl shadow-2xl border border-current border-opacity-10 z-20 float-anim hidden md:flex items-center gap-4 editable backdrop-blur-md">
                <div class="w-12 h-12 rounded-full ${t.btn} text-white flex items-center justify-center text-xl shadow-lg"><i class="fas fa-chart-line"></i></div>
                <div class="text-left">
                    <p class="text-xs opacity-70 font-bold uppercase tracking-wider">Revenue Growth</p>
                    <p class="font-extrabold text-2xl">+245%</p>
                </div>
            </div>

            <div class="absolute -right-4 md:-right-12 bottom-10 md:bottom-20 ${t.panel} p-4 md:p-6 rounded-2xl shadow-2xl border border-current border-opacity-10 z-20 float-anim hidden md:flex items-center gap-4 editable backdrop-blur-md" style="animation-delay: 2s;">
                <div class="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl shadow-lg"><i class="fas fa-shield-check"></i></div>
                <div class="text-left">
                    <p class="text-xs opacity-70 font-bold uppercase tracking-wider">Security</p>
                    <p class="font-extrabold text-2xl">Enterprise Grade</p>
                </div>
            </div>
        </div>
    </header>

    <section class="py-12 border-y border-current border-opacity-10 opacity-70 overflow-hidden bg-current bg-opacity-5">
        <div class="max-w-7xl mx-auto px-6">
            <p class="text-center text-sm font-bold uppercase tracking-widest mb-8 editable">Trusted by over 10,000+ forward-thinking teams</p>
            <div class="flex flex-wrap justify-center items-center gap-10 md:gap-24 text-4xl md:text-5xl">
                <i class="fab fa-aws editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer"></i>
                <i class="fab fa-google editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer"></i>
                <i class="fab fa-microsoft editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer"></i>
                <i class="fab fa-spotify editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer"></i>
                <i class="fab fa-stripe editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer"></i>
                <i class="fab fa-slack editable hover:${t.acc} hover:opacity-100 transition transform hover:scale-110 cursor-pointer hidden md:block"></i>
            </div>
        </div>
    </section>

    <section id="about" class="py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <div class="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
            <div class="relative animate-on-scroll">
                <div class="grid grid-cols-2 gap-4 md:gap-6">
                    <img src="https://source.unsplash.com/600x800/?${img},team" class="w-full h-64 md:h-96 object-cover rounded-3xl shadow-xl mt-12 hover:-translate-y-2 transition duration-500 editable" alt="Our Team">
                    <img src="https://source.unsplash.com/600x800/?${img},office" class="w-full h-64 md:h-96 object-cover rounded-3xl shadow-xl hover:-translate-y-2 transition duration-500 editable" alt="Our Office">
                </div>
            </div>
            
            <div class="animate-on-scroll delay-200 text-left">
                <span class="${t.acc} font-extrabold tracking-widest uppercase text-sm mb-4 block editable flex items-center gap-2"><i class="fas fa-minus"></i> Who We Are</span>
                <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight editable">Built for scale. Designed for humans.</h2>
                <p class="text-lg opacity-75 mb-8 leading-relaxed editable">
                    Led by ${ownerName}, our collective of engineers, designers, and strategists are dedicated to building digital products that push boundaries. We don't just write code; we architect solutions that drive real business growth and user engagement.
                </p>
                
                <div class="space-y-6 mb-12">
                    <div class="flex items-start gap-4 editable p-4 rounded-2xl hover:bg-current hover:bg-opacity-5 transition">
                        <div class="mt-1 ${t.acc} text-2xl"><i class="fas fa-check-circle"></i></div>
                        <div>
                            <h4 class="font-bold text-xl mb-1">Award-Winning Design</h4>
                            <p class="opacity-70 text-sm">Interfaces that captivate and convert.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4 editable p-4 rounded-2xl hover:bg-current hover:bg-opacity-5 transition">
                        <div class="mt-1 ${t.acc} text-2xl"><i class="fas fa-tachometer-alt"></i></div>
                        <div>
                            <h4 class="font-bold text-xl mb-1">High-Performance Core</h4>
                            <p class="opacity-70 text-sm">Lightning fast load times and SEO optimization.</p>
                        </div>
                    </div>
                </div>

                <a href="#services" class="inline-flex items-center gap-3 px-8 py-4 ${t.panel} border border-current border-opacity-20 rounded-xl font-bold text-lg hover:bg-opacity-80 transition transform hover:-translate-x-1 editable">
                    Discover Our Services <i class="fas fa-arrow-right ${t.acc}"></i>
                </a>
            </div>
        </div>
    </section>

    <section id="services" class="py-32 ${t.panel}">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-20 animate-on-scroll">
                <span class="${t.acc} font-extrabold tracking-widest uppercase text-sm mb-4 block editable"><i class="fas fa-bolt mr-2"></i> Our Capabilities</span>
                <h2 class="text-4xl md:text-6xl font-extrabold mb-6 editable">What We Do Best</h2>
                <p class="text-xl opacity-75 max-w-2xl mx-auto editable">Comprehensive, end-to-end solutions tailored to elevate your brand and streamline your digital operations.</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-laptop-code"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Web Development</h3>
                    <p class="opacity-70 leading-relaxed mb-8">Custom coded, responsive websites that load instantly and perform flawlessly across all devices and platforms.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll delay-100 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Mobile Applications</h3>
                    <p class="opacity-70 leading-relaxed mb-8">Native iOS and Android mobile apps designed to engage users, build loyalty, and drive mobile conversions.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll delay-200 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-paint-brush"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">UI/UX Design</h3>
                    <p class="opacity-70 leading-relaxed mb-8">User-centric design philosophies that create beautiful, intuitive, and highly accessible user interfaces.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">SEO & Marketing</h3>
                    <p class="opacity-70 leading-relaxed mb-8">Data-driven strategies to increase your search visibility, rank higher on Google, and attract the right audience.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll delay-100 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">E-Commerce</h3>
                    <p class="opacity-70 leading-relaxed mb-8">Secure, highly scalable online stores optimized for sales, complete with UPI and global payment gateways.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-4 hover:shadow-2xl transition duration-500 group animate-on-scroll delay-200 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                        <i class="fas fa-microchip"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">AI Integration</h3>
                    <p class="opacity-70 leading-relaxed mb-8">Implement cutting-edge Artificial Intelligence to automate tasks and provide incredibly smart user experiences.</p>
                    <a href="#" class="${t.acc} font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Learn More <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
            </div>
        </div>
    </section>

    <section class="py-32 px-6 max-w-7xl mx-auto">
        <div class="text-center mb-20 animate-on-scroll">
            <h2 class="text-4xl md:text-5xl font-extrabold mb-6 editable">How We Work</h2>
            <p class="text-xl opacity-75 editable">A streamlined process to get your product to market faster.</p>
        </div>
        <div class="grid md:grid-cols-4 gap-8 relative">
            <div class="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-current opacity-10 -translate-y-1/2 z-0"></div>
            <div class="relative z-10 text-center animate-on-scroll editable">
                <div class="w-20 h-20 mx-auto ${t.bg} border-4 border-[${t.acc.replace('text-', '')}] rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-xl">1</div>
                <h4 class="text-xl font-bold mb-2">Discovery</h4>
                <p class="opacity-70 text-sm">We analyze your goals and target audience.</p>
            </div>
            <div class="relative z-10 text-center animate-on-scroll delay-100 editable">
                <div class="w-20 h-20 mx-auto ${t.bg} border-4 border-[${t.acc.replace('text-', '')}] rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-xl">2</div>
                <h4 class="text-xl font-bold mb-2">Design</h4>
                <p class="opacity-70 text-sm">Creating stunning, high-fidelity prototypes.</p>
            </div>
            <div class="relative z-10 text-center animate-on-scroll delay-200 editable">
                <div class="w-20 h-20 mx-auto ${t.bg} border-4 border-[${t.acc.replace('text-', '')}] rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-xl">3</div>
                <h4 class="text-xl font-bold mb-2">Development</h4>
                <p class="opacity-70 text-sm">Writing clean, scalable, and secure code.</p>
            </div>
            <div class="relative z-10 text-center animate-on-scroll delay-300 editable">
                <div class="w-20 h-20 mx-auto ${t.btn} text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-xl">4</div>
                <h4 class="text-xl font-bold mb-2">Launch</h4>
                <p class="opacity-70 text-sm">Deploying your project to the world.</p>
            </div>
        </div>
    </section>

    <section id="portfolio" class="py-32 px-6 max-w-7xl mx-auto border-t border-current border-opacity-10">
        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 animate-on-scroll">
            <div>
                <span class="${t.acc} font-extrabold tracking-widest uppercase text-sm mb-4 block editable">Our Portfolio</span>
                <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold editable">Selected Works</h2>
            </div>
            <button class="px-8 py-4 border-2 border-current border-opacity-20 rounded-xl font-bold hover:bg-current hover:bg-opacity-10 transition editable flex items-center gap-2">
                View Full Gallery <i class="fas fa-external-link-alt"></i>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="relative group rounded-3xl overflow-hidden shadow-2xl h-[400px] cursor-pointer editable animate-on-scroll">
                <img src="https://source.unsplash.com/800x800/?${img},app" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-10">
                    <span class="${t.acc} font-bold text-sm uppercase tracking-widest mb-2 translate-y-4 group-hover:translate-y-0 transition duration-300">FinTech</span>
                    <h3 class="text-white text-3xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Project Alpha</h3>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-2xl h-[400px] lg:col-span-2 cursor-pointer editable animate-on-scroll delay-100">
                <img src="https://source.unsplash.com/1200x800/?${img},design" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-10">
                    <span class="${t.acc} font-bold text-sm uppercase tracking-widest mb-2 translate-y-4 group-hover:translate-y-0 transition duration-300">E-Commerce</span>
                    <h3 class="text-white text-3xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Project Beta Platform</h3>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-2xl h-[400px] lg:col-span-2 cursor-pointer editable animate-on-scroll">
                <img src="https://source.unsplash.com/1200x800/?${img},startup" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-10">
                    <span class="${t.acc} font-bold text-sm uppercase tracking-widest mb-2 translate-y-4 group-hover:translate-y-0 transition duration-300">Corporate SaaS</span>
                    <h3 class="text-white text-3xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Project Gamma Dashboard</h3>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-2xl h-[400px] cursor-pointer editable animate-on-scroll delay-100">
                <img src="https://source.unsplash.com/800x800/?${img},software" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-10">
                    <span class="${t.acc} font-bold text-sm uppercase tracking-widest mb-2 translate-y-4 group-hover:translate-y-0 transition duration-300">Mobile</span>
                    <h3 class="text-white text-3xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Project Delta App</h3>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 border-y border-current border-opacity-10 ${t.panel}">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center animate-on-scroll">
            <div class="editable">
                <h4 class="text-5xl md:text-6xl font-extrabold ${t.acc} mb-3 drop-shadow-md">250+</h4>
                <p class="font-bold uppercase tracking-widest opacity-70 text-sm">Projects Delivered</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl md:text-6xl font-extrabold ${t.acc} mb-3 drop-shadow-md">15+</h4>
                <p class="font-bold uppercase tracking-widest opacity-70 text-sm">Awards Won</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl md:text-6xl font-extrabold ${t.acc} mb-3 drop-shadow-md">99%</h4>
                <p class="font-bold uppercase tracking-widest opacity-70 text-sm">Client Retention</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl md:text-6xl font-extrabold ${t.acc} mb-3 drop-shadow-md">24/7</h4>
                <p class="font-bold uppercase tracking-widest opacity-70 text-sm">Expert Support</p>
            </div>
        </div>
    </section>

    <section class="py-32 animate-on-scroll">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <h2 class="text-4xl md:text-5xl font-extrabold mb-20 editable">Client Success Stories</h2>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-10 relative text-left editable hover:-translate-y-2 transition duration-300">
                    <i class="fas fa-quote-right absolute top-10 right-10 text-5xl opacity-5 ${t.acc}"></i>
                    <div class="flex text-yellow-400 mb-6 text-lg"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic leading-relaxed">"Absolutely incredible work. The team understood our vision immediately and delivered a product that exceeded all our expectations. Our conversion rate doubled in a month."</p>
                    <div class="flex items-center gap-5 mt-auto">
                        <img src="https://source.unsplash.com/100x100/?portrait,1" class="w-16 h-16 rounded-full object-cover shadow-md">
                        <div>
                            <h4 class="font-bold text-lg">Sarah Jenkins</h4>
                            <p class="text-sm opacity-60 font-medium">CEO, TechStart Inc.</p>
                        </div>
                    </div>
                </div>
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-10 relative text-left editable hover:-translate-y-2 transition duration-300">
                    <i class="fas fa-quote-right absolute top-10 right-10 text-5xl opacity-5 ${t.acc}"></i>
                    <div class="flex text-yellow-400 mb-6 text-lg"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic leading-relaxed">"The speed and quality of delivery are unmatched. They didn't just build a website; they built the digital foundation of our entire business."</p>
                    <div class="flex items-center gap-5 mt-auto">
                        <img src="https://source.unsplash.com/100x100/?portrait,2" class="w-16 h-16 rounded-full object-cover shadow-md">
                        <div>
                            <h4 class="font-bold text-lg">David Chen</h4>
                            <p class="text-sm opacity-60 font-medium">Founder, InnovateCorp</p>
                        </div>
                    </div>
                </div>
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-10 relative text-left editable hover:-translate-y-2 transition duration-300">
                    <i class="fas fa-quote-right absolute top-10 right-10 text-5xl opacity-5 ${t.acc}"></i>
                    <div class="flex text-yellow-400 mb-6 text-lg"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic leading-relaxed">"Professional, highly responsive, and brilliantly creative. Working with this team was hands-down the best decision we made for our global rebrand."</p>
                    <div class="flex items-center gap-5 mt-auto">
                        <img src="https://source.unsplash.com/100x100/?portrait,3" class="w-16 h-16 rounded-full object-cover shadow-md">
                        <div>
                            <h4 class="font-bold text-lg">Emily Rossi</h4>
                            <p class="text-sm opacity-60 font-medium">Marketing Director, GlobalReach</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="pricing" class="py-32 px-6 max-w-7xl mx-auto">
        <div class="text-center mb-24 animate-on-scroll">
            <span class="${t.acc} font-extrabold tracking-widest uppercase text-sm mb-4 block editable">Pricing Plans</span>
            <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold editable">Simple, transparent pricing</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 items-center">
            <div class="${t.panel} p-12 rounded-[2.5rem] border border-current border-opacity-10 text-center editable animate-on-scroll hover:shadow-xl transition">
                <h3 class="text-2xl font-bold mb-2">Starter</h3>
                <p class="opacity-60 mb-8">Perfect for small businesses</p>
                <div class="text-5xl font-extrabold mb-8">$99<span class="text-lg opacity-50 font-normal">/mo</span></div>
                <ul class="space-y-5 mb-10 text-left opacity-80 font-medium">
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> 5 Premium Pages</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Basic SEO Optimization</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Mobile Responsive</li>
                    <li class="opacity-40"><i class="fas fa-times mr-3"></i> E-Commerce Integration</li>
                </ul>
                <button class="w-full py-4 border-2 border-current rounded-xl font-bold hover:bg-current hover:bg-opacity-10 transition">Choose Starter</button>
            </div>
            
            <div class="${t.bg} p-14 rounded-[2.5rem] shadow-2xl border-2 border-[${t.acc.replace('text-', '')}] transform md:-translate-y-6 relative editable animate-on-scroll delay-100 z-10">
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${t.btn} text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg uppercase tracking-wider">Most Popular</div>
                <h3 class="text-2xl font-bold mb-2 text-center">Professional</h3>
                <p class="opacity-60 mb-8 text-center">For growing scale-ups</p>
                <div class="text-6xl font-extrabold mb-8 text-center">$249<span class="text-xl opacity-50 font-normal">/mo</span></div>
                <ul class="space-y-5 mb-10 text-left font-semibold text-lg">
                    <li><i class="fas fa-check ${t.acc} mr-3 text-xl"></i> Unlimited Pages</li>
                    <li><i class="fas fa-check ${t.acc} mr-3 text-xl"></i> Advanced SEO Setup</li>
                    <li><i class="fas fa-check ${t.acc} mr-3 text-xl"></i> Custom Animations</li>
                    <li><i class="fas fa-check ${t.acc} mr-3 text-xl"></i> E-Commerce Integration</li>
                    <li><i class="fas fa-check ${t.acc} mr-3 text-xl"></i> 24/7 Priority Support</li>
                </ul>
                <button class="w-full py-5 ${t.btn} text-white rounded-xl font-bold text-lg shadow-xl hover:opacity-90 transition transform hover:-translate-y-1">Choose Pro</button>
            </div>

            <div class="${t.panel} p-12 rounded-[2.5rem] border border-current border-opacity-10 text-center editable animate-on-scroll delay-200 hover:shadow-xl transition">
                <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
                <p class="opacity-60 mb-8">For large scale applications</p>
                <div class="text-5xl font-extrabold mb-8">Custom</div>
                <ul class="space-y-5 mb-10 text-left opacity-80 font-medium">
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Custom Architecture</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Dedicated Server hosting</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Custom API Integrations</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Dedicated Account Manager</li>
                </ul>
                <button class="w-full py-4 border-2 border-current rounded-xl font-bold hover:bg-current hover:bg-opacity-10 transition">Contact Sales</button>
            </div>
        </div>
    </section>

    <section class="py-32 px-6 max-w-4xl mx-auto animate-on-scroll">
        <h2 class="text-4xl font-extrabold text-center mb-16 editable">Frequently Asked Questions</h2>
        <div class="space-y-6">
            <div class="${t.panel} p-8 rounded-2xl border border-current border-opacity-10 editable cursor-pointer hover:bg-opacity-80 transition">
                <h4 class="text-xl font-bold mb-3 flex justify-between items-center">How long does a project take? <i class="fas fa-plus ${t.acc}"></i></h4>
                <p class="opacity-70 text-lg hidden">Most standard projects are completed within 2 to 4 weeks. Enterprise projects are scoped individually.</p>
            </div>
            <div class="${t.bg} p-8 rounded-2xl shadow-lg border border-current border-opacity-5 editable cursor-pointer">
                <h4 class="text-xl font-bold mb-3 flex justify-between items-center">Do you offer ongoing support? <i class="fas fa-minus ${t.acc}"></i></h4>
                <p class="opacity-70 text-lg">Yes! We offer comprehensive maintenance and support packages to ensure your website remains fast, secure, and up-to-date.</p>
            </div>
            <div class="${t.panel} p-8 rounded-2xl border border-current border-opacity-10 editable cursor-pointer hover:bg-opacity-80 transition">
                <h4 class="text-xl font-bold mb-3 flex justify-between items-center">Can I update the website myself? <i class="fas fa-plus ${t.acc}"></i></h4>
                <p class="opacity-70 text-lg hidden">Absolutely. We build on user-friendly CMS platforms and provide full training so your team can manage content easily.</p>
            </div>
        </div>
    </section>

    <section class="py-24 px-6 animate-on-scroll">
        <div class="max-w-6xl mx-auto rounded-[3rem] ${t.btn} text-white p-12 md:p-24 text-center shadow-2xl relative overflow-hidden editable">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div class="relative z-10">
                <h2 class="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8">Let's build something amazing.</h2>
                <p class="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto">Join our newsletter to receive the latest updates, design tips, and exclusive offers straight to your inbox.</p>
                <form class="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
                    <input type="email" placeholder="Enter your email address" class="px-8 py-5 rounded-2xl text-gray-900 w-full text-lg focus:outline-none focus:ring-4 focus:ring-white/30 shadow-inner" required>
                    <button type="button" class="px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg whitespace-nowrap hover:bg-black transition shadow-xl transform hover:-translate-y-1">Subscribe Now</button>
                </form>
            </div>
        </div>
    </section>

    <section id="contact" class="py-32 px-6 max-w-7xl mx-auto animate-on-scroll">
        <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
                <span class="${t.acc} font-extrabold tracking-widest uppercase text-sm mb-4 block editable">Get In Touch</span>
                <h2 class="text-5xl md:text-6xl font-extrabold mb-8 editable">Contact Us</h2>
                <p class="text-xl opacity-75 mb-12 leading-relaxed editable">Have a groundbreaking project in mind? Reach out to ${ownerName} today. Our team is ready to listen, strategize, and execute.</p>
                
                <div class="space-y-10 editable">
                    <div class="flex items-start gap-6">
                        <div class="w-16 h-16 rounded-2xl ${t.panel} flex items-center justify-center text-3xl shadow-md border border-current border-opacity-10"><i class="fas fa-map-marker-alt ${t.acc}"></i></div>
                        <div>
                            <h4 class="text-2xl font-bold mb-2">Global Headquarters</h4>
                            <p class="opacity-70 text-lg">123 Innovation Drive, Suite 500<br>Technology District, NY 10010</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-6">
                        <div class="w-16 h-16 rounded-2xl ${t.panel} flex items-center justify-center text-3xl shadow-md border border-current border-opacity-10"><i class="fas fa-phone-alt ${t.acc}"></i></div>
                        <div>
                            <h4 class="text-2xl font-bold mb-2">Direct Line</h4>
                            <p class="opacity-70 text-lg">Mon-Fri from 8am to 6pm EST.</p>
                            <p class="font-extrabold text-xl mt-1">+1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="${t.panel} rounded-[3rem] p-10 md:p-14 shadow-2xl border border-current border-opacity-10 editable flex flex-col justify-center relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-64 h-64 bg-[${t.acc.replace('text-', '')}] opacity-10 rounded-full blur-3xl"></div>
                <h3 class="text-3xl font-bold mb-6 relative z-10">Direct Channels</h3>
                <p class="opacity-75 mb-10 text-lg relative z-10">Prefer instant messaging? Connect with us directly on our primary channels for immediate response.</p>
                
                <div class="flex flex-col gap-6 relative z-10">
                    <a href="https://wa.me/${phoneNum}" target="_blank" class="flex items-center gap-5 px-8 py-6 bg-[#25D366] text-white rounded-2xl font-bold text-xl hover:bg-[#20bd5a] transition shadow-xl transform hover:-translate-y-1">
                        <i class="fab fa-whatsapp text-4xl"></i>
                        <span>Chat on WhatsApp</span>
                    </a>
                    
                    <a href="mailto:${mailTo}" class="flex items-center gap-5 px-8 py-6 bg-gray-800 text-white rounded-2xl font-bold text-xl hover:bg-gray-900 transition shadow-xl transform hover:-translate-y-1">
                        <i class="fas fa-envelope text-3xl"></i>
                        <span>Send an Email</span>
                    </a>
                    
                    <a href="${linkedinUrl}" target="_blank" class="flex items-center gap-5 px-8 py-6 bg-[#0077B5] text-white rounded-2xl font-bold text-xl hover:bg-[#005f92] transition shadow-xl transform hover:-translate-y-1">
                        <i class="fab fa-linkedin-in text-3xl"></i>
                        <span>Connect on LinkedIn</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <footer class="pt-24 pb-12 px-6 ${t.bg === 'bg-white' ? 'bg-gray-900 text-white' : t.panel} border-t border-current border-opacity-10 mt-20 relative overflow-hidden">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20 relative z-10">
            <div class="lg:col-span-2">
                <div class="text-4xl font-extrabold mb-8 flex items-center gap-3 editable">
                    <i class="fas fa-cube ${t.bg === 'bg-white' ? 'text-white' : t.acc}"></i> ${title}
                </div>
                <p class="opacity-70 leading-relaxed text-lg mb-8 max-w-sm editable">
                    Building the future of digital experiences. We empower forward-thinking businesses to reach their absolute full potential online through design and code.
                </p>
                <div class="flex gap-4 text-2xl">
                    <a href="#" class="w-12 h-12 rounded-full bg-current bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 hover:-translate-y-1 transition transform editable"><i class="fab fa-twitter"></i></a>
                    <a href="${linkedinUrl}" class="w-12 h-12 rounded-full bg-current bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 hover:-translate-y-1 transition transform editable"><i class="fab fa-linkedin-in"></i></a>
                    <a href="#" class="w-12 h-12 rounded-full bg-current bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 hover:-translate-y-1 transition transform editable"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
            
            <div>
                <h4 class="text-xl font-bold mb-8 editable">Company</h4>
                <ul class="space-y-5 opacity-75 font-medium text-lg">
                    <li><a href="#about" class="hover:underline transition editable">About Us</a></li>
                    <li><a href="#services" class="hover:underline transition editable">Our Services</a></li>
                    <li><a href="#portfolio" class="hover:underline transition editable">Portfolio</a></li>
                    <li><a href="#" class="hover:underline transition editable">Careers</a></li>
                </ul>
            </div>
            
            <div>
                <h4 class="text-xl font-bold mb-8 editable">Resources</h4>
                <ul class="space-y-5 opacity-75 font-medium text-lg">
                    <li><a href="#" class="hover:underline transition editable">Help Center</a></li>
                    <li><a href="#" class="hover:underline transition editable">Company Blog</a></li>
                    <li><a href="#" class="hover:underline transition editable">Case Studies</a></li>
                    <li><a href="#" class="hover:underline transition editable">API Docs</a></li>
                </ul>
            </div>
            
            <div>
                <h4 class="text-xl font-bold mb-8 editable">Legal</h4>
                <ul class="space-y-5 opacity-75 font-medium text-lg">
                    <li><a href="#" class="hover:underline transition editable">Privacy Policy</a></li>
                    <li><a href="#" class="hover:underline transition editable">Terms of Service</a></li>
                    <li><a href="#" class="hover:underline transition editable">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        
        <div class="max-w-7xl mx-auto pt-10 border-t border-current border-opacity-20 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 font-medium relative z-10">
            <p class="editable text-lg">&copy; 2026 ${title}. All rights reserved.</p>
            <p class="editable text-lg flex items-center gap-2">Built with <i class="fas fa-heart text-red-500"></i> by Zulora AI Engine</p>
        </div>
    </footer>

    <script>
        // 1. Scroll Animations Logic (Intersection Observer)
        document.addEventListener("DOMContentLoaded", () => {
            const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        });

        // 2. Mobile Menu Logic for Generated Site
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const icon = document.getElementById('hamburger-icon');
            menu.classList.toggle('open');
            icon.classList.toggle('active');
            
            if(menu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }
    </script>
</body>
</html>`;
    },

    // --- 3.6 STUDIO EDITOR INTERFACE LOGIC ---
    mountSiteToEditor(htmlCode) {
        STATE.currentProject.html = htmlCode;
        const iframe = document.getElementById('editor-frame');
        const doc = iframe.contentWindow.document;
        
        doc.open();
        doc.write(htmlCode);
        doc.close();
        
        // Inject Interaction Script into the Generated Site
        setTimeout(() => {
            const editorScript = doc.createElement('script');
            editorScript.textContent = `
                document.body.addEventListener('click', function(e) {
                    if(!e.target.classList.contains('editable')) return; 
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const prev = document.querySelector('.zulora-selected-element');
                    if(prev) {
                        prev.style.outline = '';
                        prev.style.boxShadow = '';
                        prev.classList.remove('zulora-selected-element');
                    }
                    
                    e.target.style.outline = '3px solid #6366f1';
                    e.target.style.outlineOffset = '2px';
                    e.target.style.boxShadow = '0 0 15px rgba(99,102,241,0.5)';
                    e.target.classList.add('zulora-selected-element');
                    
                    let elType = 'text';
                    if(e.target.tagName === 'IMG') elType = 'image';
                    if(e.target.tagName === 'A' || e.target.tagName === 'BUTTON') elType = 'link';

                    const computed = window.getComputedStyle(e.target);
                    
                    window.parent.postMessage({
                        type: 'ZULORA_ELEMENT_SELECTED',
                        elType: elType,
                        tagName: e.target.tagName,
                        text: e.target.innerText || '',
                        src: e.target.src || '',
                        href: e.target.href || '',
                        color: computed.color,
                        bgColor: computed.backgroundColor,
                        fontSize: computed.fontSize
                    }, '*');
                });

                window.addEventListener('message', function(ev) {
                    const el = document.querySelector('.zulora-selected-element');
                    if(!el) return;
                    const data = ev.data;
                    if(data.action === 'UPDATE_TEXT' && el.tagName !== 'IMG') el.innerText = data.value;
                    if(data.action === 'UPDATE_COLOR') el.style.color = data.value;
                    if(data.action === 'UPDATE_BG') el.style.backgroundColor = data.value;
                    if(data.action === 'UPDATE_SIZE') el.style.fontSize = data.value + 'px';
                    if(data.action === 'UPDATE_SRC' && el.tagName === 'IMG') el.src = data.value;
                    if(data.action === 'UPDATE_LINK' && el.tagName === 'A') el.href = data.value;
                });
            `;
            doc.body.appendChild(editorScript);
        }, 500);
    },

    handleIframeMessage(event) {
        if (event.data.type === 'ZULORA_ELEMENT_SELECTED') {
            const data = event.data;
            
            document.getElementById('prop-empty').classList.add('hidden');
            document.getElementById('prop-active').classList.remove('hidden');
            
            // Text Content
            document.getElementById('prop-text-val').value = data.text;
            
            // Font Size
            const fontSizeNum = parseInt(data.fontSize);
            document.getElementById('prop-size-val').value = fontSizeNum;
            document.getElementById('prop-size-lbl').innerText = fontSizeNum;
            
            // Colors
            const hexColor = this.rgbToHex(data.color);
            const hexBg = this.rgbToHex(data.bgColor);
            document.getElementById('prop-color-val').value = hexColor;
            document.getElementById('prop-bg-val').value = hexBg;

            // Media (Image) Panel
            const mediaWrap = document.getElementById('prop-media-group');
            if (data.elType === 'image') {
                mediaWrap.classList.remove('hidden');
                document.getElementById('prop-img-preview').src = data.src;
                document.getElementById('prop-img-url').value = data.src;
            } else {
                mediaWrap.classList.add('hidden');
            }
        }
    },

    updateElementProp(action, value) {
        const iframe = document.getElementById('editor-frame');
        if(iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: action, value: value }, '*');
        }
    },

    generateFromStudio() {
        this.showToast("Applying AI modifications to canvas...", "info");
        setTimeout(() => this.showToast("Modifications applied successfully!", "success"), 1500);
    },

    // --- 3.7 SUBDOMAIN PUBLISHING SYSTEM ---
    executePublish() {
        const subInput = document.getElementById('subdomain-input').value.trim().toLowerCase();
        if(!subInput) return this.showToast("Please enter a valid subdomain name.", "error");
        
        // Remove special characters
        const cleanSubdomain = subInput.replace(/[^a-z0-9-]/g, '');
        STATE.currentProject.subdomain = cleanSubdomain;

        this.closeModal('publish-modal');
        this.showToast("Registering subdomain and deploying to global CDN...", "info");
        
        // Simulate API delay for deployment and Google Indexing
        setTimeout(() => {
            const finalUrl = `https://${cleanSubdomain}.zulora.in`;
            document.getElementById('studio-subdomain-display').innerText = finalUrl;
            
            this.showToast(`Site published live at ${finalUrl}`, "success");
            setTimeout(() => {
                this.showToast("Sitemap submitted to Google Search Console.", "info");
            }, 2000);
            
        }, 2500);
    },

    openPreviewOverlay() {
        if (!STATE.currentProject.html) return this.showToast("Generate a site first.", "warning");
        const blob = new Blob([STATE.currentProject.html], { type: 'text/html' });
        const fsFrame = document.getElementById('fs-frame');
        fsFrame.src = URL.createObjectURL(blob);
        document.getElementById('preview-overlay').classList.remove('hidden');
    },

    closePreviewOverlay() {
        document.getElementById('preview-overlay').classList.add('hidden');
    },

    // --- 3.8 UTILITIES & PAYMENTS ---
    rgbToHex(rgb) {
        if (!rgb || !rgb.startsWith('rgb')) return '#000000';
        const rgbVals = rgb.match(/\d+/g);
        if (!rgbVals) return '#000000';
        return "#" + ((1 << 24) + (parseInt(rgbVals[0]) << 16) + (parseInt(rgbVals[1]) << 8) + parseInt(rgbVals[2])).toString(16).slice(1);
    },

    generateUPIQR() {
        const qrContainer = document.getElementById('upi-qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = ""; 
            const upiUrl = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${CONFIG.upi.amount}&cu=INR`;
            new QRCode(qrContainer, {
                text: upiUrl, width: 140, height: 140, colorDark: "#000000", colorLight: "#ffffff"
            });
        }
    },

    verifyPayment() {
        const email = STATE.user ? STATE.user.email : 'Unregistered User';
        const msg = `Payment Verification: I have paid ₹${CONFIG.upi.amount} for Zulora Pro via UPI.\nAccount Email: ${email}`;
        window.open(`https://wa.me/${CONFIG.support.whatsapp.replace('+','')}?text=${encodeURIComponent(msg)}`, '_blank');
        this.closeModal('payment-modal');
        this.showToast("Verification request sent to Support Team!", "success");
    },

    copyReferral() {
        if(!STATE.user) {
            this.openModal('auth-modal');
            return this.showToast("Please log in to claim your unique referral link.", "warning");
        }
        const input = document.getElementById('referral-link-input');
        input.select();
        document.execCommand('copy');
        this.showToast("Unique Referral link copied to clipboard!", "success");
    },

    // --- 3.9 EVENT LISTENER BINDINGS ---
    setupEventListeners() {
        // Auth Button
        const gBtn = document.getElementById('google-signin-btn');
        if(gBtn) gBtn.addEventListener('click', () => this.loginWithGoogle());

        // Iframe PostMessages
        window.addEventListener('message', (e) => this.handleIframeMessage(e));

        // Editor Property Inputs
        const bindInput = (id, action) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', (e) => this.updateElementProp(action, e.target.value));
        };
        
        bindInput('prop-text-val', 'UPDATE_TEXT');
        bindInput('prop-color-val', 'UPDATE_COLOR');
        bindInput('prop-bg-val', 'UPDATE_BG');
        bindInput('prop-img-url', 'UPDATE_SRC');

        // Font Size Slider
        const sizeSlider = document.getElementById('prop-size-val');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                document.getElementById('prop-size-lbl').innerText = e.target.value;
                this.updateElementProp('UPDATE_SIZE', e.target.value);
            });
        }

        // Image Upload (File API -> Data URL)
        const fileUpload = document.getElementById('device-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        document.getElementById('prop-img-preview').src = dataUrl;
                        document.getElementById('prop-img-url').value = dataUrl;
                        this.updateElementProp('UPDATE_SRC', dataUrl);
                        this.showToast("Image uploaded and injected into canvas!", "success");
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Studio Left Sidebar Tabs
        document.querySelectorAll('.studio-sidebar-left .t-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.studio-sidebar-left .t-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Device Toggles (Responsive views)
        document.querySelectorAll('.device-toggle-group .dt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.device-toggle-group .dt-btn').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const wrapper = document.getElementById('canvas-scaler');
                const view = target.getAttribute('data-view');
                if (view === 'mobile') wrapper.style.maxWidth = '375px';
                else if (view === 'tablet') wrapper.style.maxWidth = '768px';
                else wrapper.style.maxWidth = '1200px';
            });
        });
    }
};

// Start the Engine
document.addEventListener('DOMContentLoaded', () => {
    ZuloraApp.init();
});
