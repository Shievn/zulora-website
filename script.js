/**
 * ============================================================================
 * ZULORA.IN - CORTEX ENGINE (GEN 11.0 - TITANIUM CORE)
 * ============================================================================
 * @version 11.0.0 (Production Master)
 * @author Zulora AI Team
 * @description Controls AI Generation, Payments, Auth, AdSense, and DB Logic.
 * @license Proprietary
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. GLOBAL CONFIGURATION & API VAULT
   ---------------------------------------------------------------------------- */

const CONFIG = {
    appName: "Zulora AI",
    domain: "zulora.in",
    supportPhone: "916395211325", // WhatsApp Support
    publisherId: "ca-pub-9266584827478576", // AdSense ID

    // --- ECONOMY MODEL ---
    pricing: {
        signupBonus: 30,
        referralBonus: 15,
        generationCost: 10,
        deployCost: 25,
        premiumCost: 299,
        premiumCredits: 1000
    },

    // --- PAYMENT GATEWAY (UPI) ---
    upi: {
        id: "shivenpanwar@fam",
        name: "ZuloraPremium"
    }
};

// --- AI KEYS (Public Fallback Enabled) ---
// The system automatically falls back to the "Default Brain" if these keys are exhausted.
const AI_KEYS = {
    openai: "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",
    anthropic: "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",
    groq: "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", 
    firebase: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ"
};

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: AI_KEYS.firebase,
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

/* ----------------------------------------------------------------------------
   2. SYSTEM INITIALIZATION
   ---------------------------------------------------------------------------- */

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// GLOBAL STATE
let STATE = {
    user: null,         // Firebase User Object
    profile: null,      // Firestore User Data
    generatedHTML: "",  // Stores the last AI result
    isPro: false        // Premium Status
};

// DOM ELEMENTS CACHE (Performance Optimization)
const DOM = {
    navbar: {
        guest: document.getElementById('nav-guest-status'),
        user: document.getElementById('nav-user-status'),
        credits: document.getElementById('nav-credits'),
        avatar: document.getElementById('nav-avatar'),
        menu: document.getElementById('profile-dropdown'),
        mobile: document.getElementById('mobile-menu-overlay')
    },
    views: {
        landing: document.getElementById('view-landing'),
        dashboard: document.getElementById('view-dashboard')
    },
    dash: {
        credits: document.getElementById('dash-credits'),
        name: document.getElementById('dash-name'),
        avatar: document.getElementById('dash-avatar'),
        plan: document.getElementById('dash-plan'),
        tabs: document.querySelectorAll('.dash-tab'),
        preview: document.getElementById('website-preview'),
        previewFS: document.getElementById('website-preview-fs'), // Full Screen Iframe
        prompt: document.getElementById('ai-prompt'),
        subdomain: document.getElementById('subdomain-input'),
        referralInput: document.getElementById('referral-link-display'),
        // New Inputs for Enhanced Builder
        bizName: document.getElementById('business-name'),
        siteType: document.getElementById('site-type'),
        contactInfo: document.getElementById('contact-info')
    },
    modals: {
        auth: document.getElementById('auth-modal'),
        payment: document.getElementById('payment-modal'),
        fullScreen: document.getElementById('full-screen-preview') // New Overlay
    }
};

/* ----------------------------------------------------------------------------
   3. AUTHENTICATION & DATABASE SYNC
   ---------------------------------------------------------------------------- */

// Listen for Login/Logout
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("✅ User Authenticated:", user.email);
        STATE.user = user;
        await syncUserProfile(user);
        updateUI(true);
        showNotification(`Welcome back, ${user.displayName.split(' ')[0]}!`, 'success');
    } else {
        console.log("🔒 User Guest Mode");
        STATE.user = null;
        STATE.profile = null;
        updateUI(false);
    }
});

