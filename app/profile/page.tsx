'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import {
  ArrowLeft, Briefcase, CheckCircle2, ShieldCheck,
  MapPin, Clock, Award, User as UserIcon, Mail, Wrench, Sparkles,
  DollarSign, AlertCircle, PlusCircle, Check, LoaderCircle, LogOut, ImagePlus, Trash2, Images
} from 'lucide-react';

type FirebaseUser = { displayName?: string | null; photoURL?: string | null; email?: string | null };
type DbUser = { email: string; displayName: string; photoURL?: string; phone?: string; city: string; bio: string; isProvider: boolean; completedOrders: number; rating: number; safetyScore: string; createdAt?: string };
type DbProvider = { userEmail: string; category: string; experience: string; hourlyRate: string; bio: string; phone: string; city: string; servicesOffered: string[]; status: 'active' | 'pending' | 'paused' };
type StoredBooking = { id: string; bookingId?: string; providerEmail: string; providerName: string; providerCategory: string; providerPhoto?: string; customerEmail: string; customerName: string; date: string; time: string; status: string; createdAt: string };
type StoredReview = { id: string; providerEmail: string; authorName: string; rating: number; text: string; image?: string; createdAt: string };
type ProviderPhotoMap = Record<string, string[]>;

const SERVICE_CATEGORIES = ['Plumbing','Electrician','Home Cleaning','Painting','Photography','Tutoring','Beauty & Wellness','Carpentry','Appliance Repair','AC Repair','Pest Control','Gardening'];

const FB_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBFzj8N_5mGPeDd2wccqeq5JMWGLqESqog',
  authDomain: 'dark-foundry-222205.firebaseapp.com',
  databaseURL: 'https://dark-foundry-222205.firebaseio.com',
  projectId: 'dark-foundry-222205',
  storageBucket: 'dark-foundry-222205.firebasestorage.app',
  messagingSenderId: '687932477288',
  appId: '1:687932477288:web:50f6487bf56b3f174750dd',
};

function initFirebase() {
  if (!window.firebase) return;
  if (!window.firebase.apps?.length) window.firebase.initializeApp(FB_CONFIG);
}

