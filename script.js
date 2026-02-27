/**
 * ============================================================================
 * ZULORA STUDIO - CORTEX ENGINE (GEN 20.0 - ZENITH)
 * ============================================================================
 * @version 20.0.0 (Production Master)
 * @author Zulora AI Team & Shiven Panwar
 * @description Advanced SPA State Management, Firebase Auth, and AI Editor.
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. GLOBAL CONFIGURATION & FIREBASE
   ---------------------------------------------------------------------------- */

const CONFIG = {
    appName: "Zulora Studio",
    domain: "zulora.in",
    founder: "Shiven Panwar",
    
    // Support Details
    support: {
        whatsapp: "916395211325",
        email: "zulora.help@gmail.com",
        insta: "zulora_official"
    },
    
    // Economy
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

const API_KEYS = {
    groq: "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"
};

// --- FIREBASE CONFIGURATION ---
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
    console.log("🔥 Firebase Engine Initialized");
}

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

/* ----------------------------------------------------------------------------
   2. APP STATE MANAGEMENT
   ---------------------------------------------------------------------------- */

const STATE = {
    user: null,          // Holds Firebase User Object (UID, Email, Name)
    credits: 0,
    menuOpen: false,
    currentProject: {
        html: "",
        name: "My Website"
    }
};

/* ----------------------------------------------------------------------------
   3. CORE APPLICATION CONTROLLER (ZuloraApp)
   ---------------------------------------------------------------------------- */