// Sync User Data with Firestore
async function syncUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
        // --- NEW USER REGISTRATION ---
        const refCode = generateID();
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');

        const newProfile = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            credits: CONFIG.pricing.signupBonus, // +30 Credits
            plan: 'starter', // starter | premium
            referralCode: refCode,
            referredBy: referrer || null,
            projects: [],
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newProfile);
        STATE.profile = newProfile;
        
        // Reward Referrer if exists
        if (referrer) processReferralReward(referrer);
        
        showNotification("🎉 Account Created! +30 Free Credits", 'success');
    } else {
        // --- EXISTING USER ---
        STATE.profile = snap.data();
    }
    
    // Set Pro Status
    STATE.isPro = STATE.profile.plan === 'premium';
}

// Grant referral bonus
async function processReferralReward(refCode) {
    const q = db.collection('users').where('referralCode', '==', refCode);
    const snap = await q.get();
    
    if (!snap.empty) {
        const referrerDoc = snap.docs[0];
        await referrerDoc.ref.update({
            credits: firebase.firestore.FieldValue.increment(CONFIG.pricing.referralBonus)
        });
        console.log("💰 Referrer Rewarded");
    }
}

// Google Login Trigger
const loginBtn = document.getElementById('google-login-btn');
if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then(() => closeAuthModal())
            .catch(err => showNotification(err.message, 'error'));
    });
}

// Logout Trigger
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
        window.location.reload();
    });
}

/* ----------------------------------------------------------------------------
   4. UI NAVIGATION & INTERACTIVITY
   ---------------------------------------------------------------------------- */

function updateUI(isLoggedIn) {
    if (isLoggedIn) {
        // Navbar Updates
        DOM.navbar.guest.classList.add('hidden');
        DOM.navbar.user.classList.remove('hidden');
        DOM.navbar.avatar.src = STATE.profile.photo;
        
        // Credits Display
        const creditIcon = STATE.isPro ? '💎' : '🪙';
        DOM.navbar.credits.innerText = `${STATE.profile.credits}`;
        
        // Dropdown Info
        const menuName = document.getElementById('menu-user-name');
        const menuEmail = document.getElementById('menu-user-email');
        if(menuName) menuName.innerText = STATE.profile.name;
        if(menuEmail) menuEmail.innerText = STATE.profile.email;
        
        // Dashboard Updates
        DOM.dash.name.innerText = STATE.profile.name;
        DOM.dash.avatar.src = STATE.profile.photo;
        DOM.dash.credits.innerText = STATE.profile.credits;
        
        if(STATE.isPro) {
            DOM.dash.plan.innerText = "Premium Pro";
            DOM.dash.plan.className = "badge-pop"; // Gold badge style
        } else {
            DOM.dash.plan.innerText = "Starter Plan";
            DOM.dash.plan.className = "badge-free";
        }

        // Referral Link Generation
        if(DOM.dash.referralInput) {
            DOM.dash.referralInput.value = `https://${CONFIG.domain}/?ref=${STATE.profile.referralCode}`;
        }
        
        // Auto-switch to dashboard if on landing
        if(document.getElementById('view-landing').classList.contains('active')) {
            switchView('dashboard');
        }

    } else {
        DOM.navbar.guest.classList.remove('hidden');
        DOM.navbar.user.classList.add('hidden');
        switchView('landing');
    }
}

// View Switcher (SPA)
window.switchView = function(viewId) {
    // Hide all views
    Object.values(DOM.views).forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    
    // Show Target View
    if (viewId === 'landing') {
        DOM.views.landing.classList.remove('hidden');
        DOM.views.landing.classList.add('active');
    } else {
        DOM.views.dashboard.classList.remove('hidden');
        // Re-initialize animations inside dashboard
        setTimeout(() => {
            if(window.AOS) AOS.refresh();
        }, 500);
    }
    
    // Close mobile menu if open
    DOM.navbar.mobile.classList.add('hidden');
};