export default function ProfilePage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'provider-hub' | 'bookings' | 'settings'>('overview');
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [dbProvider, setDbProvider] = useState<DbProvider | null>(null);
  const [localBookings, setLocalBookings] = useState<StoredBooking[]>([]);
  const [localReviews, setLocalReviews] = useState<StoredReview[]>([]);
  const [providerPhotos, setProviderPhotos] = useState<ProviderPhotoMap>({});
  const [portfolioMessage, setPortfolioMessage] = useState('');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm, setProviderForm] = useState({ category: 'Plumbing', experience: '2-5 years', hourlyRate: '499', bio: '', phone: '', city: 'Indiranagar, Bengaluru', servicesOffered: ['General Inspection & Repair', 'Emergency Fixes'] });
  const [submittingProvider, setSubmittingProvider] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const connect = () => {
      if (!window.firebase) { window.setTimeout(connect, 50); return; }
      initFirebase();
      unsubscribe = window.firebase.auth().onAuthStateChanged((currentUser: FirebaseUser | null) => {
        setFirebaseUser(currentUser);
        if (currentUser?.email) {
          loadProfile(currentUser.email, currentUser.displayName || '', currentUser.photoURL || null);
        } else {
          setLoading(false);
        }
      });
    };
    connect();
    return () => unsubscribe?.();
  }, []);

  const loadProfile = async (email: string, displayName: string, photoURL: string | null) => {
    const e = email.trim().toLowerCase();

    // Fire profile fetch and activity fetch IN PARALLEL — not sequential
    const [profileRes, activityRes] = await Promise.all([
      fetch(`/api/profile?email=${encodeURIComponent(e)}`),
      fetch(`/api/activity?type=all&email=${encodeURIComponent(e)}`),
    ]);

    const [profileData, activityData] = await Promise.all([
      profileRes.json().catch(() => ({})),
      activityRes.json().catch(() => ({})),
    ]);

    // Apply profile data
    if (profileData.user) {
      setDbUser(profileData.user);
      setBioInput(profileData.user.bio || '');
      setCityInput(profileData.user.city || 'Indiranagar, Bengaluru');
    }
    if (profileData.provider) {
      setDbProvider(profileData.provider);
      setProviderForm({
        category: profileData.provider.category,
        experience: profileData.provider.experience,
        hourlyRate: profileData.provider.hourlyRate,
        bio: profileData.provider.bio,
        phone: profileData.provider.phone,
        city: profileData.provider.city,
        servicesOffered: profileData.provider.servicesOffered || [],
      });
    }

    // Apply activity data
    if (activityData.bookings) {
      setLocalBookings(activityData.bookings.map((b: StoredBooking) => ({ ...b, id: b.id || b.bookingId || `${b.providerEmail}-${b.date}` })));
    }
    if (activityData.reviews) setLocalReviews(activityData.reviews);
    if (activityData.providerPhotos) setProviderPhotos(activityData.providerPhotos);

    // Show UI immediately — upsert runs in background, doesn't block render
    setLoading(false);

    // Background upsert — fire and forget, no await
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, displayName, photoURL }),
    }).catch(() => {});
  };

  const saveProviderPhotos = async (nextPhotos: ProviderPhotoMap) => {
    setProviderPhotos(nextPhotos);
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail) return;
    const photos = nextPhotos[providerEmail] || [];
    const res = await fetch('/api/activity', {
      method: photos.length ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos.length ? { type: 'portfolio', providerEmail, photos } : { providerEmail, photos }),
    });
    if (!res.ok) throw new Error('Unable to save portfolio');
  };

  const compressImage = (file: File) => new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadPortfolioPhotos = async (files: FileList | null) => {
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail || !files?.length) return;
    const uploaded = await Promise.all(Array.from(files).slice(0, 8).map(compressImage));
    const existing = providerPhotos[providerEmail] || [];
    await saveProviderPhotos({ ...providerPhotos, [providerEmail]: [...uploaded, ...existing].slice(0, 12) });
    setPortfolioMessage(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} added.`);
  };

  const removePortfolioPhoto = (index: number) => {
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail) return;
    const next = (providerPhotos[providerEmail] || []).filter((_, i) => i !== index);
    void saveProviderPhotos({ ...providerPhotos, [providerEmail]: next });
    setPortfolioMessage('Photo removed.');
  };

  const handleBecomeProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProvider(true);
    const email = (firebaseUser?.email || dbUser?.email || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/provider', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, ...providerForm }) });
      const data = await res.json();
      if (res.ok) { setDbUser(data.user); setDbProvider(data.provider); setShowProviderModal(false); setActiveTab('provider-hub'); }
      else alert(data.error || 'Failed to submit provider registration');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Provider submission failed.');
    } finally {
      setSubmittingProvider(false);
    }
  };

  const toggleProviderStatus = async () => {
    if (!dbUser) return;
    const newStatus = !dbUser.isProvider;
    const res = await fetch('/api/provider', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: dbUser.email, isProvider: newStatus }) });
    const data = await res.json();
    if (res.ok) { setDbUser(data.user); if (dbProvider) setDbProvider({ ...dbProvider, status: newStatus ? 'active' : 'paused' }); }
  };

  const saveSettings = async () => {
    if (!dbUser) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: dbUser.email.trim().toLowerCase(), city: cityInput, bio: bioInput }) });
      const data = await res.json();
      if (res.ok) { setDbUser(data.user); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <>
        <FirebaseScripts />
        <div className="profile-loading-screen">
          <div className="profile-skeleton-nav" />
          <div className="profile-skeleton-banner" />
          <div className="profile-skeleton-card" />
        </div>
      </>
    );
  }

  const displayName = firebaseUser?.displayName || dbUser?.displayName || 'Servly Guest';
  const email = firebaseUser?.email || dbUser?.email || 'guest@servly.in';
  const photo = firebaseUser?.photoURL || dbUser?.photoURL;
  const isProviderActive = dbUser?.isProvider && dbProvider?.status === 'active';
  const customerBookings = localBookings.filter(b => b.customerEmail === email);
  const providerBookings = dbProvider ? localBookings.filter(b => b.providerEmail === dbProvider.userEmail) : [];
  const providerReviews = dbProvider ? localReviews.filter(r => r.providerEmail === dbProvider.userEmail) : [];
  const portfolioPhotos = dbProvider ? (providerPhotos[dbProvider.userEmail] || []) : [];

  return (
    <main className="profile-wrapper">
      <FirebaseScripts />

      <header className="profile-nav">
        <Link href="/" className="back-link"><ArrowLeft size={18} /><span>Back</span></Link>
        <Link href="/" className="logo">serv<span>ly</span><i /></Link>
        {firebaseUser ? (
          <button onClick={() => window.firebase?.auth()?.signOut()} className="profile-signout-btn"><LogOut size={15} /> Sign out</button>
        ) : (
          <button className="google-signin" onClick={async () => { try { initFirebase(); await window.firebase.auth().signInWithPopup(new window.firebase.auth.GoogleAuthProvider()); } catch (e) { console.error(e); } }}>Sign in with Google</button>
        )}
      </header>

      <div className="profile-container">
        <section className={`provider-banner ${isProviderActive ? 'is-active-provider' : ''}`}>
          <div className="provider-banner-content">
            <div className="provider-badge-icon">{isProviderActive ? <ShieldCheck size={28} /> : <Briefcase size={28} />}</div>
            <div className="provider-banner-text">
              {isProviderActive ? (
                <><div className="badge-pill">Verified Servly Provider</div><h2>You are an active Service Provider!</h2><p>Accept bookings in {dbProvider?.city || dbUser?.city}, rate ₹{dbProvider?.hourlyRate}/hr.</p></>
              ) : (
                <><div className="badge-pill highlight">Become a Partner</div><h2>Become a Service Provider on Servly</h2><p>Reach local customers needing plumbing, cleaning, tutoring & more.</p></>
              )}
            </div>
          </div>
          <div className="provider-banner-actions">
            {isProviderActive ? (
              <div className="provider-controls">
                <button className="button button-dark" onClick={() => setActiveTab('provider-hub')}><Wrench size={16} /> Provider Dashboard</button>
                <button className="button-outline-light" onClick={toggleProviderStatus}>Pause Status</button>
              </div>
            ) : (
              <button className="button button-provider" onClick={() => setShowProviderModal(true)}><Sparkles size={16} /> Apply to Become a Provider</button>
            )}
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-header">
            <div className="avatar-container">
              {photo ? <Image src={photo} alt={displayName} width={88} height={88} className="profile-avatar" unoptimized /> : <div className="profile-avatar-fallback">{displayName.charAt(0).toUpperCase()}</div>}
              {isProviderActive && <span className="verified-check" title="Verified Provider"><Check size={14} /></span>}
              {customerBookings.length > 0 && <span className="appointment-count-badge">{customerBookings.length}</span>}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{displayName}</h1>
                <span className={`role-badge ${isProviderActive ? 'provider' : 'customer'}`}>{isProviderActive ? `Pro: ${dbProvider?.category}` : 'Customer'}</span>
              </div>
              <div className="profile-meta">
                <span><Mail size={14} /> {email}</span>
                <span><MapPin size={14} /> {dbUser?.city || 'Bengaluru'}</span>
                <span><Clock size={14} /> Since {new Date(dbUser?.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>
          <div className="profile-tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><UserIcon size={16} /> Overview</button>
            {isProviderActive && <button className={activeTab === 'provider-hub' ? 'active' : ''} onClick={() => setActiveTab('provider-hub')}><Wrench size={16} /> Dashboard</button>}
            <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}><Clock size={16} /> Bookings {customerBookings.length > 0 && <span className="tab-count">{customerBookings.length}</span>}</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Award size={16} /> Settings</button>
          </div>
        </section>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="info-card">
                <h3>About Me</h3>
                <p>{dbUser?.bio || 'No bio yet. Add one in Settings.'}</p>
                <div className="stats-subgrid">
                  <div><strong>{dbUser?.completedOrders ?? 0}</strong><span>Orders</span></div>
                  <div><strong>{dbUser?.rating ?? 5.0} ★</strong><span>Rating</span></div>
                  <div><strong>{dbUser?.safetyScore || '100%'}</strong><span>Safety</span></div>
                </div>
              </div>
              <div className="info-card">
                <h3>Account Status</h3>
                <ul className="privilege-list">
                  <li><CheckCircle2 size={16} className="text-green" /> Verified Servly Member</li>
                  <li><CheckCircle2 size={16} className="text-green" /> Price protection & verified matching</li>
                  <li>{isProviderActive ? <span className="flex-item"><CheckCircle2 size={16} className="text-green" /> Provider: {dbProvider?.category}</span> : <span className="flex-item muted"><AlertCircle size={16} /> Not a Provider yet</span>}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'provider-hub' && dbProvider && (
            <div className="provider-hub-view">
              <div className="hub-header">
                <div><h2>Provider Dashboard</h2><p>{dbProvider.userEmail}</p></div>
                <span className="hub-status-tag">Active & Accepting</span>
              </div>
              <div className="provider-stats-row">
                <div className="p-stat-card"><DollarSign size={20} className="icon-orange" /><div><label>Rate / Hour</label><strong>₹{dbProvider.hourlyRate}/hr</strong></div></div>
                <div className="p-stat-card"><Wrench size={20} className="icon-blue" /><div><label>Category</label><strong>{dbProvider.category}</strong></div></div>
                <div className="p-stat-card"><Award size={20} className="icon-green" /><div><label>Experience</label><strong>{dbProvider.experience}</strong></div></div>
              </div>
              <div className="info-card mt-20">
                <h3>Services You Provide</h3>
                <div className="services-tag-list">
                  {dbProvider.servicesOffered.map(s => <span key={s} className="service-tag"><Check size={14} /> {s}</span>)}
                  <button className="add-service-btn" onClick={() => setShowProviderModal(true)}><PlusCircle size={14} /> Edit</button>
                </div>
              </div>
              <div className="portfolio-manager mt-20">
                <div className="portfolio-manager-head">
                  <div><span className="section-kicker"><Images size={14} /> Portfolio</span><h3>Show your best work</h3><p>Up to 12 photos shown on your profile card.</p></div>
                  <label className="portfolio-upload-button"><ImagePlus size={16} /> Add photos<input type="file" accept="image/*" multiple onChange={e => uploadPortfolioPhotos(e.target.files)} /></label>
                </div>
                {portfolioMessage && <p className="portfolio-message"><Check size={14} /> {portfolioMessage}</p>}
                {portfolioPhotos.length ? (
                  <div className="portfolio-grid">
                    {portfolioPhotos.map((p, i) => (
                      <div className={`portfolio-photo ${i === 0 ? 'featured' : ''}`} key={`${p.slice(-20)}-${i}`}>
                        <img src={p} alt={`Work ${i + 1}`} />
                        {i === 0 && <span className="portfolio-featured-tag">Featured</span>}
                        <button type="button" className="portfolio-delete" onClick={() => removePortfolioPhoto(i)}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="portfolio-empty"><ImagePlus size={24} /><strong>Build your portfolio</strong><span>Customers see examples before booking.</span><input type="file" accept="image/*" multiple onChange={e => uploadPortfolioPhotos(e.target.files)} /></label>
                )}
              </div>
              <div className="info-card mt-20">
                <h3>Incoming Requests</h3>
                {providerBookings.length ? (
                  <div className="profile-booking-list">
                    {providerBookings.map(b => <article key={b.id} className="profile-booking-card"><div><strong>{b.customerName}</strong><p>{b.providerCategory} on {b.date} at {b.time}</p></div><span>{b.status}</span></article>)}
                  </div>
                ) : <p>No incoming requests yet.</p>}
              </div>
              <div className="info-card mt-20">
                <h3>Reviews</h3>
                {providerReviews.length ? (
                  <div className="profile-review-grid">
                    {providerReviews.map(r => <article key={r.id} className="profile-review-card">{r.image && <img src={r.image} alt={r.authorName} />}<strong>{r.authorName} — {r.rating.toFixed(1)} ★</strong><p>{r.text}</p></article>)}
                  </div>
                ) : <p>No reviews yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="info-card">
              <h3>Your Bookings</h3>
              {customerBookings.length ? (
                <div className="profile-booking-list">
                  {customerBookings.map(b => (
                    <article key={b.id} className="profile-booking-card with-photo">
                      {b.providerPhoto && <img src={b.providerPhoto} alt={b.providerName} />}
                      <div><strong>{b.providerName}</strong><p>{b.providerCategory} · {b.date} at {b.time}</p></div>
                      <span>{b.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <><p className="muted-text">No bookings yet. Explore services on the home page!</p><Link href="/" className="button button-dark mt-15" style={{ display: 'inline-flex' }}>Explore Services</Link></>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="info-card">
              <h3>Account Settings</h3>
              <div className="settings-form">
                <div className="form-group"><label>Email</label><input type="email" value={email} readOnly className="input-field" /></div>
                <div className="form-group"><label>City / Neighborhood</label><input type="text" value={cityInput} onChange={e => setCityInput(e.target.value)} className="input-field" /></div>
                <div className="form-group"><label>Bio</label><textarea value={bioInput} onChange={e => setBioInput(e.target.value)} className="input-field textarea" rows={3} /></div>
                <button className="button button-dark" onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? <><LoaderCircle className="spin" size={14} /> Saving…</> : settingsSaved ? <><Check size={14} /> Saved!</> : <><Check size={14} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProviderModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header"><h2>Become a Servly Provider</h2><button className="close-btn" onClick={() => setShowProviderModal(false)}>✕</button></div>
            <form onSubmit={handleBecomeProviderSubmit} className="provider-form">
              <p className="modal-sub">Register to list your services, set your rate, and accept bookings.</p>
              <div className="form-group"><label>Service Category</label><select className="input-field" value={providerForm.category} onChange={e => setProviderForm({ ...providerForm, category: e.target.value })}>{SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-row">
                <div className="form-group"><label>Experience</label><select className="input-field" value={providerForm.experience} onChange={e => setProviderForm({ ...providerForm, experience: e.target.value })}><option value="1-2 years">1-2 years</option><option value="2-5 years">2-5 years</option><option value="5-10 years">5-10 years</option><option value="10+ years">10+ years</option></select></div>
                <div className="form-group"><label>Rate (₹/hr)</label><input type="number" className="input-field" value={providerForm.hourlyRate} onChange={e => setProviderForm({ ...providerForm, hourlyRate: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Phone</label><input type="tel" className="input-field" placeholder="+91 98765 43210" value={providerForm.phone} onChange={e => setProviderForm({ ...providerForm, phone: e.target.value })} required /></div>
              <div className="form-group"><label>City</label><input type="text" className="input-field" value={providerForm.city} onChange={e => setProviderForm({ ...providerForm, city: e.target.value })} required /></div>
              <div className="form-group"><label>Bio & Specialization</label><textarea className="input-field textarea" rows={3} placeholder="Describe your specialization..." value={providerForm.bio} onChange={e => setProviderForm({ ...providerForm, bio: e.target.value })} /></div>
              <div className="modal-footer">
                <button type="button" className="button-outline" onClick={() => setShowProviderModal(false)}>Cancel</button>
                <button type="submit" className="button button-provider" disabled={submittingProvider}>
                  {submittingProvider ? <><LoaderCircle className="spin" size={16} /> Saving…</> : <><CheckCircle2 size={16} /> Complete Registration</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function FirebaseScripts() {
  return (
    <>
      <Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-auth-compat.js" strategy="beforeInteractive" />
    </>
  );
}
