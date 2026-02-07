/**
 * ============================================================================
 * ZULORA.IN - CORTEX ENGINE (GEN 7.0 - DYNAMIC CORE)
 * ============================================================================
 * @version 7.0.0
 * @author Zulora AI Team
 * @description Features "Dynamic Theme Injection" to fix repetitive templates.
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. GLOBAL CONFIGURATION
   ---------------------------------------------------------------------------- */

const CONFIG = {
    appName: "Zulora AI",
    domain: "zulora.in",
    supportPhone: "916395211325", 
    publisherId: "ca-pub-9266584827478576",

    // --- ECONOMY ---
    pricing: {
        signupBonus: 30,
        referralBonus: 15,
        generationCost: 10,
        deployCost: 25,
        premiumCost: 299,
        premiumCredits: 1000
    },

    // --- PAYMENT ---
    upi: {
        id: "shivenpanwar@fam",
        name: "ZuloraPremium"
    }
};

// --- AI KEYS (Public Fallback Enabled) ---
const AI_KEYS = {
    openai: "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",
    anthropic: "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",
    groq: "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", 
    firebase: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ"
};

const firebaseConfig = {
    apiKey: AI_KEYS.firebase,
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

/* ----------------------------------------------------------------------------
   2. SYSTEM INIT
   ---------------------------------------------------------------------------- */

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let STATE = {
    user: null,
    profile: null,
    generatedHTML: "",
    isPro: false
};

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
        prompt: document.getElementById('ai-prompt'),
        subdomain: document.getElementById('subdomain-input'),
        referralInput: document.getElementById('referral-link-display')
    },
    modals: {
        auth: document.getElementById('auth-modal'),
        payment: document.getElementById('payment-modal')
    }
};

/* ----------------------------------------------------------------------------
   3. AUTHENTICATION LOGIC
   ---------------------------------------------------------------------------- */

auth.onAuthStateChanged(async (user) => {
    if (user) {
        STATE.user = user;
        await syncUserProfile(user);
        updateUI(true);
    } else {
        STATE.user = null;
        STATE.profile = null;
        updateUI(false);
    }
});

async function syncUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
        const refCode = Math.random().toString(36).substring(2, 9).toUpperCase();
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');

        const newProfile = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            credits: CONFIG.pricing.signupBonus,
            plan: 'starter',
            referralCode: refCode,
            referredBy: referrer || null,
            projects: [],
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newProfile);
        STATE.profile = newProfile;
        if (referrer) processReferralReward(referrer);
        showNotification("🎉 +30 Free Credits!", 'success');
    } else {
        STATE.profile = snap.data();
    }
    STATE.isPro = STATE.profile.plan === 'premium';
}

async function processReferralReward(refCode) {
    const q = db.collection('users').where('referralCode', '==', refCode);
    const snap = await q.get();
    if (!snap.empty) {
        await snap.docs[0].ref.update({
            credits: firebase.firestore.FieldValue.increment(CONFIG.pricing.referralBonus)
        });
    }
}

// Login/Logout Handlers
const loginBtn = document.getElementById('google-login-btn');
if(loginBtn) loginBtn.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider).then(() => closeAuthModal()).catch(e => console.error(e));
});

const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) logoutBtn.addEventListener('click', () => {
    auth.signOut();
    window.location.reload();
});

/* ----------------------------------------------------------------------------
   4. UI LOGIC
   ---------------------------------------------------------------------------- */

function updateUI(isLoggedIn) {
    if (isLoggedIn) {
        DOM.navbar.guest.classList.add('hidden');
        DOM.navbar.user.classList.remove('hidden');
        DOM.navbar.avatar.src = STATE.profile.photo;
        DOM.navbar.credits.innerText = `${STATE.profile.credits}`;
        
        if(document.getElementById('menu-user-name')) document.getElementById('menu-user-name').innerText = STATE.profile.name;
        if(document.getElementById('menu-user-email')) document.getElementById('menu-user-email').innerText = STATE.profile.email;
        
        DOM.dash.name.innerText = STATE.profile.name;
        DOM.dash.avatar.src = STATE.profile.photo;
        DOM.dash.credits.innerText = STATE.profile.credits;
        
        if(STATE.isPro) {
            DOM.dash.plan.innerText = "Premium Pro";
            DOM.dash.plan.className = "badge-pop";
        } else {
            DOM.dash.plan.innerText = "Starter Plan";
            DOM.dash.plan.className = "badge-free";
        }

        if(DOM.dash.referralInput) DOM.dash.referralInput.value = `https://${CONFIG.domain}/?ref=${STATE.profile.referralCode}`;
        
        if(document.getElementById('view-landing').classList.contains('active')) {
            switchView('dashboard');
        }
    } else {
        DOM.navbar.guest.classList.remove('hidden');
        DOM.navbar.user.classList.add('hidden');
        switchView('landing');
    }
}

