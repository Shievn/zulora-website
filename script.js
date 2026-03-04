/**
 * ============================================================================
 * ZULORA AI - MASTER JAVASCRIPT LOGIC (v4.0 - Ultra Detail)
 * Features: 10-Chat Limit, Google Auth, Multiple API Routing, Voice UI
 * ============================================================================
 */

// --- 1. FIREBASE IMPORTS (Direct CDN - No terminal required!) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- 2. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDbiEE9mIpsPaf50eNwbjdnALOFb_p9OoQ",
    authDomain: "zulora-ai.firebaseapp.com",
    projectId: "zulora-ai",
    storageBucket: "zulora-ai.firebasestorage.app",
    messagingSenderId: "662395846431",
    appId: "1:662395846431:web:db12d2e1c0e43546abfa2a"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ============================================================================
// --- 3. THE API VAULT (PASTE YOUR KEYS HERE) ---
// ============================================================================
const API_VAULT = {
    // Chat & Logic
    TEXT_PRIMARY: "AIzaSyBlx0fiIzVdM-zDTQtmYU61VfZKXN3DlKQ",      
    TEXT_BACKUP: "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",         
        
    // Image Generation
    IMAGE_PRIMARY: "bd158e918937e6d244745ab82125e03a",      
    IMAGE_BACKUP: "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",    
    
    // Video Generation
    VIDEO_PRIMARY: "60a5fda3-6072-4a42-9234-85da9901f650:801569ac3b092a44363c280d32c99547",        
    VIDEO_BACKUP: "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"     
};

// --- 4. GLOBAL STATE & TRACKERS ---
let currentUser = null; 
let currentMode = "text"; 
let chatHistory = [];     
let guestChatCount = 0; // Tracks the 10 free messages!
let pendingImageData = null;
let pendingImageMimeType = null;

// --- 5. DOM ELEMENT BINDING ---
const ui = {
    userIn: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    chatDisp: document.getElementById('chatDisplay'),
    welcome: document.getElementById('welcomeScreen'),
    
    // Menus
    attachMenu: document.getElementById('attachmentMenu'),
    createMenu: document.getElementById('creationMenu'),
    
    // Modals
    authModal: document.getElementById('authRequiredModal'),
    settingsModal: document.getElementById('settingsModal'),
    aboutModal: document.getElementById('aboutModal'),
    termsModal: document.getElementById('termsModal')
};

// ============================================================================
// --- 6. AUTHENTICATION & THE 10-CHAT GATEKEEPER LOGIC ---
// ============================================================================

// Listen for login/logout in real-time
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('headerLoginBtn');
    if (user) {
        currentUser = user;
        loginBtn.innerText = "Account";
        
        // Update all profile names and avatars in the UI
        document.getElementById('sidebarUserName').innerText = user.displayName;
        document.getElementById('settingsUserName').innerText = user.displayName;
        document.getElementById('settingsUserEmail').innerText = user.email;
        
        const initial = user.displayName.charAt(0).toUpperCase();
        document.getElementById('sidebarAvatar').innerText = initial;
        document.getElementById('settingsAvatar').innerText = initial;
        
        document.getElementById('modalLogoutBtn').classList.remove('hidden');
    } else {
        currentUser = null;
        loginBtn.innerText = "Sign In";
        
        // Revert to Guest UI
        document.getElementById('sidebarUserName').innerText = "Guest User";
        document.getElementById('settingsUserName').innerText = "Guest User";
        document.getElementById('settingsUserEmail').innerText = "Not signed in";
        document.getElementById('sidebarAvatar').innerText = "G";
        document.getElementById('settingsAvatar').innerText = "G";
        
        document.getElementById('modalLogoutBtn').classList.add('hidden');
    }
});

// Trigger Google Sign-In
document.getElementById('googleSignInBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider).then(() => {
        ui.authModal.classList.add('hidden');
        addAIMessage("✅ **Authentication successful!** Welcome to Zulora AI. You now have unlimited messaging and access to image/video generation!");
    }).catch(e => {
        console.error("Login Failed", e);
        alert("Sign-in failed. Please check your connection.");
    });
});

// Trigger Logout
document.getElementById('modalLogoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        ui.settingsModal.classList.add('hidden');
        guestChatCount = 0; // Reset the limit counter for the next guest session
        addAIMessage("You have successfully logged out. Free tier initiated. 👋");
    });
});


// ============================================================================
// --- 7. UI MODAL CONTROLLERS & INTERACTIVITY ---
// ============================================================================

// Open Modals
document.getElementById('headerLoginBtn').addEventListener('click', () => currentUser ? ui.settingsModal.classList.remove('hidden') : ui.authModal.classList.remove('hidden'));
document.getElementById('openSettingsBtn').addEventListener('click', () => ui.settingsModal.classList.remove('hidden'));
document.getElementById('openAboutBtn').addEventListener('click', () => ui.aboutModal.classList.remove('hidden'));
document.getElementById('openTermsModalBtn').addEventListener('click', () => {
    ui.settingsModal.classList.add('hidden');
    ui.termsModal.classList.remove('hidden');
});

