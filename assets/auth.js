// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc, // CORRECTED: Added deleteDoc to the main import
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// REMOVED: Conflicting and unnecessary imports
// import { doc, deleteDoc } from "firebase/firestore";
// import { db } from './firebase-config.js'; 

// Your web app's Firebase configuration that you provided
const firebaseConfig = {
  apiKey: "AIzaSyDVrCYmiu1ANPHpOmWR1oyY2LXdzeBJiLk",
  authDomain: "rs-digital-portfolio.firebaseapp.com",
  projectId: "rs-digital-portfolio",
  storageBucket: "rs-digital-portfolio.appspot.com",
  messagingSenderId: "10175685007",
  appId: "1:10175685007:web:9d7a700139626de1e8abfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Define Admin ---
const ADMIN_EMAIL = "developer@rs-digital.my";

// --- Function to handle user registration ---
async function handleRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "client",
            createdAt: new Date()
        });

        console.log("Registered successfully:", user);
        window.location.href = "/dashboard.html";
    } catch (error) {
        console.error("Registration Error:", error.code, error.message);
        alert(`Registration failed: ${error.message}`);
    }
}

// --- Function to handle user login ---
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user.email === ADMIN_EMAIL) {
            window.location.href = "/admin-dashboard.html";
        } else {
            window.location.href = "/dashboard.html";
        }
        console.log("Logged in successfully:", user);

    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        alert(`Login failed: ${error.message}`);
    }
}

// --- Function to handle user logout ---
async function handleLogout() {
    try {
        await signOut(auth);
        console.log("Logged out successfully");
        window.location.href = "/login.html";
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// --- Auth State Observer ---
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        const isProtectedPage = window.location.pathname.includes('/dashboard.html') || 
                                window.location.pathname.includes('/admin-dashboard.html') ||
                                window.location.pathname.includes('/questionnaire.html');
        const isAuthPage = window.location.pathname.includes('/login.html') || window.location.pathname.includes('/register.html');

        if (user) {
            if (isAuthPage) {
                if (user.email === ADMIN_EMAIL) {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }
            callback(user);
        } else {
            if (isProtectedPage) {
                window.location.href = '/login.html';
            }
            callback(null);
        }
    });
}

// --- Function to submit questionnaire ---
async function submitQuestionnaire(user, formData) {
    if (!user) throw new Error("User not authenticated");
    
    const submissionData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: "Under Review",
        submittedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, "submissions", user.uid), submissionData);
        console.log("Questionnaire submitted successfully!");
        window.location.href = "/dashboard.html";
    } catch (error) {
        console.error("Error submitting questionnaire:", error);
        alert(`Error: ${error.message}`);
    }
}

// --- Function to get a user's project data ---
async function getUserProject(userId) {
    if (!userId) return null;
    
    const projectDocRef = doc(db, "submissions", userId);
    const projectDocSnap = await getDoc(projectDocRef);

    return projectDocSnap.exists() ? projectDocSnap.data() : null;
}

// --- Function for Admin to get all submissions ---
async function getAllSubmissions() {
    const submissionsCol = collection(db, "submissions");
    const snapshot = await getDocs(submissionsCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- Function for Admin to update project status ---
async function updateProjectStatus(userId, newStatus) {
    if (!userId || !newStatus) throw new Error("User ID and new status are required.");
    
    const projectDocRef = doc(db, "submissions", userId);
    try {
        await updateDoc(projectDocRef, {
            status: newStatus
        });
        console.log(`Status updated for user ${userId} to ${newStatus}`);
        return true;
    } catch (error) {
        console.error("Error updating status:", error);
        return false;
    }
}

// --- Function to delete a submission ---
async function deleteSubmission(submissionId) {
    try {
        await deleteDoc(doc(db, "submissions", submissionId));
        console.log(`Submission ${submissionId} deleted successfully.`);
        return true;
    } catch (err) {
        console.error("Failed to delete submission:", err);
        return false;
    }
}


// Export all functions (CORRECTED: removed duplicate deleteSubmission)
export { 
    auth, 
    db, 
    handleRegister, 
    handleLogin, 
    handleLogout, 
    checkAuthState,
    submitQuestionnaire,
    getUserProject,
    getAllSubmissions,
    updateProjectStatus,
    deleteSubmission
};