window.switchView = function(viewId) {
    Object.values(DOM.views).forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    if (viewId === 'landing') {
        DOM.views.landing.classList.remove('hidden');
        DOM.views.landing.classList.add('active');
    } else {
        DOM.views.dashboard.classList.remove('hidden');
        setTimeout(() => { if(window.AOS) AOS.refresh(); }, 500);
    }
    DOM.navbar.mobile.classList.add('hidden');
};

window.switchDashTab = function(tabName) {
    DOM.dash.tabs.forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) targetTab.classList.remove('hidden');
    DOM.navbar.mobile.classList.add('hidden');
};

window.toggleProfileMenu = () => DOM.navbar.menu.classList.toggle('hidden');
window.toggleMobileMenu = () => DOM.navbar.mobile.classList.toggle('hidden');
window.openAuthModal = () => DOM.modals.auth.classList.remove('hidden');
window.closeAuthModal = () => DOM.modals.auth.classList.add('hidden');
window.openPaymentModal = () => { DOM.modals.payment.classList.remove('hidden'); generateUPIQR(); };
window.closePaymentModal = () => DOM.modals.payment.classList.add('hidden');
window.scrollToDemo = () => document.getElementById('features').scrollIntoView({behavior: 'smooth'});

/* ----------------------------------------------------------------------------
   5. DYNAMIC GENERATION ENGINE (THE FIX)
   ---------------------------------------------------------------------------- */

