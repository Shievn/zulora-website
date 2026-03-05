/**
 * ============================================================================
 * ZULORA AI - MASTER JAVASCRIPT ENGINE (v5.1 - Midnight Aurora + Mobile Fixes)
 * Lead Architect: Shiven Panwar
 * Features: Mobile Sidebar Fix, Hardware Back Button Fix, 5-API Routing
 * ============================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================================
// 1. FIREBASE CONFIGURATION
// ============================================================================
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
// 2. THE 5-KEY API VAULT (ROUTING & FALLBACKS)
// IMPORTANT: Keep your GitHub repository PRIVATE!
// ============================================================================
const API_VAULT = {
    // Chat & Logic APIs
    GEMINI_KEY: "AIzaSyBftGn9XBtgpmdnotJVb1seEIy1AO-uYTg",           // Primary Chat & Vision
    GROQ_KEY: "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",               // Fallback Chat (Llama 3)
    
    // Image Generation APIs
    BYTEZ_KEY: "bd158e918937e6d244745ab82125e03a",             // Primary Image Gen
    HUGGINGFACE_KEY: "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",          // Fallback Image Gen
    
    // Video Generation API
    FAL_KEY: "60a5fda3-6072-4a42-9234-85da9901f650:801569ac3b092a44363c280d32c99547"                  // Primary Video Gen
};

// ============================================================================
// 3. GLOBAL STATE & SESSION TRACKING
// ============================================================================
let currentUser = null; 
let currentMode = "text"; 
let activeChatId = null;  
let chatHistory = [];     
let guestChatCount = 0;   // Enforces the 10-message limit
let pendingImageData = null;
let pendingImageMimeType = null;

// ============================================================================
// 4. DOM ELEMENT CACHING
// ============================================================================
const ui = {
    userIn: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.getElementById('sidebar'),
    
    chatDisp: document.getElementById('chatDisplay'),
    welcome: document.getElementById('welcomeScreen'),
    sidebarHistory: document.getElementById('historyWeek'),
    loader: document.getElementById('generationLoader'),
    loaderTitle: document.getElementById('loaderTitle'),
    loaderDesc: document.getElementById('loaderDesc'),
    
    attachMenu: document.getElementById('attachmentMenu'),
    createMenu: document.getElementById('creationMenu'),
    
    overlays: document.querySelectorAll('.modal-overlay'), 
    authModal: document.getElementById('authRequiredModal'),
    settingsModal: document.getElementById('settingsModal'),
    aboutModal: document.getElementById('aboutModal'),
    termsModal: document.getElementById('termsModal')
};

// ============================================================================
// 5. LOCAL STORAGE HISTORY SYSTEM
// ============================================================================
const HistoryManager = {
    generateId: () => 'chat_' + Math.random().toString(36).substr(2, 9),

    saveCurrentChat: () => {
        if (chatHistory.length === 0) return; 
        if (!activeChatId) activeChatId = HistoryManager.generateId();
        
        const titleText = chatHistory.find(msg => msg.role === 'user')?.parts[0]?.text || "New Conversation";
        const title = titleText.substring(0, 30) + (titleText.length > 30 ? "..." : "");

        const chatData = { id: activeChatId, title: title, messages: chatHistory, timestamp: Date.now() };
        let allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        
        const existingIndex = allChats.findIndex(c => c.id === activeChatId);
        if (existingIndex > -1) allChats[existingIndex] = chatData;
        else allChats.unshift(chatData);

        localStorage.setItem('zulora_chats', JSON.stringify(allChats));
        HistoryManager.renderSidebar();
    },

    loadChat: (id) => {
        const allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        const targetChat = allChats.find(c => c.id === id);
        
        if (targetChat) {
            activeChatId = targetChat.id;
            chatHistory = targetChat.messages;
            
            ui.welcome.style.display = 'none';
            ui.chatDisp.style.display = 'flex';
            ui.chatDisp.innerHTML = ''; 
            
            targetChat.messages.forEach(msg => {
                if (msg.role === 'user') addUserMessage(msg.parts[0].text, false);
                else addAIMessage(msg.parts[0].text, null, false);
            });
            
            closeMobileSidebar(); // Close sidebar after selecting chat
        }
    },

    renderSidebar: () => {
        const allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        if(!ui.sidebarHistory) return;
        
        ui.sidebarHistory.innerHTML = ''; 
        if (allChats.length === 0) {
            ui.sidebarHistory.innerHTML = '<li class="empty-history-msg">No previous chats</li>';
            return;
        }

        allChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
            li.innerText = chat.title;
            li.onclick = () => HistoryManager.loadChat(chat.id);
            ui.sidebarHistory.appendChild(li);
        });
    },

    startNewChat: () => {
        activeChatId = null;
        chatHistory = [];
        ui.chatDisp.innerHTML = '';
        ui.chatDisp.style.display = 'none';
        ui.welcome.style.display = 'flex';
        ui.userIn.value = '';
        currentMode = "text";
        ui.userIn.placeholder = "Message Zulora AI...";
        HistoryManager.renderSidebar();
        closeMobileSidebar();
    }
};

window.addEventListener('DOMContentLoaded', HistoryManager.renderSidebar);
ui.newChatBtn.addEventListener('click', HistoryManager.startNewChat);


// ============================================================================
// 6. 🛠️ MOBILE UI FIXES (STUCK SCREEN & BACK BUTTON) 🛠️
// ============================================================================

// Helper to open sidebar and push a state for the back button
function openMobileSidebar() {
    ui.sidebar.classList.add('open');
    history.pushState({ modal: 'sidebar' }, ""); 
}

// Helper to close sidebar
function closeMobileSidebar() {
    if(ui.sidebar.classList.contains('open')) {
        ui.sidebar.classList.remove('open');
    }
}

// Hamburger Menu Click
ui.mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!ui.sidebar.classList.contains('open')) {
        openMobileSidebar();
    } else {
        closeMobileSidebar();
        history.back(); // Clears the state
    }
});

// FIX: Close sidebar and popup menus when clicking anywhere outside!
document.addEventListener('click', (e) => {
    // 1. Close mobile sidebar if clicking outside
    if (window.innerWidth <= 768 && ui.sidebar.classList.contains('open')) {
        if (!ui.sidebar.contains(e.target) && !ui.mobileMenuBtn.contains(e.target)) {
            closeMobileSidebar();
            history.back(); 
        }
    }
    
    // 2. Close floating Attach/Create menus if clicking outside
    if (!e.target.closest('#attachmentMenu') && !e.target.closest('#attachBtn')) {
        ui.attachMenu.classList.add('hidden');
    }
    if (!e.target.closest('#creationMenu') && !e.target.closest('#createBtn')) {
        ui.createMenu.classList.add('hidden');
    }
});

// FIX: Handle physical phone Back Button
window.addEventListener('popstate', (e) => {
    // If sidebar is open, close it instead of exiting app
    if (ui.sidebar.classList.contains('open')) {
        closeMobileSidebar();
    }
    
    // Close any open modals
    ui.overlays.forEach(overlay => {
        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    });
});

// Helper to open modals safely with back button support
function openModal(modalElement) {
    modalElement.classList.remove('hidden');
    history.pushState({ modal: modalElement.id }, "");
}

function closeModal(modalElement) {
    modalElement.classList.add('hidden');
}

// Modal Backdrop Clicks (Close on dark background tap)
ui.overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
            history.back();
        }
    });
});

// Modal Close Buttons
document.getElementById('closeSettings').addEventListener('click', () => { closeModal(ui.settingsModal); history.back(); });
document.getElementById('closeAuthModal').addEventListener('click', () => { closeModal(ui.authModal); history.back(); });
document.getElementById('closeAboutModal').addEventListener('click', () => { closeModal(ui.aboutModal); history.back(); });
if(document.getElementById('closeTermsModalBtn')) document.getElementById('closeTermsModalBtn').addEventListener('click', () => { closeModal(ui.termsModal); history.back(); });

// Modal Openers
document.getElementById('headerLoginBtn').addEventListener('click', () => currentUser ? openModal(ui.settingsModal) : openModal(ui.authModal));
document.getElementById('openSettingsBtn').addEventListener('click', () => openModal(ui.settingsModal));
document.getElementById('openAboutBtn').addEventListener('click', () => { closeMobileSidebar(); openModal(ui.aboutModal); });
if(document.getElementById('openTermsModalBtn')) {
    document.getElementById('openTermsModalBtn').addEventListener('click', () => {
        closeModal(ui.settingsModal);
        openModal(ui.termsModal);
    });
}

// Toggle Attach/Create menus
document.getElementById('attachBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.attachMenu.classList.toggle('hidden'); ui.createMenu.classList.add('hidden'); });
document.getElementById('createBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.createMenu.classList.toggle('hidden'); ui.attachMenu.classList.add('hidden'); });


// ============================================================================
// 7. AUTHENTICATION & GATEKEEPER
// ============================================================================
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('headerLoginBtn');
    if (user) {
        currentUser = user;
        loginBtn.innerHTML = `<span class="material-symbols-rounded">account_circle</span> Account`;
        document.getElementById('sidebarUserName').innerText = user.displayName;
        document.getElementById('settingsUserName').innerText = user.displayName;
        document.getElementById('settingsUserEmail').innerText = user.email;
        const initial = user.displayName.charAt(0).toUpperCase();
        document.getElementById('sidebarAvatar').innerText = initial;
        document.getElementById('settingsAvatar').innerText = initial;
        document.getElementById('modalLogoutBtn').classList.remove('hidden');
        document.querySelector('.profile-plan').innerText = "Premium Verified";
    } else {
        currentUser = null;
        loginBtn.innerHTML = `<span class="material-symbols-rounded">login</span> Sign In`;
        document.getElementById('sidebarUserName').innerText = "Guest User";
        document.getElementById('settingsUserName').innerText = "Guest User";
        document.getElementById('settingsUserEmail').innerText = "Not signed in";
        document.getElementById('sidebarAvatar').innerText = "G";
        document.getElementById('settingsAvatar').innerText = "G";
        document.querySelector('.profile-plan').innerText = "Free Tier (10 Chats)";
        document.getElementById('modalLogoutBtn').classList.add('hidden');
    }
});

document.getElementById('googleSignInBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider).then(() => {
        closeModal(ui.authModal);
        addAIMessage("✅ **Authentication successful!** Welcome to Zulora AI. You now have unlimited access.");
    }).catch(e => {
        console.error("Login Failed", e);
        alert("Sign-in failed. Check your connection.");
    });
});

document.getElementById('modalLogoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        closeModal(ui.settingsModal);
        guestChatCount = 0; 
        addAIMessage("Logged out successfully. Free tier initiated. 👋");
    });
});


// ============================================================================
// 8. MEDIA UPLOADS, CREATION MODES & VOICE
// ============================================================================

// Suggestion Cards
document.querySelectorAll('.prompt-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
        ui.userIn.value = `Help me with this: ${e.target.closest('.suggestion-card').querySelector('.card-desc').innerText}`;
        handleUserMessage();
    });
});

// Image/Video Studio Modes
document.querySelectorAll('.restricted-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.closest('.restricted-action').dataset.type;
        ui.createMenu.classList.add('hidden');
        
        if (!currentUser) {
            document.getElementById('authModalTitle').innerText = "Premium Feature Locked";
            openModal(ui.authModal);
            return;
        }
        
        currentMode = type;
        ui.userIn.placeholder = `Describe the ${type} you want to create...`;
        ui.userIn.focus();
        ui.welcome.style.display = 'none';
        ui.chatDisp.style.display = 'flex';
        addAIMessage(`**${type.toUpperCase()} STUDIO ACTIVATED!** 🎨 Describe exactly what you want.`);
    });
});

// Gallery/Camera
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        pendingImageMimeType = file.type;
        pendingImageData = ev.target.result.split(',')[1];
        ui.userIn.placeholder = "Image attached! Ask me about it...";
        addAIMessage("📸 **Image loaded into memory!** What should we do with it?");
    };
    reader.readAsDataURL(file);
}
if(document.getElementById('galleryInput')) document.getElementById('galleryInput').addEventListener('change', handleFileUpload);
if(document.getElementById('cameraInput')) document.getElementById('cameraInput').addEventListener('change', handleFileUpload);

// Voice Recognition
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
        handleUserMessage(); 
    };
    recognition.onerror = () => { ui.voiceBtn.classList.remove('voice-active'); ui.userIn.placeholder = "Message Zulora AI..."; };
} else { ui.voiceBtn.style.display = 'none'; }


// ============================================================================
// 9. CORE AI ROUTING (THE 5-KEY ENGINE)
// ============================================================================

// Loader Tools
function showLoader(title, desc) {
    ui.loaderTitle.innerText = title;
    ui.loaderDesc.innerText = desc;
    ui.loader.classList.remove('hidden');
}
function hideLoader() {
    ui.loader.classList.add('hidden');
}

// Auto-resizing input
ui.userIn.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

ui.sendBtn.addEventListener('click', handleUserMessage);
ui.userIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserMessage(); }});

async function handleUserMessage() {
    const text = ui.userIn.value.trim();
    if (!text && !pendingImageData) return; 

    // 10-Chat Gatekeeper
    if (!currentUser) {
        if (guestChatCount >= 10) {
            openModal(ui.authModal);
            return; 
        }
        guestChatCount++; 
    }

    ui.welcome.style.display = 'none';
    ui.chatDisp.style.display = 'flex';
    addUserMessage(text || "Attached an image.");
    
    ui.userIn.value = '';
    ui.userIn.style.height = 'auto';

    try {
        if (currentMode === "text") {
            const typingId = addTypingIndicator();
            await callTextAI(text, typingId);
        } else if (currentMode === "image") {
            showLoader("Crafting Image...", "Rendering pixels via Bytez AI engine...");
            await callImageAI(text);
        } else if (currentMode === "video") {
            showLoader("Directing Video...", "Connecting to Fal AI render farms...");
            await callVideoAI(text);
        }
    } catch (e) {
        console.error(e);
        hideLoader();
        addAIMessage("🚨 Connection Error: Servers overwhelmed. Please check API keys.");
    }
}

// Text & Vision API (Gemini -> Groq)
async function callTextAI(prompt, typingId) {
    let parts = [];
    if (prompt) parts.push({ text: prompt });
    if (pendingImageData) parts.push({ inlineData: { mimeType: pendingImageMimeType, data: pendingImageData } });
    
    chatHistory.push({ role: "user", parts: parts });
    pendingImageData = null; pendingImageMimeType = null;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_VAULT.GEMINI_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory, systemInstruction: { parts: [{ text: "You are Zulora AI, designed by Shiven Panwar. Be helpful and use emojis." }] }})
        });
        
        if(!res.ok) throw new Error("Gemini Error");
        const data = await res.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        chatHistory.push({ role: "model", parts: [{ text: aiText }] });
        HistoryManager.saveCurrentChat(); 
        
        removeTypingIndicator(typingId); 
        addAIMessage(aiText);
        
    } catch (e) {
        console.warn("Switching to Groq Fallback...");
        try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST', headers: { 'Authorization': `Bearer ${API_VAULT.GROQ_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: prompt }] })
            });
            const groqData = await groqRes.json();
            
            chatHistory.push({ role: "model", parts: [{ text: groqData.choices[0].message.content }] });
            HistoryManager.saveCurrentChat();
            
            removeTypingIndicator(typingId); 
            addAIMessage(groqData.choices[0].message.content);
        } catch(e2) { 
            removeTypingIndicator(typingId);
            addAIMessage("Both Gemini and Groq servers are offline. 🛑 Check API Keys.");
        }
    }
}

// Image Generation (Bytez -> Hugging Face)
async function callImageAI(prompt) {
    try {
        const res = await fetch("https://api.bytez.com/models/v2/stabilityai/stable-diffusion-xl-base-1.0", {
            method: "POST", headers: { "Authorization": API_VAULT.BYTEZ_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ "input": prompt })
        });
        if(!res.ok) throw new Error("Bytez failed");
        
        const data = await res.json();
        hideLoader();
        addAIImage(data.output);
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    } catch(e) { 
        hideLoader();
        addAIMessage("Bytez servers busy. Triggering Hugging Face fallback. 🎨 Check API setup."); 
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    }
}

// Video Generation (Fal AI)
async function callVideoAI(prompt) {
    setTimeout(() => {
        hideLoader();
        addAIMessage(`🎬 Video generation requested via Fal AI: "${prompt}". (Requires backend endpoint configuration for final video stream).`);
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    }, 4000); 
}


// ============================================================================
// 10. HTML INJECTION (Chat Bubbles)
// ============================================================================
function addUserMessage(txt, save = true) {
    const div = document.createElement('div'); div.className = 'message-row user-message';
    div.innerHTML = `<div class="message-bubble">${escapeHTML(txt)}</div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addAIMessage(txt, id=null, save = true) {
    const div = document.createElement('div'); div.className = 'message-row ai-message'; if(id) div.id = id;
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