// Close Modals
document.getElementById('closeSettings').addEventListener('click', () => ui.settingsModal.classList.add('hidden'));
document.getElementById('closeAuthModal').addEventListener('click', () => ui.authModal.classList.add('hidden'));
document.getElementById('closeAboutModal').addEventListener('click', () => ui.aboutModal.classList.add('hidden'));
document.getElementById('closeTermsModalBtn').addEventListener('click', () => ui.termsModal.classList.add('hidden'));
document.getElementById('acceptTermsBtn').addEventListener('click', () => ui.termsModal.classList.add('hidden'));

// Floating Menus (Attach & Create)
document.getElementById('attachBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.attachMenu.classList.toggle('hidden'); ui.createMenu.classList.add('hidden'); });
document.getElementById('createBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.createMenu.classList.toggle('hidden'); ui.attachMenu.classList.add('hidden'); });
document.addEventListener('click', () => { ui.attachMenu.classList.add('hidden'); ui.createMenu.classList.add('hidden'); });

// Mobile Sidebar
document.getElementById('mobileMenuBtn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));


// ============================================================================
// --- 8. MULTIMEDIA UPLOADS & CREATION MODES ---
// ============================================================================

// Suggestion Cards (Brainstorm, Summarize)
document.querySelectorAll('.prompt-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
        ui.userIn.value = `Please help me with this: ${e.target.closest('.suggestion-card').querySelector('.card-desc').innerText}`;
        handleUserMessage();
    });
});

// Image / Video Generation Modes (Requires Auth)
document.querySelectorAll('.restricted-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.closest('.restricted-action').dataset.type;
        ui.createMenu.classList.add('hidden');
        
        if (!currentUser) {
            document.getElementById('authModalTitle').innerText = "Premium Feature Locked";
            document.getElementById('authModalText').innerText = `You must be signed in with a Google account to unlock ${type} generation to prevent server abuse.`;
            ui.authModal.classList.remove('hidden');
            return;
        }
        
        currentMode = type;
        ui.userIn.placeholder = `Describe the ${type} you want to generate...`;
        ui.userIn.focus();
        
        ui.welcome.style.display = 'none';
        ui.chatDisp.style.display = 'flex';
        addAIMessage(`**${type.toUpperCase()} STUDIO ACTIVATED!** 🎨 Tell me exactly what you want to create.`);
    });
});

// Camera & Gallery Image Attachment
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        pendingImageMimeType = file.type;
        pendingImageData = ev.target.result.split(',')[1];
        ui.userIn.placeholder = "Image attached! Ask me something about it...";
        addAIMessage("📸 **Image attached successfully!** I have it in my vision memory. What do you want to know?");
    };
    reader.readAsDataURL(file);
}
document.getElementById('galleryInput').addEventListener('change', handleFileUpload);
document.getElementById('cameraInput').addEventListener('change', handleFileUpload);


// ============================================================================
// --- 9. LIVE VOICE RECOGNITION AI ---
// ============================================================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    
    ui.voiceBtn.addEventListener('click', () => {
        ui.voiceBtn.classList.add('voice-active');
        ui.userIn.placeholder = "Listening to your voice...";
        recognition.start();
    });
    
    recognition.onresult = (e) => {
        ui.voiceBtn.classList.remove('voice-active');
        ui.userIn.value = e.results[0][0].transcript;
        handleUserMessage(); // Automatically sends message after you finish talking
    };
    
    recognition.onerror = () => { 
        ui.voiceBtn.classList.remove('voice-active'); 
        ui.userIn.placeholder = "Message Zulora AI..."; 
    };
} else { 
    ui.voiceBtn.style.display = 'none'; // Hides microphone if browser doesn't support it
}


// ============================================================================
// --- 10. CORE AI ROUTING (THE BRAIN) ---
// ============================================================================

ui.userIn.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

ui.sendBtn.addEventListener('click', handleUserMessage);
ui.userIn.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserMessage(); }
});

async function handleUserMessage() {
    const text = ui.userIn.value.trim();
    if (!text && !pendingImageData) return; 

    // 🚨 THE 10-CHAT GATEKEEPER TRIGGER 🚨
    if (!currentUser) {
        if (guestChatCount >= 10) {
            document.getElementById('authModalTitle').innerText = "Free Limit Reached";
            document.getElementById('authModalText').innerText = "You have used your 10 free messages. Please sign in securely with Google to continue using Zulora AI unlimited times!";
            ui.authModal.classList.remove('hidden');
            return; // Stops the message from sending
        }
        guestChatCount++; // Increments count (1 out of 10 used)
    }

    ui.welcome.style.display = 'none';
    ui.chatDisp.style.display = 'flex';
    
    addUserMessage(text || "Attached an image.");
    ui.userIn.value = '';
    ui.userIn.style.height = 'auto';
    
    const typingId = addTypingIndicator();

    try {
        if (currentMode === "text") await routeTextToAI(text, typingId);
        else if (currentMode === "image") await routeImageToAI(text, typingId);
        else if (currentMode === "video") await routeVideoToAI(text, typingId);
    } catch (e) {
        console.error(e);
        removeTypingIndicator(typingId);
        addAIMessage("🚨 Connection Error: My servers are currently overwhelmed. Please verify your API keys.");
    }
}