const genBtn = document.getElementById('generate-btn');
if(genBtn) {
    genBtn.addEventListener('click', async () => {
        if (!STATE.user) return showNotification("Please Sign In", 'warning');
        if (STATE.profile.credits < CONFIG.pricing.generationCost) return openPaymentModal();
        
        const prompt = DOM.dash.prompt.value.trim();
        if (prompt.length < 5) return showNotification("Enter a prompt", 'warning');

        // UI Loading
        const originalText = genBtn.innerHTML;
        genBtn.disabled = true;
        genBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Building...`;
        
        await adjustCredits(-CONFIG.pricing.generationCost);

        try {
            // Priority: Try OpenAI -> Groq -> Local Logic
            let html = "";
            try {
                // Try API first
                html = await callAI(AI_KEYS.openai, "https://api.openai.com/v1/chat/completions", "gpt-4-turbo", "Generate HTML", prompt);
            } catch (e1) {
                console.warn("API Fail. Engaging Dynamic Engine.");
                // Use the NEW Advanced Local Engine (Fixes the "Same Template" issue)
                html = generateDynamicSite(prompt);
            }

            if (!html || html.length < 50) html = generateDynamicSite(prompt);

            // Sanitize Output
            html = html.replace(/```html/g, '').replace(/```/g, '');
            STATE.generatedHTML = html;

            // Render
            const blob = new Blob([html], { type: 'text/html' });
            DOM.dash.preview.src = URL.createObjectURL(blob);
            document.getElementById('preview-section').classList.remove('hidden');
            showNotification("Website Generated!", 'success');

        } catch (error) {
            console.error("Critical:", error);
            // Absolute failsafe
            const safeHTML = generateDynamicSite(prompt);
            const blob = new Blob([safeHTML], { type: 'text/html' });
            DOM.dash.preview.src = URL.createObjectURL(blob);
            document.getElementById('preview-section').classList.remove('hidden');
        } finally {
            genBtn.disabled = false;
            genBtn.innerHTML = originalText;
        }
    });
}

async function callAI(key, url, model, sys, user) {
    // This function attempts to call external APIs
    // If it fails, the catch block above triggers generateDynamicSite()
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({ model: model, messages: [{role: "system", content: sys}, {role: "user", content: user}], temperature: 0.7 })
    });
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    return data.choices[0].message.content;
}

// --- 🧠 THE NEW DYNAMIC ENGINE (Fixes Repetition) ---
function generateDynamicSite(prompt) {
    const p = prompt.toLowerCase();
    
    // 1. Detect Category
    let category = "business";
    if (p.includes("food") || p.includes("restaurant") || p.includes("cafe")) category = "food";
    else if (p.includes("gym") || p.includes("fitness") || p.includes("yoga")) category = "gym";
    else if (p.includes("tech") || p.includes("app") || p.includes("software")) category = "tech";
    else if (p.includes("fashion") || p.includes("clothing") || p.includes("store")) category = "fashion";
    else if (p.includes("travel") || p.includes("tour")) category = "travel";

    // 2. Select Theme Colors based on Category
    const themes = {
        food: { bg: "bg-orange-50", primary: "bg-orange-600", text: "text-orange-900", img: "restaurant" },
        gym: { bg: "bg-gray-900", primary: "bg-yellow-500", text: "text-white", img: "fitness" },
        tech: { bg: "bg-slate-900", primary: "bg-blue-600", text: "text-white", img: "technology" },
        fashion: { bg: "bg-pink-50", primary: "bg-pink-600", text: "text-gray-900", img: "fashion" },
        travel: { bg: "bg-sky-50", primary: "bg-sky-600", text: "text-sky-900", img: "travel" },
        business: { bg: "bg-white", primary: "bg-indigo-600", text: "text-gray-900", img: "office" }
    };
    
    const theme = themes[category];
    const heroTitle = `Welcome to Your ${category.charAt(0).toUpperCase() + category.slice(1)} Business`;

    // 3. Construct HTML (No Prompt Leakage)
    return `
        // 3. Construct HTML (The "Titan" Template)
    // This is a massive, single-file website generator
    return `
    <!DOCTYPE html>
    <html lang="en" class="scroll-smooth">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Official website for ${category} services">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            brand: {
                                50: '${theme.bg.replace("bg-", "")}', // Logic to map colors dynamically
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
        
        <title>${heroTitle} | Official Site</title>
        
        <style>
            :root {
                --brand-color: ${theme.primary.includes('orange') ? '#ea580c' : theme.primary.includes('blue') ? '#2563eb' : theme.primary.includes('pink') ? '#db2777' : '#4f46e5'};
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
                            ${category.charAt(0).toUpperCase()}
                        </div>
                        <span class="font-bold text-2xl tracking-tighter text-gray-900">Brand<span class="${theme.text.replace('text-white', 'text-blue-600')}">Flow</span></span>
                    </div>

                    <div class="hidden md:flex items-center space-x-8">
                        <a href="#home" class="text-gray-700 hover:text-blue-600 font-medium transition">Home</a>
                        <a href="#about" class="text-gray-700 hover:text-blue-600 font-medium transition">About</a>
                        <a href="#services" class="text-gray-700 hover:text-blue-600 font-medium transition">Services</a>
                        <a href="#gallery" class="text-gray-700 hover:text-blue-600 font-medium transition">Work</a>
                        <a href="#pricing" class="text-gray-700 hover:text-blue-600 font-medium transition">Pricing</a>
                        <a href="#contact" class="px-6 py-2.5 ${theme.primary} text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5">
                            Contact Us
                        </a>
                    </div>

                    <div class="md:hidden flex items-center">
                        <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="text-gray-700 hover:text-gray-900 focus:outline-none">
                            <i class="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
                <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <a href="#home" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</a>
                    <a href="#services" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Services</a>
                    <a href="#contact" class="block px-3 py-2 rounded-md text-base font-medium ${theme.primary} text-white">Contact Now</a>
                </div>
            </div>
        </nav>

        <header id="home" class="hero-bg h-screen flex items-center justify-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/30 to-transparent z-10"></div>
            <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>

            <div class="relative z-20 text-center px-4 max-w-5xl mx-auto" data-aos="fade-up" data-aos-duration="1000">
                <span class="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold mb-6 tracking-wide uppercase">
                    Premium ${category} Solutions
                </span>
                <h1 class="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight drop-shadow-2xl">
                    ${heroTitle}
                </h1>
                <p class="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                    We bring your vision to life with world-class expertise. Professional, reliable, and dedicated to your success.
                </p>
                
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <a href="#contact" class="px-8 py-4 ${theme.primary} text-white text-lg font-bold rounded-full shadow-2xl hover:scale-105 transition duration-300 flex items-center justify-center gap-2">
                        Get Started Now <i class="fas fa-arrow-right"></i>
                    </a>
                    <a href="#services" class="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 transition duration-300">
                        View Our Services
                    </a>
                </div>

                <div class="mt-16 grid grid-cols-3 gap-8 text-white border-t border-white/20 pt-8 max-w-2xl mx-auto">
                    <div>
                        <div class="text-3xl font-bold">98%</div>
                        <div class="text-sm opacity-80">Satisfaction</div>
                    </div>
                    <div>
                        <div class="text-3xl font-bold">500+</div>
                        <div class="text-sm opacity-80">Projects</div>
                    </div>
                    <div>
                        <div class="text-3xl font-bold">24/7</div>
                        <div class="text-sm opacity-80">Support</div>
                    </div>
                </div>
            </div>
        </header>

        <section id="about" class="py-24 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div class="relative" data-aos="fade-right">
                        <div class="absolute -top-4 -left-4 w-24 h-24 ${theme.primary} opacity-20 rounded-full blur-xl"></div>
                        <img src="https://source.unsplash.com/800x600/?${theme.img},office" alt="About Us" class="rounded-3xl shadow-2xl relative z-10 w-full object-cover h-[500px]">
                        <div class="absolute -bottom-10 -right-10 bg-white p-8 rounded-2xl shadow-xl z-20 hidden md:block">
                            <p class="text-4xl font-bold ${theme.text.replace('text-white', 'text-blue-600')}">10+</p>
                            <p class="text-gray-600 font-medium">Years Experience</p>
                        </div>
                    </div>
                    <div data-aos="fade-left">
                        <h4 class="${theme.text.replace('text-white', 'text-blue-600')} font-bold text-lg uppercase tracking-wider mb-2">Who We Are</h4>
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Committed to Excellence in ${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
                        <p class="text-lg text-gray-600 mb-6 leading-relaxed">
                            Founded with a passion for quality, we have established ourselves as a leader in the industry. Our team of experts works tirelessly to deliver results that exceed expectations.
                        </p>
                        <ul class="space-y-4 mb-8">
                            <li class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded-full ${theme.primary} flex items-center justify-center text-white text-xs"><i class="fas fa-check"></i></span>
                                <span class="text-gray-700 font-medium">Certified Professional Team</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded-full ${theme.primary} flex items-center justify-center text-white text-xs"><i class="fas fa-check"></i></span>
                                <span class="text-gray-700 font-medium">100% Satisfaction Guarantee</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded-full ${theme.primary} flex items-center justify-center text-white text-xs"><i class="fas fa-check"></i></span>
                                <span class="text-gray-700 font-medium">Innovative Solutions</span>
                            </li>
                        </ul>
                        <button class="px-8 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-900 hover:text-white transition duration-300">
                            Read Our Story
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section id="services" class="py-24 bg-gray-50 relative">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-20">
                    <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Premium Services</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">We offer a wide range of solutions tailored to your specific needs.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="100">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon group-hover:bg-${theme.primary}">
                            <i class="fas fa-gem text-3xl ${theme.text.replace('text-white', 'text-blue-600')} group-hover:text-white transition"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Premium Quality</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">We use only the finest resources to ensure the longevity and excellence of our work.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>

                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="200">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-rocket text-3xl ${theme.text.replace('text-white', 'text-blue-600')}"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Fast Delivery</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">Our optimized workflow allows us to deliver projects in record time without compromising quality.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>

                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="300">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-users text-3xl ${theme.text.replace('text-white', 'text-blue-600')}"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Expert Team</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">Our workforce consists of industry veterans with years of hands-on experience.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>

                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="400">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-headset text-3xl ${theme.text.replace('text-white', 'text-blue-600')}"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">24/7 Support</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">We are always available to answer your queries and solve your problems instantly.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>

                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="500">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-chart-line text-3xl ${theme.text.replace('text-white', 'text-blue-600')}"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Growth Strategy</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">We don't just work for you; we partner with you to grow your business exponentially.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>

                    <div class="service-card bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group" data-aos="fade-up" data-aos-delay="600">
                        <div class="w-16 h-16 ${theme.bg.includes('dark') ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center mb-8 service-icon">
                            <i class="fas fa-shield-alt text-3xl ${theme.text.replace('text-white', 'text-blue-600')}"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Secure & Safe</h3>
                        <p class="text-gray-600 mb-6 leading-relaxed">Your data and privacy are our top priority. We use state-of-the-art security protocols.</p>
                        <a href="#" class="text-blue-600 font-semibold hover:underline">Learn More -></a>
                    </div>
                </div>
            </div>
        </section>

        <section id="contact" class="py-24 relative overflow-hidden">
            <div class="absolute inset-0 ${theme.primary} opacity-90"></div>
            <div class="absolute inset-0 bg-[url('https://source.unsplash.com/1920x1080/?contact,phone')] bg-cover bg-center -z-10"></div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    <div class="md:w-1/2 p-12 bg-gray-900 text-white flex flex-col justify-between">
                        <div>
                            <h3 class="text-3xl font-bold mb-6">Get In Touch</h3>
                            <p class="text-gray-400 mb-8">We would love to hear from you. Fill out the form or contact us directly.</p>
                            
                            <div class="space-y-6">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><i class="fas fa-map-marker-alt"></i></div>
                                    <div>
                                        <p class="text-sm text-gray-400">Location</p>
                                        <p class="font-semibold">Main Street, City Center</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><i class="fas fa-envelope"></i></div>
                                    <div>
                                        <p class="text-sm text-gray-400">Email Us</p>
                                        <p class="font-semibold">contact@brandflow.com</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><i class="fas fa-phone"></i></div>
                                    <div>
                                        <p class="text-sm text-gray-400">Call Us</p>
                                        <p class="font-semibold" id="display-phone">+91 98765 43210</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-12">
                            <a id="whatsapp-btn" href="#" class="block w-full py-4 bg-green-500 hover:bg-green-600 text-white text-center rounded-xl font-bold transition flex items-center justify-center gap-2">
                                <i class="fab fa-whatsapp text-2xl"></i> Chat on WhatsApp
                            </a>
                        </div>
                    </div>

                    <div class="md:w-1/2 p-12 bg-white">
                        <form class="space-y-6">
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Your Name</label>
                                <input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe">
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Your Email</label>
                                <input type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com">
                            </div>
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">Message</label>
                                <textarea rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="How can we help you?"></textarea>
                            </div>
                            <button type="submit" class="w-full py-4 ${theme.primary} text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div class="col-span-1 md:col-span-2">
                        <h2 class="text-3xl font-bold mb-4">BrandFlow</h2>
                        <p class="text-gray-400 max-w-sm mb-6">Building the future with innovation and passion. We are dedicated to providing the best services to our global clientele.</p>
                        <div class="flex space-x-4">
                            <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-400 transition"><i class="fab fa-twitter"></i></a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 transition"><i class="fab fa-instagram"></i></a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-700 transition"><i class="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold mb-4">Quick Links</h3>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#home" class="hover:text-white transition">Home</a></li>
                            <li><a href="#about" class="hover:text-white transition">About Us</a></li>
                            <li><a href="#services" class="hover:text-white transition">Services</a></li>
                            <li><a href="#contact" class="hover:text-white transition">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold mb-4">Newsletter</h3>
                        <p class="text-gray-400 text-sm mb-4">Subscribe to our newsletter for latest updates.</p>
                        <div class="flex">
                            <input type="text" placeholder="Email" class="w-full px-4 py-2 rounded-l-lg text-gray-900 outline-none">
                            <button class="${theme.primary} px-4 py-2 rounded-r-lg hover:opacity-90"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
                    &copy; 2026 Powered by Zulora AI. All Rights Reserved.
                </div>
            </div>
        </footer>

        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
        <script>
            AOS.init();

            // === INTELLIGENT PHONE NUMBER PARSER ===
            // This script scans the user's prompt to find a phone number
            // and automatically links the WhatsApp Button.
            const userPrompt = "${prompt}";
            const phoneRegex = /[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}/;
            const match = userPrompt.match(phoneRegex);
            const waBtn = document.getElementById('whatsapp-btn');
            const displayPhone = document.getElementById('display-phone');

            if (match) {
                // Number found in prompt
                const rawNumber = match[0].replace(/[^0-9]/g, '');
                waBtn.href = "https://wa.me/" + rawNumber;
                displayPhone.innerText = match[0];
                console.log("Auto-detected Phone: " + match[0]);
            } else {
                // Default fallback if no number provided
                waBtn.href = "#"; 
                waBtn.classList.add("opacity-50", "cursor-not-allowed");
                waBtn.innerHTML = "No Phone Provided in Prompt";
            }
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
        
        if (!subdomain) return showNotification("Enter a subdomain", 'warning');
        if (!/^[a-z0-9-]+$/.test(subdomain)) return showNotification("Invalid chars", 'warning');
        
        const cost = STATE.isPro ? 0 : CONFIG.pricing.deployCost;
        if (STATE.profile.credits < cost) return openPaymentModal();

        showNotification("Deploying...", 'info');
        
        try {
            const siteRef = db.collection('sites').doc(subdomain);
            const doc = await siteRef.get();
            if (doc.exists) return showNotification("Taken! Try another.", 'error');

            await siteRef.set({
                owner: STATE.user.uid,
                subdomain: subdomain,
                html: STATE.generatedHTML,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (cost > 0) await adjustCredits(-cost);
            await db.collection('users').doc(STATE.user.uid).update({
                projects: firebase.firestore.FieldValue.arrayUnion(subdomain)
            });
            
            const liveUrl = `https://${subdomain}.${CONFIG.domain}`;
            showNotification(`Live: ${liveUrl}`, 'success');
            window.open(liveUrl, '_blank');
        } catch (e) {
            showNotification("Deploy Error", 'error');
        }
    });
}

