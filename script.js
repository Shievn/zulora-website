// ==========================================
// 1. CONFIGURATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ", // REPLACE THIS
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// State
let currentUser = null;
let currentProject = { name: "", template: "" };

// ==========================================
// 2. SUBDOMAIN CHECKER (The "Receptionist")
// ==========================================
(function checkSubdomain() {
    const host = window.location.hostname; // e.g., shiven.zulora.in
    const parts = host.split('.');
    
    // If running locally or on main domain
    if (host.includes('localhost') || host === 'zulora.in' || host === 'www.zulora.in' || host.includes('vercel.app')) {
        // Show Landing Page
        return; 
    }
    
    // If we are here, it's a USER SUBDOMAIN (e.g. shiven.zulora.in)
    const subdomain = parts[0];
    document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Loading " + subdomain + "...</h1>";
    
    // Fetch User Site Data
    const usersRef = ref(db, 'websites');
    get(usersRef).then((snap) => {
        let found = false;
        snap.forEach(site => {
            if (site.val().subdomain === subdomain) {
                found = true;
                renderLiveSite(site.val());
            }
        });
        if (!found) document.body.innerHTML = "<h1>404 - Site Not Found</h1>";
    });
})();

function renderLiveSite(data) {
    document.body.innerHTML = data.htmlContent;
}

// ==========================================
// 3. AUTHENTICATION (Smart Trigger)
// ==========================================
window.showAuthModal = function() {
    document.getElementById('modal-auth').style.display = 'flex';
}

window.triggerGoogleLogin = function() {
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user;
        // Save User if New
        const userRef = ref(db, 'users/' + user.uid);
        get(userRef).then((snap) => {
            if (!snap.exists()) {
                set(userRef, {
                    name: user.displayName,
                    email: user.email,
                    photo: user.photoURL,
                    plan: 'free'
                });
            }
        });
        
        document.getElementById('modal-auth').style.display = 'none';
        
        // If we were creating a site, continue saving
        if(currentProject.name !== "") {
            saveWebsiteToDB();
        }

    }).catch((error) => {
        alert("Login Error: " + error.message);
    });
}

window.logout = function() {
    signOut(auth).then(() => window.location.reload());
}

// Monitor Login Status
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('view-landing').classList.remove('active-view');
        document.getElementById('view-dashboard').classList.add('active-view');
        
        // Update Sidebar
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-avatar').src = user.photoURL;
        
        loadUserWebsites();
    }
});

// ==========================================
// 4. WIZARD & BUILDER LOGIC
// ==========================================
window.openProjectWizard = function() {
    document.getElementById('modal-wizard').style.display = 'flex';
}

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
}

window.wizardNextStep = function() {
    const name = document.getElementById('new-site-name').value;
    if (name.length < 3) {
        alert("Subdomain must be at least 3 characters");
        return;
    }
    currentProject.name = name;
    document.getElementById('wiz-step-1').classList.remove('active');
    document.getElementById('wiz-step-2').classList.add('active');
}

window.selectTemplate = function(tpl) {
    currentProject.template = tpl;
    document.getElementById('modal-wizard').style.display = 'none';
    
    // Go to Editor
    document.getElementById('view-dashboard').classList.remove('active-view');
    document.getElementById('view-editor').classList.add('active-view');
    document.getElementById('editor-site-name').innerText = currentProject.name + ".zulora.in";
    
    // Generate Template HTML
    const canvas = document.getElementById('website-preview');
    canvas.innerHTML = `
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
            <nav style="padding:20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                <h3 contenteditable="true">${currentProject.name}</h3>
                <div><a>Home</a> <a>Contact</a></div>
            </nav>
            <div style="padding:80px 20px; background:#f8fafc;">
                <h1 contenteditable="true" style="font-size:3rem; color:#333;">Welcome to ${currentProject.name}</h1>
                <p contenteditable="true" style="color:#666;">This is a ${tpl} template. Click text to edit.</p>
                <button style="margin-top:20px; padding:10px 20px; background:#6366f1; color:white; border:none; border-radius:5px;">Get Started</button>
            </div>
        </div>
    `;
}

// ==========================================
// 5. PUBLISHING LOGIC
// ==========================================
window.publishSite = function() {
    if (!currentUser) {
        // User is not logged in? FORCE LOGIN NOW
        window.showAuthModal(); 
    } else {
        saveWebsiteToDB();
    }
}

function saveWebsiteToDB() {
    const html = document.getElementById('website-preview').innerHTML;
    const siteId = Date.now(); // Simple ID
    
    // Save to 'websites' collection (for public access)
    set(ref(db, 'websites/' + siteId), {
        owner: currentUser.uid,
        subdomain: currentProject.name,
        htmlContent: html,
        template: currentProject.template
    });
    
    // Add to user's list
    set(ref(db, 'users/' + currentUser.uid + '/sites/' + siteId), {
        subdomain: currentProject.name
    }).then(() => {
        alert("Site Published! Live at: https://" + currentProject.name + ".zulora.in");
        window.location.reload();
    });
}

function loadUserWebsites() {
    const sitesRef = ref(db, 'users/' + currentUser.uid + '/sites');
    get(sitesRef).then((snap) => {
        const container = document.getElementById('website-list-container');
        if (snap.exists()) {
            container.innerHTML = ""; // Clear empty state
            snap.forEach(s => {
                container.innerHTML += `
                    <div class="project-card">
                        <div class="card-preview"><i class="fas fa-globe"></i></div>
                        <div class="card-info">
                            <h4>${s.val().subdomain}.zulora.in</h4>
                            <a href="https://${s.val().subdomain}.zulora.in" target="_blank" class="card-link">Visit Site <i class="fas fa-external-link-alt"></i></a>
                        </div>
                    </div>
                `;
            });
        }
    });
}