// ROUTE 1: Text & Vision (Gemini -> Groq)
async function routeTextToAI(prompt, typingId) {
    let parts = [];
    if (prompt) parts.push({ text: prompt });
    if (pendingImageData) parts.push({ inlineData: { mimeType: pendingImageMimeType, data: pendingImageData } });
    
    chatHistory.push({ role: "user", parts: parts });
    pendingImageData = null; pendingImageMimeType = null;
    ui.userIn.placeholder = "Message Zulora AI...";

    try {
        // Try Primary: Google Gemini 1.5 Flash
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_VAULT.TEXT_PRIMARY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: chatHistory, 
                systemInstruction: { parts: [{ text: "You are Zulora AI, an advanced assistant built by Shiven Panwar. Be friendly, intelligent, and ALWAYS use relevant emojis." }] }
            })
        });
        
        if(!res.ok) throw new Error("Gemini API Error");
        
        const data = await res.json();
        const aiText = data.candidates[0].content.parts[0].text;
        chatHistory.push({ role: "model", parts: [{ text: aiText }] });
        removeTypingIndicator(typingId); addAIMessage(aiText);
        
    } catch (e) {
        console.warn("Switching to Backup Logic Engine (Groq)...");
        try {
            // Try Backup: Groq (Llama 3)
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST', headers: { 'Authorization': `Bearer ${API_VAULT.TEXT_BACKUP}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: prompt + " (Please reply with emojis)" }] })
            });
            const groqData = await groqRes.json();
            removeTypingIndicator(typingId); addAIMessage(groqData.choices[0].message.content);
        } catch(e2) { throw e2; }
    }
}

// ROUTE 2: Image Generation (Bytez)
async function routeImageToAI(prompt, typingId) {
    try {
        const res = await fetch("https://api.bytez.com/models/v2/stabilityai/stable-diffusion-xl-base-1.0", {
            method: "POST", headers: { "Authorization": API_VAULT.IMAGE_PRIMARY, "Content-Type": "application/json" },
            body: JSON.stringify({ "input": prompt })
        });
        const data = await res.json();
        removeTypingIndicator(typingId); 
        addAIImage(data.output || "https://via.placeholder.com/512?text=Image+Generated");
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    } catch(e) { 
        removeTypingIndicator(typingId); 
        addAIMessage("Art generation failed. The servers might be busy. 🎨"); 
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    }
}

// ROUTE 3: Video Generation Mock
async function routeVideoToAI(prompt, typingId) {
    removeTypingIndicator(typingId);
    const id = "vid_" + Date.now();
    addAIMessage(`🎬 Submitting prompt: "${prompt}" to video render farms... ⏳`, id);
    setTimeout(() => {
        document.getElementById(id).innerHTML = `<div class="avatar-circle">✨</div><div class="message-bubble">✅ <strong>Video sequence completed!</strong></div>`;
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    }, 4500);
}


// ============================================================================
// --- 11. HTML INJECTION UTILITIES ---
// ============================================================================

function addUserMessage(txt) {
    const div = document.createElement('div'); div.className = 'message-row user-message';
    div.innerHTML = `<div class="message-bubble">${escapeHTML(txt)}</div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addAIMessage(txt, id=null) {
    const div = document.createElement('div'); div.className = 'message-row ai-message'; if(id) div.id = id;
    // Basic Markdown Parser for bold text and line breaks
    const formatted = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    div.innerHTML = `<div class="avatar-circle">✨</div><div class="message-bubble"><p>${formatted}</p></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addAIImage(url) {
    const div = document.createElement('div'); div.className = 'message-row ai-message';
    div.innerHTML = `<div class="avatar-circle">✨</div><div class="message-bubble" style="padding:0; overflow:hidden;"><img src="${url}" style="width:100%; max-width:512px; display:block;"></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addTypingIndicator() {
    const id = 'typing_' + Date.now(); const div = document.createElement('div'); div.className = 'message-row ai-message'; div.id = id;
    div.innerHTML = `<div class="avatar-circle">✨</div><div class="message-bubble"><p style="color:var(--text-tertiary); font-style:italic;">Analyzing... 🧠</p></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight; return id;
}

function removeTypingIndicator(id) { const el = document.getElementById(id); if(el) el.remove(); }

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
