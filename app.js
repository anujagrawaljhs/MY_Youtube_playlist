// Import Firebase functions from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- CONFIGURATION ---
// YOUR ORIGINAL KEYS PRESERVED HERE
const firebaseConfig = {
    apiKey: "AIzaSyCWNjMjsJ55-iuMAJFdSQgv9vz2AoRXQIw",
    authDomain: "my-study-a.firebaseapp.com",
    projectId: "my-study-a",
    storageBucket: "my-study-a.firebasestorage.app",
    messagingSenderId: "339412139682",
    appId: "1:339412139682:web:85539c72ccad5b65cba1fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colRef = collection(db, 'playlists');

// --- DOM ELEMENTS ---
const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const playlistList = document.getElementById('playlistList');
const videoDisplay = document.getElementById('videoDisplay');

// --- HELPER: Extract ID from YouTube URL ---
function getYouTubeId(url) {
    let listId = null;
    let videoId = null;

    try {
        const urlObj = new URL(url);
        if (urlObj.searchParams.has("list")) {
            return { type: 'playlist', id: urlObj.searchParams.get("list") };
        }
        if (urlObj.searchParams.has("v")) {
            return { type: 'video', id: urlObj.searchParams.get("v") };
        }
        if (urlObj.hostname === "youtu.be") {
            return { type: 'video', id: urlObj.pathname.slice(1) };
        }
    } catch (e) {
        return null;
    }
    return null;
}

// --- SAVE DATA TO FIREBASE ---
addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return alert("Please enter a URL");

    const ytData = getYouTubeId(url);
    if (!ytData) return alert("Invalid YouTube URL.");

    const name = prompt("Enter a name for this playlist:", "My Awesome List");
    if (!name) return;

    // UI Feedback: Show loading
    addBtn.innerText = "Saving...";
    addBtn.disabled = true;

    try {
        await addDoc(colRef, {
            name: name,
            type: ytData.type,
            ytId: ytData.id,
            originalUrl: url,
            createdAt: serverTimestamp()
        });
        urlInput.value = ''; 
    } catch (err) {
        console.error("Error adding document: ", err);
        alert("Failed to save to cloud.");
    }

    // Restore button
    addBtn.innerText = "Save";
    addBtn.disabled = false;
});

// --- REAL-TIME LISTENER ---
const q = query(colRef, orderBy('createdAt', 'desc'));

onSnapshot(q, (snapshot) => {
    playlistList.innerHTML = ''; 
    
    if(snapshot.empty) {
        playlistList.innerHTML = '<li style="background:none; color:#888; text-align:center;">No playlists yet.</li>';
        return;
    }

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        const iconClass = data.type === 'playlist' ? 'fa-list' : 'fa-play';
        
        li.innerHTML = `
            <span style="flex:1;" onclick="playVideo('${data.type}', '${data.ytId}', this)">
                <i class="fa-solid ${iconClass}"></i> &nbsp; ${data.name}
            </span>
            <button class="delete-btn" onclick="deleteItem('${doc.id}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        playlistList.appendChild(li);
    });
});

// --- UI FUNCTIONS ---

// 1. Play Video
window.playVideo = (type, id, element) => {
    document.querySelectorAll('#playlistList li').forEach(li => li.classList.remove('active'));
    element.parentElement.classList.add('active');

    let embedUrl = "";
    if (type === 'playlist') {
        // Enforce side panel for playlists
        embedUrl = `https://www.youtube.com/embed/videoseries?list=${id}&index=1`;
    } else {
        embedUrl = `https://www.youtube.com/embed/${id}?rel=0`;
    }

    videoDisplay.innerHTML = `
        <iframe 
            src="${embedUrl}" 
            allowfullscreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="YouTube video player"
        ></iframe>`;
        
    // Close sidebar automatically on mobile
    if(window.innerWidth <= 768) toggleMenu();
};

// 2. Delete Item
window.deleteItem = async (docId) => {
    if(confirm("Delete this playlist?")) {
        await deleteDoc(doc(db, 'playlists', docId));
    }
};

// 3. Responsive Sidebar Logic
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggleBtn = document.getElementById('toggleSidebar');
const closeBtn = document.getElementById('closeSidebar');

function toggleMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

if(toggleBtn) toggleBtn.addEventListener('click', toggleMenu);
if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
if(overlay) overlay.addEventListener('click', toggleMenu);
