import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyA56I0XR65lR7HBvck0mPcqcUToeasd9g",
  authDomain: "material-sync-790c5.firebaseapp.com",
  projectId: "material-sync-790c5",
  storageBucket: "material-sync-790c5.firebasestorage.app",
  messagingSenderId: "237226178462",
  appId: "1:237226178462:web:11b99dc7a077d9c251488f",
  measurementId: "G-C90VMFD78B"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export interface MasterUserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'Catalog Master';
  organization: string;
  designation: string;
  dscCleared: boolean;
}

export const DEMO_CATALOG_MASTER: MasterUserData = {
  uid: 'cpse-master-001',
  email: 'catalog.master@ongc.in',
  displayName: 'Chaitanya',
  role: 'Catalog Master',
  organization: 'ONGC Central Master Data Cell (HQ)',
  designation: 'Chief Data Steward & Taxonomy Lead',
  dscCleared: true,
};

// Sign in with Firebase Email & Password
export const firebaseSignIn = async (email: string, pass: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
};

// Sign in with Google Pop-up
export const firebaseGoogleSignIn = async (): Promise<User> => {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
};

// Sign up new Catalog Master with Firebase Email & Password
export const firebaseSignUp = async (email: string, pass: string, name: string): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential.user;
};

// Quick Demo Authentication for Judges / Evaluators
export const firebaseDemoSignIn = async (): Promise<MasterUserData> => {
  try {
    // Attempt anonymous sign-in in Firebase for real session tracking
    await signInAnonymously(auth);
  } catch (err) {
    console.warn('Anonymous firebase auth skipped, using local demo master session', err);
  }
  // Store demo master session in localStorage
  localStorage.setItem('materialsync_master_session', JSON.stringify(DEMO_CATALOG_MASTER));
  return DEMO_CATALOG_MASTER;
};

// Sign Out
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Signout error', e);
  }
  localStorage.removeItem('materialsync_master_session');
};

// Check if user currently has active Master session
export const getActiveMasterSession = (): MasterUserData | null => {
  const cached = localStorage.getItem('materialsync_master_session');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};