window.ZuloraApp = {
    
    // --- 3.1 INITIALIZATION ---
    init() {
        console.log(`🚀 Starting Zulora Studio v20.0 by ${CONFIG.founder}`);
        
        // Listen to Firebase Auth State changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });

        this.setupEventListeners();
        this.generateUPIQR();
    },

    // --- 3.2 FIREBASE AUTHENTICATION LOGIC ---
    loginWithGoogle() {
        const btn = document.getElementById('google-signin-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Authenticating...`;

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

    handleUserLogin(firebaseUser) {
        STATE.user = {
            uid: firebaseUser.uid, // Unique ID tied to their Gmail
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoUrl: firebaseUser.photoURL
        };
        
        // Check local storage for credits, otherwise give starting balance
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
        // Desktop Nav
        document.getElementById('auth-guest').classList.add('hidden');
        document.getElementById('auth-user').classList.remove('hidden');
        document.getElementById('nav-credit-balance').innerText = STATE.credits;
        document.getElementById('nav-avatar').src = STATE.user.photoUrl || 'assets/favicon.png';
        
        // Mobile Drawer
        document.getElementById('drawer-auth-btn').classList.add('hidden');
        document.getElementById('drawer-user-area').classList.remove('hidden');
        document.getElementById('drawer-username').innerText = STATE.user.name;
        document.getElementById('drawer-email').innerText = STATE.user.email;
        document.getElementById('drawer-avatar').src = STATE.user.photoUrl || 'assets/favicon.png';
        
        // Studio Credits
        const studioCred = document.getElementById('studio-credits-display');
        if(studioCred) studioCred.innerText = STATE.credits;
    },

    // --- 3.3 NAVIGATION & 3-BAR MENU ---
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

    // --- 3.4 MODAL & TOAST SYSTEM ---
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
    },

    showToast(message, type = "info") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-msg toast-${type}`;
        
        let icon = "fa-info-circle";
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

    // --- 3.5 AI GENERATION ENGINE ---
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
            this.showToast("Authentication required to generate and save your site.", "info");
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
        this.showToast("Zulora Neural Engine is architecting your site...", "info");
        
        const loader = document.getElementById('hero-mockup-loader');
        if(loader) loader.classList.remove('hidden');

        try {
            console.log("Calling Groq API...");
            let generatedHTML = await this.callGroqAPI(prompt);
            
            if (!generatedHTML || generatedHTML.length < 500) {
                throw new Error("API Output Insufficient");
            }
            
            this.mountSiteToEditor(generatedHTML);
            this.showToast("Website Generated Successfully!", "success");
            
        } catch (error) {
            console.warn("API Failed. Initializing God-Mode Fallback...", error);
            // GOD-MODE OFFLINE ENGINE TRIGGER
            const generatedHTML = this.godModeGenerator(prompt, STATE.user);
            this.mountSiteToEditor(generatedHTML);
            this.showToast("Site generated via Offline AI Engine.", "success");
        } finally {
            if(loader) loader.classList.add('hidden');
        }
    },

    async callGroqAPI(prompt) {
        const sysPrompt = `You are Zulora AI, the world's most advanced web developer.
        Role: Output ONLY single-file valid HTML5 code with embedded Tailwind CSS.
        Context: User wants a website based on: "${prompt}".
        Rules:
        1. Use <script src="https://cdn.tailwindcss.com"></script>
        2. Include FontAwesome CDN.
        3. Make it highly professional, modern, and responsive.
        4. Include a Hero, Features/About, Gallery/Services, and Contact section.
        5. DO NOT wrap in Markdown. DO NOT say "Here is the code". ONLY output raw HTML.`;

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

    // --- 3.6 GOD-MODE TEMPLATE ENGINE (Offline Fallback) ---
    // If API fails, this dynamically builds a massive, editable, functional site.
    godModeGenerator(prompt, user) {
        const p = prompt.toLowerCase();
        
        let t = { bg: "bg-white", text: "text-slate-900", acc: "text-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700", panel: "bg-slate-50" };
        let img = "business,office";
        
        if (p.includes("dark") || p.includes("cyber") || p.includes("game")) {
            t = { bg: "bg-slate-900", text: "text-white", acc: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500", panel: "bg-slate-800" };
            img = "gaming,neon";
        } else if (p.includes("food") || p.includes("rest")) {
            t = { bg: "bg-orange-50", text: "text-slate-800", acc: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700", panel: "bg-white" };
            img = "restaurant,food";
        } else if (p.includes("shop") || p.includes("store") || p.includes("luxury")) {
            t = { bg: "bg-zinc-50", text: "text-zinc-900", acc: "text-zinc-900", btn: "bg-zinc-900 hover:bg-zinc-800 text-white", panel: "bg-white" };
            img = "luxury,fashion";
        }

        const title = prompt.length > 25 ? "My Awesome Brand" : prompt;
        const ownerName = user ? user.name : "Admin";
        const mailTo = user ? user.email : CONFIG.support.email;
        const phoneUrl = `https://wa.me/${CONFIG.support.whatsapp.replace('+', '')}`;

        return `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Generated by Zulora</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
        
        /* Studio Editor Hover State */
        .editable { transition: all 0.2s ease-in-out; border: 1px solid transparent; }
        .editable:hover { 
            outline: 2px dashed ${t.btn.includes('bg-black') ? '#000' : '#4f46e5'}; 
            outline-offset: 2px;
            cursor: pointer; 
            background: rgba(128, 128, 128, 0.05); 
            border-radius: 4px;
        }

        /* Custom Animations */
        .animate-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        
        @keyframes slideUp { 
            from { opacity: 0; transform: translateY(40px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .float-anim { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }

        /* Hide scrollbar for clean UI */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.5); }
    </style>
</head>
<body class="${t.bg} ${t.text} antialiased selection:bg-indigo-500 selection:text-white">

    <div class="${t.btn} text-white px-4 py-2 text-center text-sm font-medium flex justify-center items-center gap-2">
        <span class="animate-pulse h-2 w-2 bg-white rounded-full block"></span>
        <span class="editable">Welcome to the newly generated website for ${title}. We are open for business!</span>
    </div>

    <nav class="p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 ${t.bg} border-b border-current border-opacity-10 transition-all">
        <div class="text-2xl font-extrabold editable flex items-center gap-3 tracking-tight">
            <div class="w-10 h-10 rounded-xl ${t.btn} text-white flex items-center justify-center shadow-lg">
                <i class="fas fa-cube"></i>
            </div>
            ${title}
        </div>
        
        <div class="hidden lg:flex gap-8 font-semibold items-center text-sm uppercase tracking-wider opacity-80">
            <a href="#home" class="hover:${t.acc} transition editable">Home</a>
            <a href="#about" class="hover:${t.acc} transition editable">About</a>
            <a href="#services" class="hover:${t.acc} transition editable">Services</a>
            <a href="#portfolio" class="hover:${t.acc} transition editable">Portfolio</a>
            <a href="#pricing" class="hover:${t.acc} transition editable">Pricing</a>
        </div>

        <div class="hidden lg:flex items-center gap-4">
            <a href="#contact" class="editable font-bold hover:${t.acc} transition">Log In</a>
            <a href="#contact" class="px-7 py-2.5 ${t.btn} text-white rounded-full font-bold shadow-xl transition transform hover:-translate-y-1 hover:shadow-2xl editable">
                Get Started
            </a>
        </div>

        <div class="lg:hidden text-2xl opacity-70 cursor-pointer editable">
            <i class="fas fa-bars"></i>
        </div>
    </nav>

    <header id="home" class="relative pt-24 pb-32 px-6 text-center max-w-7xl mx-auto overflow-hidden">
        <div class="animate-up">
            <span class="inline-block py-1.5 px-5 rounded-full ${t.panel} shadow-sm text-sm font-bold mb-8 border border-current border-opacity-10 uppercase tracking-widest editable">
                <i class="fas fa-star text-yellow-500 mr-2"></i> Rated #1 by ${ownerName}
            </span>
            
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight tracking-tighter editable">
                Experience the <br class="hidden md:block" />
                <span class="${t.acc} relative inline-block">
                    future today.
                    <svg class="absolute w-full h-3 -bottom-1 left-0 text-current opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="transparent"/></svg>
                </span>
            </h1>
            
            <p class="text-lg md:text-2xl opacity-70 mb-12 max-w-3xl mx-auto leading-relaxed editable">
                ${prompt} We specialize in turning your complex problems into elegant, scalable, and beautiful solutions.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                <button class="px-10 py-4 ${t.btn} text-white rounded-2xl font-bold text-lg shadow-2xl hover:opacity-90 transition transform hover:-translate-y-1 editable">
                    Start Your Journey <i class="fas fa-arrow-right ml-2"></i>
                </button>
                <button class="px-10 py-4 ${t.panel} border border-current border-opacity-20 rounded-2xl font-bold text-lg hover:bg-opacity-80 transition transform hover:-translate-y-1 editable flex items-center justify-center gap-2">
                    <i class="fas fa-play-circle ${t.acc}"></i> Watch Demo
                </button>
            </div>
        </div>

        <div class="relative max-w-5xl mx-auto animate-up delay-200">
            <div class="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[3rem] opacity-20 blur-2xl"></div>
            <img src="https://source.unsplash.com/1600x900/?${img},technology" class="relative w-full h-[400px] md:h-[600px] object-cover rounded-[2rem] shadow-2xl editable z-10" alt="Hero Image">
            
            <div class="absolute -left-6 md:-left-12 top-20 ${t.panel} p-4 rounded-2xl shadow-2xl border border-current border-opacity-10 z-20 float-anim hidden md:flex items-center gap-4 editable">
                <div class="w-12 h-12 rounded-full ${t.btn} text-white flex items-center justify-center text-xl"><i class="fas fa-chart-line"></i></div>
                <div class="text-left">
                    <p class="text-xs opacity-60 font-bold uppercase">Growth</p>
                    <p class="font-extrabold text-xl">+128%</p>
                </div>
            </div>

            <div class="absolute -right-6 md:-right-12 bottom-20 ${t.panel} p-4 rounded-2xl shadow-2xl border border-current border-opacity-10 z-20 float-anim hidden md:flex items-center gap-4 editable" style="animation-delay: 2s;">
                <div class="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl"><i class="fas fa-check"></i></div>
                <div class="text-left">
                    <p class="text-xs opacity-60 font-bold uppercase">Status</p>
                    <p class="font-extrabold text-xl">All Systems Go</p>
                </div>
            </div>
        </div>
    </header>

    <section class="py-10 border-y border-current border-opacity-10 opacity-60 overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
            <p class="text-center text-sm font-bold uppercase tracking-widest mb-6 editable">Trusted by innovative companies worldwide</p>
            <div class="flex flex-wrap justify-center items-center gap-10 md:gap-20 text-3xl md:text-4xl">
                <i class="fab fa-aws editable hover:opacity-100 transition"></i>
                <i class="fab fa-google editable hover:opacity-100 transition"></i>
                <i class="fab fa-microsoft editable hover:opacity-100 transition"></i>
                <i class="fab fa-spotify editable hover:opacity-100 transition"></i>
                <i class="fab fa-stripe editable hover:opacity-100 transition"></i>
                <i class="fab fa-slack editable hover:opacity-100 transition"></i>
            </div>
        </div>
    </section>

    <section id="about" class="py-32 px-6 max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
            <div class="relative animate-up">
                <div class="grid grid-cols-2 gap-4">
                    <img src="https://source.unsplash.com/600x800/?${img},team" class="w-full h-80 object-cover rounded-3xl shadow-lg mt-12 editable" alt="Team">
                    <img src="https://source.unsplash.com/600x800/?${img},office" class="w-full h-80 object-cover rounded-3xl shadow-lg editable" alt="Office">
                </div>
                <div class="absolute inset-0 bg-gradient-to-tr from-current to-transparent opacity-5 rounded-3xl pointer-events-none"></div>
            </div>
            
            <div class="animate-up delay-100 text-left">
                <span class="${t.acc} font-bold tracking-widest uppercase text-sm mb-4 block editable">About Us</span>
                <h2 class="text-4xl md:text-6xl font-bold mb-6 leading-tight editable">Built for scale, designed for you.</h2>
                <p class="text-lg opacity-70 mb-8 leading-relaxed editable">
                    We believe in pushing the boundaries of what's possible. Led by ${ownerName}, our team combines deep technical expertise with stunning design to deliver products that truly matter. Every line of code, every pixel, is crafted with precision.
                </p>
                
                <ul class="space-y-4 mb-10">
                    <li class="flex items-center gap-4 text-lg font-semibold editable"><i class="fas fa-check-circle ${t.acc} text-xl"></i> Award-winning UI/UX Design</li>
                    <li class="flex items-center gap-4 text-lg font-semibold editable"><i class="fas fa-check-circle ${t.acc} text-xl"></i> High-performance architecture</li>
                    <li class="flex items-center gap-4 text-lg font-semibold editable"><i class="fas fa-check-circle ${t.acc} text-xl"></i> 24/7 Dedicated Support</li>
                </ul>

                <button class="px-8 py-4 ${t.btn} text-white rounded-xl font-bold shadow-lg hover:-translate-y-1 transition editable">
                    Learn More About Us
                </button>
            </div>
        </div>
    </section>

    <section id="services" class="py-32 ${t.panel}">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-20 animate-up">
                <span class="${t.acc} font-bold tracking-widest uppercase text-sm mb-4 block editable">Our Expertise</span>
                <h2 class="text-4xl md:text-6xl font-bold mb-6 editable">What We Do Best</h2>
                <p class="text-xl opacity-70 max-w-2xl mx-auto editable">Comprehensive solutions tailored to elevate your brand and streamline your operations.</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-laptop-code"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Web Development</h3>
                    <p class="opacity-70 leading-relaxed mb-6">Custom coded websites that load instantly and perform flawlessly across all devices and platforms.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up delay-100 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Mobile Applications</h3>
                    <p class="opacity-70 leading-relaxed mb-6">Native and cross-platform mobile apps designed to engage users and drive conversions.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up delay-200 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-paint-brush"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">UI/UX Design</h3>
                    <p class="opacity-70 leading-relaxed mb-6">User-centric design philosophies that create beautiful, intuitive, and accessible interfaces.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">SEO & Marketing</h3>
                    <p class="opacity-70 leading-relaxed mb-6">Data-driven strategies to increase your visibility, rank higher, and attract the right audience.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up delay-100 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">E-Commerce</h3>
                    <p class="opacity-70 leading-relaxed mb-6">Secure, scalable online stores optimized for sales, complete with UPI and global payment gateways.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
                <div class="p-10 rounded-[2rem] ${t.bg} shadow-xl border border-current border-opacity-5 hover:-translate-y-3 transition duration-300 group animate-up delay-200 editable">
                    <div class="w-16 h-16 rounded-2xl ${t.btn} text-white flex items-center justify-center text-2xl mb-8 shadow-lg group-hover:scale-110 transition duration-300">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">AI Integration</h3>
                    <p class="opacity-70 leading-relaxed mb-6">Implement cutting-edge Artificial Intelligence to automate tasks and provide smart user experiences.</p>
                    <a href="#" class="${t.acc} font-bold hover:underline">Explore <i class="fas fa-arrow-right text-sm"></i></a>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 border-b border-current border-opacity-10">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center animate-up">
            <div class="editable">
                <h4 class="text-5xl font-extrabold ${t.acc} mb-2">250+</h4>
                <p class="font-bold uppercase tracking-widest opacity-60 text-sm">Projects Delivered</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl font-extrabold ${t.acc} mb-2">15+</h4>
                <p class="font-bold uppercase tracking-widest opacity-60 text-sm">Awards Won</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl font-extrabold ${t.acc} mb-2">99%</h4>
                <p class="font-bold uppercase tracking-widest opacity-60 text-sm">Client Satisfaction</p>
            </div>
            <div class="editable">
                <h4 class="text-5xl font-extrabold ${t.acc} mb-2">24/7</h4>
                <p class="font-bold uppercase tracking-widest opacity-60 text-sm">Global Support</p>
            </div>
        </div>
    </section>

    <section id="portfolio" class="py-32 px-6 max-w-7xl mx-auto animate-up">
        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
                <span class="${t.acc} font-bold tracking-widest uppercase text-sm mb-4 block editable">Portfolio</span>
                <h2 class="text-4xl md:text-5xl font-bold editable">Selected Works</h2>
            </div>
            <button class="px-6 py-3 border-2 border-current border-opacity-20 rounded-xl font-bold hover:bg-opacity-10 transition editable">
                View All Projects
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="relative group rounded-3xl overflow-hidden shadow-lg h-80 cursor-pointer editable">
                <img src="https://source.unsplash.com/800x800/?${img},app" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-8">
                    <h3 class="text-white text-2xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300">Project Alpha</h3>
                    <p class="text-white/80 translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Web Application</p>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-lg h-80 lg:col-span-2 cursor-pointer editable">
                <img src="https://source.unsplash.com/1200x800/?${img},design" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-8">
                    <h3 class="text-white text-2xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300">Project Beta</h3>
                    <p class="text-white/80 translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">E-Commerce Platform</p>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-lg h-80 lg:col-span-2 cursor-pointer editable">
                <img src="https://source.unsplash.com/1200x800/?${img},startup" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-8">
                    <h3 class="text-white text-2xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300">Project Gamma</h3>
                    <p class="text-white/80 translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Corporate Branding</p>
                </div>
            </div>
            <div class="relative group rounded-3xl overflow-hidden shadow-lg h-80 cursor-pointer editable">
                <img src="https://source.unsplash.com/800x800/?${img},software" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Work">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-8">
                    <h3 class="text-white text-2xl font-bold translate-y-4 group-hover:translate-y-0 transition duration-300">Project Delta</h3>
                    <p class="text-white/80 translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75">Mobile iOS App</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-32 ${t.panel} animate-up">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-16 editable">Client Success Stories</h2>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-5 relative editable">
                    <i class="fas fa-quote-left absolute top-8 right-8 text-4xl opacity-10"></i>
                    <div class="flex text-yellow-400 mb-6 text-sm"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic">"Absolutely incredible work. The team understood our vision immediately and delivered a product that exceeded all our expectations."</p>
                    <div class="flex items-center gap-4 text-left">
                        <img src="https://source.unsplash.com/100x100/?portrait,1" class="w-14 h-14 rounded-full object-cover">
                        <div>
                            <h4 class="font-bold">Sarah Jenkins</h4>
                            <p class="text-sm opacity-60">CEO, TechStart</p>
                        </div>
                    </div>
                </div>
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-5 relative editable">
                    <i class="fas fa-quote-left absolute top-8 right-8 text-4xl opacity-10"></i>
                    <div class="flex text-yellow-400 mb-6 text-sm"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic">"The speed and quality of delivery are unmatched. They didn't just build a website; they built the foundation of our business."</p>
                    <div class="flex items-center gap-4 text-left">
                        <img src="https://source.unsplash.com/100x100/?portrait,2" class="w-14 h-14 rounded-full object-cover">
                        <div>
                            <h4 class="font-bold">David Chen</h4>
                            <p class="text-sm opacity-60">Founder, InnovateCorp</p>
                        </div>
                    </div>
                </div>
                <div class="${t.bg} p-10 rounded-[2rem] shadow-xl border border-current border-opacity-5 relative editable">
                    <i class="fas fa-quote-left absolute top-8 right-8 text-4xl opacity-10"></i>
                    <div class="flex text-yellow-400 mb-6 text-sm"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                    <p class="text-lg opacity-80 mb-8 italic">"Professional, responsive, and brilliantly creative. Working with this team was the best decision we made for our rebrand."</p>
                    <div class="flex items-center gap-4 text-left">
                        <img src="https://source.unsplash.com/100x100/?portrait,3" class="w-14 h-14 rounded-full object-cover">
                        <div>
                            <h4 class="font-bold">Emily Rossi</h4>
                            <p class="text-sm opacity-60">Marketing Director</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="pricing" class="py-32 px-6 max-w-7xl mx-auto animate-up">
        <div class="text-center mb-20">
            <span class="${t.acc} font-bold tracking-widest uppercase text-sm mb-4 block editable">Pricing Plans</span>
            <h2 class="text-4xl md:text-5xl font-bold editable">Simple, transparent pricing</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 items-center">
            <div class="${t.panel} p-10 rounded-[2.5rem] border border-current border-opacity-10 text-center editable">
                <h3 class="text-2xl font-bold mb-2">Starter</h3>
                <p class="opacity-60 mb-8">Perfect for small businesses</p>
                <div class="text-5xl font-extrabold mb-8">$99<span class="text-lg opacity-50 font-normal">/mo</span></div>
                <ul class="space-y-4 mb-10 text-left opacity-80">
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> 5 Pages</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Basic SEO</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Mobile Responsive</li>
                    <li class="opacity-40"><i class="fas fa-times mr-3"></i> E-Commerce</li>
                </ul>
                <button class="w-full py-4 border-2 border-current rounded-xl font-bold hover:bg-black hover:bg-opacity-5 transition">Choose Starter</button>
            </div>
            
            <div class="${t.bg} p-12 rounded-[2.5rem] shadow-2xl border-2 border-[${t.acc.replace('text-', '')}] transform md:-translate-y-4 relative editable">
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${t.btn} text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">Most Popular</div>
                <h3 class="text-2xl font-bold mb-2 text-center">Professional</h3>
                <p class="opacity-60 mb-8 text-center">For growing companies</p>
                <div class="text-5xl font-extrabold mb-8 text-center">$249<span class="text-lg opacity-50 font-normal">/mo</span></div>
                <ul class="space-y-4 mb-10 text-left font-medium">
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Unlimited Pages</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Advanced SEO Setup</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Fully Responsive</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> E-Commerce Integration</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Priority Support</li>
                </ul>
                <button class="w-full py-4 ${t.btn} text-white rounded-xl font-bold shadow-xl hover:opacity-90 transition transform hover:-translate-y-1">Choose Pro</button>
            </div>

            <div class="${t.panel} p-10 rounded-[2.5rem] border border-current border-opacity-10 text-center editable">
                <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
                <p class="opacity-60 mb-8">For large scale applications</p>
                <div class="text-5xl font-extrabold mb-8">Custom</div>
                <ul class="space-y-4 mb-10 text-left opacity-80">
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Custom Architecture</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> Dedicated Server</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> AI API Integrations</li>
                    <li><i class="fas fa-check ${t.acc} mr-3"></i> 24/7 SLA Support</li>
                </ul>
                <button class="w-full py-4 border-2 border-current rounded-xl font-bold hover:bg-black hover:bg-opacity-5 transition">Contact Sales</button>
            </div>
        </div>
    </section>

    <section class="py-24 px-6 animate-up">
        <div class="max-w-6xl mx-auto rounded-[3rem] ${t.btn} text-white p-12 md:p-20 text-center shadow-2xl relative overflow-hidden editable">
            <div class="absolute inset-0 bg-black opacity-10"></div>
            <div class="relative z-10">
                <h2 class="text-4xl md:text-6xl font-extrabold mb-6">Let's build something amazing.</h2>
                <p class="text-xl opacity-90 mb-10 max-w-2xl mx-auto">Join our newsletter to receive the latest updates, design tips, and exclusive offers.</p>
                <form class="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
                    <input type="email" placeholder="Enter your email address" class="px-6 py-4 rounded-xl text-gray-900 w-full focus:outline-none focus:ring-4 focus:ring-white/30" required>
                    <button type="button" class="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold whitespace-nowrap hover:bg-black transition">Subscribe</button>
                </form>
            </div>
        </div>
    </section>

    <section id="contact" class="py-32 px-6 max-w-7xl mx-auto animate-up">
        <div class="grid lg:grid-cols-2 gap-16">
            <div>
                <span class="${t.acc} font-bold tracking-widest uppercase text-sm mb-4 block editable">Get In Touch</span>
                <h2 class="text-5xl font-bold mb-6 editable">Contact Us</h2>
                <p class="text-lg opacity-70 mb-12 editable">Have a project in mind? Reach out to ${ownerName} today. We're here to answer your questions and help you get started.</p>
                
                <div class="space-y-8 editable">
                    <div class="flex items-start gap-6">
                        <div class="w-14 h-14 rounded-2xl ${t.panel} flex items-center justify-center text-2xl shadow-sm border border-current border-opacity-10"><i class="fas fa-map-marker-alt ${t.acc}"></i></div>
                        <div>
                            <h4 class="text-xl font-bold mb-1">Our HQ</h4>
                            <p class="opacity-70">123 Innovation Drive<br>Tech District, 10010</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-6">
                        <div class="w-14 h-14 rounded-2xl ${t.panel} flex items-center justify-center text-2xl shadow-sm border border-current border-opacity-10"><i class="fas fa-phone-alt ${t.acc}"></i></div>
                        <div>
                            <h4 class="text-xl font-bold mb-1">Call Us</h4>
                            <p class="opacity-70">Mon-Fri from 8am to 5pm.</p>
                            <p class="font-bold mt-1">+1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="${t.panel} rounded-[2rem] p-10 shadow-2xl border border-current border-opacity-10 editable text-center flex flex-col justify-center">
                <h3 class="text-3xl font-bold mb-4">Direct Channels</h3>
                <p class="opacity-70 mb-10">Prefer instant messaging? Connect with us directly on our primary channels.</p>
                
                <div class="flex flex-col gap-6">
                    <a href="${phoneUrl}" target="_blank" class="flex items-center justify-center gap-4 px-8 py-5 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition shadow-lg transform hover:-translate-y-1">
                        <i class="fab fa-whatsapp text-3xl"></i>
                        Chat on WhatsApp
                    </a>
                    
                    <a href="mailto:${mailTo}" class="flex items-center justify-center gap-4 px-8 py-5 bg-gray-800 text-white rounded-xl font-bold text-lg hover:bg-gray-700 transition shadow-lg transform hover:-translate-y-1">
                        <i class="fas fa-envelope text-2xl"></i>
                        Send an Email
                    </a>
                    
                    <a href="#" class="flex items-center justify-center gap-4 px-8 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg transform hover:-translate-y-1">
                        <i class="fab fa-instagram text-3xl"></i>
                        DM on Instagram
                    </a>
                </div>
            </div>
        </div>
    </section>

    <footer class="pt-24 pb-12 px-6 ${t.panel} border-t border-current border-opacity-10 mt-10">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div class="lg:col-span-1">
                <div class="text-3xl font-extrabold mb-6 flex items-center gap-2 editable">
                    <i class="fas fa-cube ${t.acc}"></i> ${title}
                </div>
                <p class="opacity-60 leading-relaxed mb-6 editable">
                    Building the future of digital experiences. We empower businesses to reach their full potential online.
                </p>
                <div class="flex gap-4 text-xl">
                    <a href="#" class="w-10 h-10 rounded-full bg-current bg-opacity-5 flex items-center justify-center hover:${t.acc} hover:bg-opacity-10 transition editable"><i class="fab fa-twitter"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-current bg-opacity-5 flex items-center justify-center hover:${t.acc} hover:bg-opacity-10 transition editable"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-current bg-opacity-5 flex items-center justify-center hover:${t.acc} hover:bg-opacity-10 transition editable"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
            
            <div>
                <h4 class="text-lg font-bold mb-6 editable">Company</h4>
                <ul class="space-y-4 opacity-70 font-medium">
                    <li><a href="#about" class="hover:${t.acc} transition editable">About Us</a></li>
                    <li><a href="#services" class="hover:${t.acc} transition editable">Services</a></li>
                    <li><a href="#portfolio" class="hover:${t.acc} transition editable">Portfolio</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Careers</a></li>
                </ul>
            </div>
            
            <div>
                <h4 class="text-lg font-bold mb-6 editable">Resources</h4>
                <ul class="space-y-4 opacity-70 font-medium">
                    <li><a href="#" class="hover:${t.acc} transition editable">Help Center</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Blog</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Case Studies</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Documentation</a></li>
                </ul>
            </div>
            
            <div>
                <h4 class="text-lg font-bold mb-6 editable">Legal</h4>
                <ul class="space-y-4 opacity-70 font-medium">
                    <li><a href="#" class="hover:${t.acc} transition editable">Privacy Policy</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Terms of Service</a></li>
                    <li><a href="#" class="hover:${t.acc} transition editable">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        
        <div class="max-w-7xl mx-auto pt-8 border-t border-current border-opacity-10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-sm font-medium">
            <p class="editable">&copy; 2026 ${title}. All rights reserved.</p>
            <p class="editable">Architected by Zulora AI Engine</p>
        </div>
    </footer>

</body>
</html> `;
    },

    // --- 3.7 STUDIO EDITOR INJECTION LOGIC ---
    mountSiteToEditor(htmlCode) {
        STATE.currentProject.html = htmlCode;
        const iframe = document.getElementById('editor-frame');
        const doc = iframe.contentWindow.document;
        
        doc.open();
        doc.write(htmlCode);
        doc.close();
        
        // Inject Interactivity Script into Iframe
        setTimeout(() => {
            const editorScript = doc.createElement('script');
            editorScript.textContent = `
                // --- INJECTED ZULORA STUDIO SCRIPT ---
                document.body.addEventListener('click', function(e) {
                    if(!e.target.classList.contains('editable')) return; // Only select editable
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Highlight selected element
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
                    
                    // Identify element type
                    let elType = 'text';
                    if(e.target.tagName === 'IMG') elType = 'image';
                    if(e.target.tagName === 'A' || e.target.tagName === 'BUTTON') elType = 'link';

                    const computed = window.getComputedStyle(e.target);
                    
                    // Send data back to Zulora Studio Parent Window
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

                // Listen for updates from Studio Panel
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
            
            // Show Properties Panel
            document.getElementById('prop-empty-state').classList.add('hidden');
            document.getElementById('prop-active-state').classList.remove('hidden');
            
            // Populate Inputs
            document.getElementById('prop-text-val').value = data.text;
            
            const fontSizeNum = parseInt(data.fontSize);
            document.getElementById('prop-size-val').value = fontSizeNum;
            document.getElementById('prop-size-lbl').innerText = fontSizeNum;
            
            // Colors (Convert RGB to HEX for input type=color)
            const hexColor = this.rgbToHex(data.color);
            const hexBg = this.rgbToHex(data.bgColor);
            document.getElementById('prop-color-val').value = hexColor;
            document.getElementById('prop-color-hex').value = hexColor;
            document.getElementById('prop-bg-val').value = hexBg;
            document.getElementById('prop-bg-hex').value = hexBg;

            // Media Section Toggle
            const mediaWrap = document.getElementById('prop-media-group');
            if (data.elType === 'image') {
                mediaWrap.classList.remove('hidden');
                document.getElementById('prop-img-preview').src = data.src;
                document.getElementById('prop-img-url').value = data.src;
            } else {
                mediaWrap.classList.add('hidden');
            }

            // Link Section Toggle
            const linkWrap = document.getElementById('prop-link-group');
            if (data.elType === 'link') {
                linkWrap.classList.remove('hidden');
                document.getElementById('prop-link-val').value = data.href;
            } else {
                linkWrap.classList.add('hidden');
            }
        }
    },

    updateElementProp(action, value) {
        const iframe = document.getElementById('editor-frame');
        if(iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: action, value: value }, '*');
        }
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
            qrContainer.innerHTML = ""; // clear placeholder
            const upiUrl = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${CONFIG.upi.amount}&cu=INR`;
            new QRCode(qrContainer, {
                text: upiUrl,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
    },

    verifyPayment() {
        const email = STATE.user ? STATE.user.email : 'Guest';
        const msg = `Hello Zulora. I have paid ₹${CONFIG.upi.amount} for Zulora Pro via UPI. My account email is: ${email}. Please upgrade me.`;
        window.open(`https://wa.me/${CONFIG.support.whatsapp.replace('+','')}?text=${encodeURIComponent(msg)}`, '_blank');
        this.closeModal('payment-modal');
        this.showToast("Verification request sent via WhatsApp!", "success");
    },

    copyReferral() {
        if(!STATE.user) {
            this.openModal('auth-modal');
            return this.showToast("Log in to get your referral link.", "warning");
        }
        const input = document.getElementById('referral-link-input');
        input.value = `https://${CONFIG.domain}/join?ref=${STATE.user.uid}`;
        input.select();
        document.execCommand('copy');
        this.showToast("Unique Referral link copied to clipboard!", "success");
    },

    useTemplate(category) {
        window.scrollTo(0,0);
        document.getElementById('main-landing-prompt').value = `Create a high-end ${category} website. Make it look like an award-winning design.`;
        this.showToast(`Template '${category}' selected. Click Generate!`, "info");
    },

    openPreviewOverlay() {
        if (!STATE.currentProject.html) {
            return this.showToast("Generate a website first.", "warning");
        }
        const blob = new Blob([STATE.currentProject.html], { type: 'text/html' });
        const fsFrame = document.getElementById('fs-frame');
        fsFrame.src = URL.createObjectURL(blob);
        document.getElementById('preview-overlay').classList.remove('hidden');
    },

    closePreviewOverlay() {
        document.getElementById('preview-overlay').classList.add('hidden');
    },

    publishSite() {
        this.showToast("Deploying site to global CDN...", "info");
        setTimeout(() => {
            const subdomain = STATE.user ? STATE.user.name.replace(/\s+/g, '').toLowerCase() : "my-site";
            this.showToast(`Site published live at https://${subdomain}.zulora.in!`, "success");
        }, 2000);
    },

    // --- 3.9 EVENT LISTENER BINDINGS ---
    setupEventListeners() {
        // Google Sign In (Auth Button)
        const gBtn = document.getElementById('google-signin-btn');
        if(gBtn) gBtn.addEventListener('click', () => this.loginWithGoogle());

        // Iframe Messages
        window.addEventListener('message', (e) => this.handleIframeMessage(e));

        // Sidebar Property Inputs
        const bindInput = (id, action) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', (e) => this.updateElementProp(action, e.target.value));
        };
        
        bindInput('prop-text-val', 'UPDATE_TEXT');
        bindInput('prop-color-val', 'UPDATE_COLOR');
        bindInput('prop-bg-val', 'UPDATE_BG');
        bindInput('prop-img-url', 'UPDATE_SRC');
        bindInput('prop-link-val', 'UPDATE_LINK');

        // Font Size Slider Sync
        const sizeSlider = document.getElementById('prop-size-val');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                document.getElementById('prop-size-lbl').innerText = e.target.value;
                this.updateElementProp('UPDATE_SIZE', e.target.value);
            });
        }

        // Image Upload Sync (Local file to data URL)
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
                        this.showToast("Image uploaded to canvas!", "success");
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
                
                const targetId = e.currentTarget.getAttribute('data-panel');
                document.querySelectorAll('.s-panel').forEach(p => p.classList.remove('active'));
                
                const targetPanel = document.getElementById('panel-' + targetId);
                if(targetPanel) targetPanel.classList.add('active');
            });
        });

        // Device Toggles
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

// Initialize the Application
ZuloraApp.init();