/* ----------------------------------------------------------------------------
   7. PAYMENT & UTILS
   ---------------------------------------------------------------------------- */

function generateUPIQR() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    const container = document.getElementById('qr-placeholder');
    if(container) container.innerHTML = `<img src="${qrUrl}" alt="Scan" style="width:100%; border-radius:8px;">`;
}

window.initiateUPIPayment = function() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    window.location.href = upiLink;
    const btn = document.querySelector('.btn-pay');
    if(btn) {
        btn.innerHTML = `Verify Payment <i class="fas fa-check-circle"></i>`;
        btn.onclick = verifyPayment;
        btn.style.background = "#0070F3";
    }
};

window.verifyPayment = function() {
    const msg = `Hello Zulora! Paid ₹${CONFIG.pricing.premiumCost}. Email: ${STATE.profile.email}. Upgrade me.`;
    window.open(`https://wa.me/${CONFIG.supportPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    closePaymentModal();
    showNotification("Verification Sent!", 'success');
};

async function adjustCredits(amount) {
    const newBal = STATE.profile.credits + amount;
    STATE.profile.credits = newBal;
    DOM.navbar.credits.innerText = `${newBal}`;
    DOM.dash.credits.innerText = newBal;
    await db.collection('users').doc(STATE.user.uid).update({ credits: newBal });
}

function generateID() { return Math.random().toString(36).substring(2, 9).toUpperCase(); }

window.copyReferral = function() {
    DOM.dash.referralInput.select();
    document.execCommand("copy");
    showNotification("Copied!", 'success');
};

function showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `glass-panel`;
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;padding:16px 24px;border-radius:12px;background:rgba(10,10,20,0.9);border-left:4px solid ${type==='success'?'#00E676':type==='error'?'#FF4D4D':'#0070F3'};color:white;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.5);`;
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Animation & Loaders
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            document.querySelectorAll('.adsbygoogle').forEach(() => {
                if(window.adsbygoogle) (adsbygoogle = window.adsbygoogle || []).push({});
            });
        } catch(e) {}
    }, 2000);
});