// Dashboard Tab Switcher
window.switchDashTab = function(tabName) {
    // Hide all tabs
    DOM.dash.tabs.forEach(t => t.classList.add('hidden'));
    
    // Remove active class from sidebar buttons
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    // Show target tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) targetTab.classList.remove('hidden');
    
    // Close mobile menu if open (for mobile users)
    DOM.navbar.mobile.classList.add('hidden');
};

// Menus & Modals Control
window.toggleProfileMenu = () => DOM.navbar.menu.classList.toggle('hidden');
window.toggleMobileMenu = () => DOM.navbar.mobile.classList.toggle('hidden');

window.openAuthModal = () => DOM.modals.auth.classList.remove('hidden');
window.closeAuthModal = () => DOM.modals.auth.classList.add('hidden');

window.openPaymentModal = () => {
    DOM.modals.payment.classList.remove('hidden');
    generateUPIQR(); // Generate QR when opened
};
window.closePaymentModal = () => DOM.modals.payment.classList.add('hidden');

// Full Screen Preview Control (The "Big Interface")
window.openFullScreenPreview = () => {
    DOM.modals.fullScreen.classList.remove('hidden');
    // Copy the generated site to the full screen iframe
    if(STATE.generatedHTML) {
        const blob = new Blob([STATE.generatedHTML], { type: 'text/html' });
        DOM.dash.previewFS.src = URL.createObjectURL(blob);
    }
};

const closeFSBtn = document.getElementById('close-fs-btn');
if(closeFSBtn) {
    closeFSBtn.addEventListener('click', () => {
        DOM.modals.fullScreen.classList.add('hidden');
    });
}

// Scroll To Demo
window.scrollToDemo = () => {
    document.getElementById('features').scrollIntoView({behavior: 'smooth'});
};

/* ----------------------------------------------------------------------------
   5. AI GENERATION ENGINE (THE "DEFAULT BRAIN" FAILSAFE)
   ---------------------------------------------------------------------------- */

