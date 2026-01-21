// Import Firebase functions from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- CONFIGURATION ---

    // PASTE YOUR CONFIG OBJECT HERE
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
        // Check for Playlist ID (list=...)
        if (urlObj.searchParams.has("list")) {
            return { type: 'playlist', id: urlObj.searchParams.get("list") };
        }
        // Check for Video ID (v=...)
        if (urlObj.searchParams.has("v")) {
            return { type: 'video', id: urlObj.searchParams.get("v") };
        }
        // Check for short links (youtu.be/)
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
    if (!ytData) return alert("Invalid YouTube URL. Ensure it has a video or playlist ID.");

    // Simple display name (You could fetch the real title via API, but let's keep it simple)
    const name = prompt("Enter a name for this playlist:", "My Awesome List");
    if (!name) return;

    try {
        await addDoc(colRef, {
            name: name,
            type: ytData.type,
            ytId: ytData.id,
            originalUrl: url,
            createdAt: serverTimestamp()
        });
        urlInput.value = ''; // Clear input
    } catch (err) {
        console.error("Error adding document: ", err);
        alert("Failed to save to cloud.");
    }
});

// --- REAL-TIME LISTENER (Sidebar Sync) ---
// This runs whenever the database changes (add or delete)
const q = query(colRef, orderBy('createdAt', 'desc'));

onSnapshot(q, (snapshot) => {
    playlistList.innerHTML = ''; // Clear current list
    
    if(snapshot.empty) {
        playlistList.innerHTML = '<li style="background:none; color:#888;">No playlists yet.</li>';
        return;
    }

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        
        // Icon based on type
        const iconClass = data.type === 'playlist' ? 'fa-list' : 'fa-play';
        
        li.innerHTML = `
            <span onclick="playVideo('${data.type}', '${data.ytId}', this)">
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

// --- UI FUNCTIONS ---

// 1. Play Video/Playlist (Enhanced)
window.playVideo = (type, id, element) => {
    // Highlight active item logic (Same as before)
    document.querySelectorAll('#playlistList li').forEach(li => li.classList.remove('active'));
    element.parentElement.classList.add('active');

    let embedUrl = "";
    
    // TRICK: 'index=1' और 'list=...' का इस्तेमाल करके हम साइड पैनल दिखाते हैं
    if (type === 'playlist') {
        // यह URL दाईं ओर प्लेलिस्ट पैनल के साथ वीडियो लोड करता है
        embedUrl = `https://www.youtube.com/embed/videoseries?list=${id}&index=1`;
    } else {
        // सिंगल वीडियो के लिए नार्मल एम्बेड
        embedUrl = `https://www.youtube.com/embed/${id}?rel=0`;
    }

    videoDisplay.innerHTML = `
        <iframe 
            src="${embedUrl}" 
            allowfullscreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="YouTube video player"
        ></iframe>`;
        
    if(window.innerWidth <= 768) toggleSidebar();
};
// 2. Delete Item
window.deleteItem = async (docId) => {
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDoc(doc(db, 'playlists', docId));
        // Note: UI updates automatically because of onSnapshot!
    }
};

// 3. Responsive Sidebar Toggling
// --- Responsive Sidebar Logic ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggleBtn = document.getElementById('toggleSidebar');
const closeBtn = document.getElementById('closeSidebar');

function toggleMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// बटन्स पर क्लिक इवेंट
if(toggleBtn) toggleBtn.addEventListener('click', toggleMenu);
if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
if(overlay) overlay.addEventListener('click', toggleMenu);

