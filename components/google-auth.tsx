'use client';

import { LogOut, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';
import { useEffect, useState } from 'react';

type FirebaseUser = { displayName?: string | null; photoURL?: string | null; email?: string | null };
declare global { interface Window { firebase?: any } }

const firebaseConfig = {
  apiKey: 'AIzaSyBFzj8N_5mGPeDd2wccqeq5JMWGLqESqog', authDomain: 'dark-foundry-222205.firebaseapp.com',
  databaseURL: 'https://dark-foundry-222205.firebaseio.com', projectId: 'dark-foundry-222205',
  storageBucket: 'dark-foundry-222205.firebasestorage.app', messagingSenderId: '687932477288', appId: '1:687932477288:web:50f6487bf56b3f174750dd',
};

export default function GoogleAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const connect = () => {
      if (!window.firebase) return window.setTimeout(connect, 100);
      if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
      unsubscribe = window.firebase.auth().onAuthStateChanged((currentUser: FirebaseUser | null) => { setUser(currentUser); setLoading(false); });
    };
    connect(); return () => unsubscribe?.();
  }, []);

  const login = async () => {
    setBusy(true);
    try { await window.firebase.auth().signInWithPopup(new window.firebase.auth.GoogleAuthProvider()); }
    catch (error) { console.error('Google sign-in failed', error); alert('Google sign-in could not be completed. Please check your Firebase configuration.'); }
    finally { setBusy(false); }
  };

  if (loading) return <><FirebaseScripts/><div className="auth-loading" aria-label="Checking sign-in status"><LoaderCircle size={15}/></div></>;
  if (!user) return <><FirebaseScripts/><button className="google-signin" onClick={login} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16}/> : <GoogleMark/>}{busy ? 'Opening Google…' : 'Continue with Google'}</button></>;

  return <><FirebaseScripts/><div className="user-menu" title={user.email ?? undefined}>
    {user.photoURL ? <Image src={user.photoURL} alt="" width={32} height={32} className="user-avatar" unoptimized/> : <span className="avatar-fallback">{user.displayName?.charAt(0) ?? 'S'}</span>}
    <span className="user-name">{user.displayName?.split(' ')[0] ?? 'Servly member'}</span>
    <button onClick={() => window.firebase.auth().signOut()} aria-label="Sign out" className="signout"><LogOut size={14}/></button>
  </div></>;
}

function FirebaseScripts() { return <><Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js" strategy="afterInteractive"/><Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-auth-compat.js" strategy="afterInteractive"/></> }

function GoogleMark() { return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.2c0-.7-.06-1.36-.18-2H12v3.79h5.24a4.48 4.48 0 0 1-1.94 2.94v2.46h3.14c1.84-1.7 2.91-4.2 2.91-7.19Z"/><path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.44-2.31l-3.14-2.46c-.87.58-1.99.93-3.3.93-2.53 0-4.68-1.71-5.45-4.01H3.3v2.53A9.72 9.72 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.55 13.85a5.84 5.84 0 0 1 0-3.7V7.62H3.3a9.7 9.7 0 0 0 0 8.76l3.25-2.53Z"/><path fill="#EA4335" d="M12 6.14c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.82 3.19 14.62 2.3 12 2.3a9.72 9.72 0 0 0-8.7 5.32l3.25 2.53C7.32 7.85 9.47 6.14 12 6.14Z"/></svg> }