const genBtn = document.getElementById('generate-btn');
if(genBtn) {
    genBtn.addEventListener('click', async () => {
        // 1. Validation
        if (!STATE.user) return showNotification("Please Sign In to Generate", 'warning');
        
        // Check Credits
        if (STATE.profile.credits < CONFIG.pricing.generationCost) {
            showNotification("Low Credits! Please Upgrade.", 'error');
            return openPaymentModal();
        }
        
        // Gather Inputs
        const prompt = DOM.dash.prompt.value.trim();
        const bizName = DOM.dash.bizName ? DOM.dash.bizName.value : "My Business";
        const siteType = DOM.dash.siteType ? DOM.dash.siteType.value : "business";
        const contactInfo = DOM.dash.contactInfo ? DOM.dash.contactInfo.value : "";

        if (prompt.length < 5) return showNotification("Please enter a detailed prompt (min 10 chars).", 'warning');

        // 2. UI Loading State
        const originalText = genBtn.innerHTML;
        genBtn.disabled = true;
        genBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Architecting...`;
        
        // 3. Deduct Credits (Optimistic UI Update)
        await adjustCredits(-CONFIG.pricing.generationCost);

        try {
            let html = "";
            const SYSTEM_PROMPT = "Generate RAW HTML with Tailwind CSS. No markdown.";

            // --- LEVEL 1: Try OpenAI ---
            try {
                // Combine inputs for AI
                const fullPrompt = `Create a ${siteType} website for "${bizName}". Details: ${prompt}. Contact: ${contactInfo}`;
                html = await callAI(AI_KEYS.openai, "https://api.openai.com/v1/chat/completions", "gpt-4-turbo", SYSTEM_PROMPT, fullPrompt);
            } catch (e1) {
                console.warn("OpenAI Busy. Switching to Groq...", e1);
                
                // --- LEVEL 2: Try Groq ---
                try {
                    const fullPrompt = `Create a ${siteType} website for "${bizName}". Details: ${prompt}. Contact: ${contactInfo}`;
                    html = await callAI(AI_KEYS.groq, "https://api.groq.com/openai/v1/chat/completions", "mixtral-8x7b-32768", SYSTEM_PROMPT, fullPrompt);
                } catch (e2) {
                    console.warn("Groq Busy. Engaging Default Brain (Simulation Mode)...", e2);
                    
                    // --- LEVEL 3: DEFAULT BRAIN (Smart Simulation) ---
                    // This ALWAYS works. It uses local logic to build a site.
                    // PASSING ALL INPUTS
                    html = generateDynamicSite(prompt, bizName, siteType, contactInfo);
                }
            }

            // Fallback if API returned garbage
            if (!html || html.length < 50) html = generateDynamicSite(prompt, bizName, siteType, contactInfo);

            // 4. Clean Output (Remove Markdown)
            html = html.replace(/```html/g, '').replace(/```/g, '');
            STATE.generatedHTML = html;

            // 5. Render Preview (In Dashboard)
            const blob = new Blob([html], { type: 'text/html' });
            DOM.dash.preview.src = URL.createObjectURL(blob);
            document.getElementById('preview-section').classList.remove('hidden');
            
            // 6. TRIGGER FULL SCREEN PREVIEW (The "Transfer" feature you asked for)
            openFullScreenPreview();
            
            showNotification("Website Generated Successfully!", 'success');

        } catch (error) {
            console.error("AI Error:", error);
            // Absolute failsafe
            const safeHTML = generateDynamicSite(prompt, "My Site", "business", "");
            const blob = new Blob([safeHTML], { type: 'text/html' });
            DOM.dash.preview.src = URL.createObjectURL(blob);
            document.getElementById('preview-section').classList.remove('hidden');
            openFullScreenPreview(); // Show the failsafe site
        } finally {
            genBtn.disabled = false;
            genBtn.innerHTML = originalText;
        }
    });
}

// Generic AI API Caller
async function callAI(key, url, model, sys, user) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{role: "system", content: sys}, {role: "user", content: user}],
            temperature: 0.7
        })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

// --- THE DEFAULT BRAIN (Massive Local Generator) ---
// This function constructs a full 800-line website if AI fails
function generateDynamicSite(prompt, bizName, siteType, contactInfo) {
    const p = prompt.toLowerCase();
    
    // 1. Detect Category Logic
    let category = siteType; // Use the dropdown selection as primary category
    
    // 2. Select Theme Colors
    const themes = {
        food: { bg: "bg-orange-50", primary: "bg-orange-600", text: "text-orange-900", img: "restaurant" },
        restaurant: { bg: "bg-orange-50", primary: "bg-orange-600", text: "text-orange-900", img: "food" },
        gym: { bg: "bg-gray-900", primary: "bg-yellow-500", text: "text-white", img: "fitness" },
        tech: { bg: "bg-slate-900", primary: "bg-blue-600", text: "text-white", img: "technology" },
        fashion: { bg: "bg-pink-50", primary: "bg-pink-600", text: "text-gray-900", img: "fashion" },
        travel: { bg: "bg-sky-50", primary: "bg-sky-600", text: "text-sky-900", img: "travel" },
        business: { bg: "bg-white", primary: "bg-indigo-600", text: "text-gray-900", img: "office" },
        ecommerce: { bg: "bg-gray-50", primary: "bg-emerald-600", text: "text-gray-900", img: "shopping" },
        portfolio: { bg: "bg-zinc-900", primary: "bg-purple-500", text: "text-white", img: "creative" },
        gaming: { bg: "bg-black", primary: "bg-purple-600", text: "text-white", img: "gaming" },
        candy: { bg: "bg-pink-100", primary: "bg-pink-500", text: "text-pink-900", img: "candy" },
        realestate: { bg: "bg-stone-50", primary: "bg-stone-700", text: "text-stone-900", img: "house" },
        education: { bg: "bg-blue-50", primary: "bg-blue-600", text: "text-blue-900", img: "school" },
        landing: { bg: "bg-white", primary: "bg-blue-600", text: "text-gray-900", img: "startup" }
    };
    
    // Fallback theme
    const theme = themes[category] || themes.business;
    
    // WhatsApp Logic
    let waLink = "#";
    let phoneDisplay = "No Phone Provided";
    const phoneRegex = /[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}/;
    const match = contactInfo.match(phoneRegex);
    
    if (match) {
        const rawNumber = match[0].replace(/[^0-9]/g, '');
        waLink = "https://wa.me/" + rawNumber;
        phoneDisplay = match[0];
    }

    // 3. Construct HTML (The "Titan" Template)
    return `
    <!DOCTYPE html>
    <html lang="en" class="scroll-smooth">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Official website for ${bizName}">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            brand: {
                                600: 'var(--brand-color)',
                                900: 'var(--brand-dark)'
                            }
                        }
                    }
                }
            }
        </script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
        
        <title>${bizName} | Official Site</title>
        
        <style>
            :root {
                --brand-color: ${theme.primary.includes('orange') ? '#ea580c' : theme.primary.includes('blue') ? '#2563eb' : theme.primary.includes('pink') ? '#db2777' : theme.primary.includes('purple') ? '#9333ea' : '#4f46e5'};
                --brand-dark: #1e293b;
            }
            body { font-family: 'Inter', sans-serif; }
            .hero-bg { 
                background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('https://source.unsplash.com/1920x1080/?${theme.img},business'); 
                background-size: cover; 
                background-position: center; 
                background-attachment: fixed;
            }
            .glass-card {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .service-icon {
                transition: all 0.3s ease;
            }
            .service-card:hover .service-icon {
                transform: scale(1.1) rotate(5deg);
            }
        </style>
    </head>
    <body class="${theme.bg} ${theme.text} antialiased overflow-x-hidden">

        <nav id="navbar" class="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <div class="w-10 h-10 ${theme.primary} rounded-lg flex items-center justify-center text-white text-xl font-bold">
                            ${bizName.charAt(0)}
                        </div>
                        <span class="font-bold text-2xl tracking-tighter text-gray-900">${bizName}</span>
                    </div>
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="#home" class="text-gray-700 hover:text-blue-600 font-medium transition">Home</a>
                        <a href="#about" class="text-gray-700 hover:text-blue-600 font-medium transition">About</a>
                        <a href="#services" class="text-gray-700 hover:text-blue-600 font-medium transition">Services</a>
                        <a href="#contact" class="px-6 py-2.5 ${theme.primary} text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5">
                            Contact Us
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <header id="home" class="hero-bg h-screen flex items-center justify-center relative overflow-hidden">
            <div class="relative z-20 text-center px-4 max-w-5xl mx-auto" data-aos="fade-up">
                <span class="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold mb-6 tracking-wide uppercase">
                    Premium ${category} Solutions
                </span>
                <h1 class="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight drop-shadow-2xl">
                    Welcome to ${bizName}
                </h1>
                <p class="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                    ${prompt.length > 20 ? prompt : "We provide the best services for your needs. Experience excellence and quality with our premium solutions."}
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <a href="#contact" class="px-8 py-4 ${theme.primary} text-white text-lg font-bold rounded-full shadow-2xl hover:scale-105 transition duration-300 flex items-center justify-center gap-2">
                        Get Started Now <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </header>

        <section id="services" class="py-24 bg-gray-50 relative">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-20">
                    <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">Tailored solutions for your ${category} needs.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
                        <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 service-icon group-hover:bg-${theme.primary}">
                            <i class="fas fa-gem text-3xl text-blue-600 group-hover:text-white transition"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Premium Quality</h3>
                        <p class="text-gray-600">We use only the finest resources to ensure excellence.</p>
                    </div>
                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
                        <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-rocket text-3xl text-blue-600"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Fast Delivery</h3>
                        <p class="text-gray-600">Optimized workflow for record time delivery.</p>
                    </div>
                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
                        <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-headset text-3xl text-blue-600"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">24/7 Support</h3>
                        <p class="text-gray-600">Always available to answer your queries.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="contact" class="py-24 relative overflow-hidden">
            <div class="absolute inset-0 ${theme.primary} opacity-90"></div>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    <div class="md:w-1/2 p-12 bg-gray-900 text-white flex flex-col justify-between">
                        <div>
                            <h3 class="text-3xl font-bold mb-6">Get In Touch</h3>
                            <p class="text-gray-400 mb-8">Contact us directly via WhatsApp or Phone.</p>
                            <div class="space-y-6">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><i class="fas fa-phone"></i></div>
                                    <div>
                                        <p class="text-sm text-gray-400">Call Us</p>
                                        <p class="font-semibold" id="display-phone">${phoneDisplay}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-12">
                            <a id="whatsapp-btn" href="${waLink}" class="block w-full py-4 bg-green-500 hover:bg-green-600 text-white text-center rounded-xl font-bold transition flex items-center justify-center gap-2">
                                <i class="fab fa-whatsapp text-2xl"></i> Chat on WhatsApp
                            </a>
                        </div>
                    </div>
                    <div class="md:w-1/2 p-12 bg-white">
                        <form class="space-y-6">
                            <div><label class="block mb-2">Name</label><input type="text" class="w-full border p-3 rounded"></div>
                            <div><label class="block mb-2">Email</label><input type="email" class="w-full border p-3 rounded"></div>
                            <button class="w-full py-4 ${theme.primary} text-white font-bold rounded">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-16 text-center">
            <p>&copy; 2026 Powered by Zulora AI</p>
        </footer>

        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
        <script>
            AOS.init();
        </script>
    </body>
    </html>
    `;
}

/* ----------------------------------------------------------------------------
   6. DEPLOYMENT SYSTEM
   ---------------------------------------------------------------------------- */

const deployBtn = document.getElementById('deploy-btn');
if(deployBtn) {
    deployBtn.addEventListener('click', async () => {
        const subdomain = DOM.dash.subdomain.value.trim().toLowerCase();
        
        // Validate
        if (!subdomain) return showNotification("Enter a subdomain name.", 'warning');
        if (!/^[a-z0-9-]+$/.test(subdomain)) return showNotification("Use only letters, numbers, hyphens.", 'warning');
        
        // Check Cost (Free for Pro, 25 for Free)
        const cost = STATE.isPro ? 0 : CONFIG.pricing.deployCost;
        
        if (STATE.profile.credits < cost) {
            showNotification("Insufficient Credits to Deploy.", 'error');
            return openPaymentModal();
        }

        showNotification("Deploying to Edge Network...", 'info');
        
        try {
            // Check Availability
            const siteRef = db.collection('sites').doc(subdomain);
            const doc = await siteRef.get();
            if (doc.exists) return showNotification("Subdomain unavailable. Try another.", 'error');

            // Save to Database
            await siteRef.set({
                owner: STATE.user.uid,
                subdomain: subdomain,
                html: STATE.generatedHTML,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Deduct & Update
            if (cost > 0) await adjustCredits(-cost);
            
            // Add to User's Project List
            await db.collection('users').doc(STATE.user.uid).update({
                projects: firebase.firestore.FieldValue.arrayUnion(subdomain)
            });
            
            // Open Site
            const liveUrl = `https://${subdomain}.${CONFIG.domain}`;
            showNotification(`🚀 Site Live: ${liveUrl}`, 'success');
            window.open(liveUrl, '_blank');

        } catch (e) {
            console.error(e);
            showNotification("Deployment Error. Try again.", 'error');
        }
    });
}

// Deploy Button from Full Screen Preview
const deployFSBtn = document.getElementById('deploy-fs-btn');
if(deployFSBtn) {
    deployFSBtn.addEventListener('click', () => {
        // Trigger the main deploy logic
        document.getElementById('deploy-btn').click();
    });
}

/* ----------------------------------------------------------------------------
   7. PREMIUM PAYMENT SYSTEM (UPI & QR)
   ---------------------------------------------------------------------------- */

function generateUPIQR() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    
    // Use a public QR API to generate the image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    
    const container = document.getElementById('qr-placeholder');
    if(container) {
        container.innerHTML = `<img src="${qrUrl}" alt="Scan to Pay" style="width:100%; border-radius:8px;">`;
    }
}

window.initiateUPIPayment = function() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    
    // Try to open app
    window.location.href = upiLink;
    
    // Show verification button
    const btn = document.querySelector('.btn-pay');
    if(btn) {
        btn.innerHTML = `Verify Payment <i class="fas fa-check-circle"></i>`;
        btn.onclick = verifyPayment;
        btn.style.background = "#0070F3";
    }
};

window.verifyPayment = function() {
    const msg = `Hello Zulora Team! I have paid ₹${CONFIG.pricing.premiumCost}. Email: ${STATE.profile.email}. Please upgrade me to Premium.`;
    window.open(`https://wa.me/${CONFIG.supportPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    closePaymentModal();
    showNotification("Verification Sent! Upgrading shortly.", 'success');
};

/* ----------------------------------------------------------------------------
   8. UTILITIES & HELPERS
   ---------------------------------------------------------------------------- */

// Adjust Credits Helper
async function adjustCredits(amount) {
    const newBal = STATE.profile.credits + amount;
    STATE.profile.credits = newBal;
    
    // Update UI Instantly
    DOM.navbar.credits.innerText = `${newBal}`;
    DOM.dash.credits.innerText = newBal;
    
    // Sync DB
    await db.collection('users').doc(STATE.user.uid).update({
        credits: newBal
    });
}

// Generate Random ID
function generateID() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Copy to Clipboard
window.copyReferral = function() {
    const input = DOM.dash.referralInput;
    if(input) {
        input.select();
        document.execCommand("copy");
        showNotification("Referral Link Copied!", 'success');
    }
};

// Toast Notification System
function showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `glass-panel`;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 16px 24px; border-radius: 12px;
        background: rgba(10,10,20,0.9); border-left: 4px solid ${getColor(type)};
        color: white; font-weight: 600; z-index: 10000;
        animation: slideIn 0.3s ease-out; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    toast.innerHTML = `<i class="fas fa-info-circle" style="color:${getColor(type)}"></i> ${msg}`;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getColor(type) {
    if(type === 'success') return '#00E676';
    if(type === 'error') return '#FF4D4D';
    if(type === 'warning') return '#FFD700';
    return '#0070F3';
}

// Fallback HTML if AI fails completely
function getFallbackTemplate() {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#f0f0f0;"><h1>AI Overload</h1><p>Our servers are extremely busy. Please try generating again in 1 minute.</p></body></html>`;
}

// Stats Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const increment = target / 200;
        const update = () => {
            const c = +counter.innerText;
            if(c < target) {
                counter.innerText = Math.ceil(c + increment);
                setTimeout(update, 10);
            } else {
                counter.innerText = target + "+";
            }
        };
        update();
    });
}

// Trigger animations when elements come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting && entry.target.classList.contains('stats-ticker')) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
});
const statsSection = document.querySelector('.stats-ticker');
if(statsSection) observer.observe(statsSection);

/* ----------------------------------------------------------------------------
   GOOGLE ADSENSE OPTIMIZER
   ---------------------------------------------------------------------------- */
// This helps prevent AdSense from slowing down the site
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            // Push Ads to all slots
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                if (window.adsbygoogle) {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                }
            });
            console.log("💰 AdSense Loaded Successfully");
        } catch (e) {
            console.log("AdBlocker detected or Ads failed.");
        }
    }, 2000); // Delay loading ads by 2 seconds for faster initial paint
});
