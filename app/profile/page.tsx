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

type FirebaseUser = {
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
};

type DbUser = {
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city: string;
  bio: string;
  isProvider: boolean;
  completedOrders: number;
  rating: number;
  safetyScore: string;
  createdAt?: string;
};

type DbProvider = {
  userEmail: string;
  category: string;
  experience: string;
  hourlyRate: string;
  bio: string;
  phone: string;
  city: string;
  servicesOffered: string[];
  status: 'active' | 'pending' | 'paused';
};
type StoredBooking = { id: string; bookingId?: string; providerEmail: string; providerName: string; providerCategory: string; providerPhoto?: string; customerEmail: string; customerName: string; date: string; time: string; status: string; createdAt: string };
type StoredReview = { id: string; providerEmail: string; authorName: string; rating: number; text: string; image?: string; createdAt: string };
type ProviderPhotoMap = Record<string, string[]>;

const SERVICE_CATEGORIES = [
  'Plumbing', 'Electrician', 'Home Cleaning', 'Painting', 
  'Photography', 'Tutoring', 'Beauty & Wellness', 'Carpentry',
  'Appliance Repair', 'AC Repair', 'Pest Control', 'Gardening'
];

export default function ProfilePage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'provider-hub' | 'bookings' | 'settings'>('overview');
  
  // Real DB States
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [dbProvider, setDbProvider] = useState<DbProvider | null>(null);
  const [localBookings, setLocalBookings] = useState<StoredBooking[]>([]);
  const [localReviews, setLocalReviews] = useState<StoredReview[]>([]);
  const [providerPhotos, setProviderPhotos] = useState<ProviderPhotoMap>({});
  const [portfolioMessage, setPortfolioMessage] = useState('');

  // Form States
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm, setProviderForm] = useState({
    category: 'Plumbing',
    experience: '2-5 years',
    hourlyRate: '499',
    bio: '',
    phone: '',
    city: 'Indiranagar, Bengaluru',
    servicesOffered: ['General Inspection & Repair', 'Emergency Fixes'],
  });
  const [submittingProvider, setSubmittingProvider] = useState(false);

  // Settings Form State
  const [bioInput, setBioInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const connect = () => {
      if (!window.firebase) {
        return window.setTimeout(connect, 50);
      }
      if (!window.firebase.apps?.length) {
        window.firebase.initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBFzj8N_5mGPeDd2wccqeq5JMWGLqESqog',
          authDomain: 'dark-foundry-222205.firebaseapp.com',
          databaseURL: 'https://dark-foundry-222205.firebaseio.com',
          projectId: 'dark-foundry-222205',
          storageBucket: 'dark-foundry-222205.firebasestorage.app',
          messagingSenderId: '687932477288',
          appId: '1:687932477288:web:50f6487bf56b3f174750dd',
        });
      }
      unsubscribe = window.firebase.auth().onAuthStateChanged((currentUser: FirebaseUser | null) => {
        setFirebaseUser(currentUser);
        if (currentUser && currentUser.email) {
          fetchMongoData(currentUser.email, currentUser.displayName || 'Servly User', currentUser.photoURL || null);
        } else {
          setLoading(false);
        }
      });
    };
    connect();
    return () => unsubscribe?.();
  }, []);

  const normalizeBookings = (bookings: StoredBooking[]) => bookings.map((booking) => ({
    ...booking,
    id: booking.id || booking.bookingId || `${booking.providerEmail}-${booking.date}-${booking.time}`,
  }));

  const loadActivity = async (email: string) => {
    try {
      const response = await fetch(`/api/activity?type=all&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok) {
        setLocalBookings(normalizeBookings(data.bookings || []));
        setLocalReviews(data.reviews || []);
        setProviderPhotos(data.providerPhotos || {});
      } else {
        console.warn('Activity API returned a non-ok status, keeping existing activity state', response.status, data);
      }
    } catch (error) {
      console.error('Failed loading MongoDB activity', error);
    }
  };

  const fetchMongoData = async (email: string, displayName: string, photoURL: string | null) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await res.json();
      if (data.user) {
        setDbUser(data.user);
        setBioInput(data.user.bio || '');
        setCityInput(data.user.city || 'Indiranagar, Bengaluru');
        if (data.provider) {
          setDbProvider(data.provider);
          setProviderForm({
            category: data.provider.category,
            experience: data.provider.experience,
            hourlyRate: data.provider.hourlyRate,
            bio: data.provider.bio,
            phone: data.provider.phone,
            city: data.provider.city,
            servicesOffered: data.provider.servicesOffered || [],
          });
        }
      }
      // Upsert latest Firebase displayName & photoURL to MongoDB
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, displayName, photoURL })
      });

      await loadActivity(normalizedEmail);
    } catch (err) {
      console.error('Failed fetching MongoDB profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProviderPhotos = async (nextPhotos: ProviderPhotoMap) => {
    setProviderPhotos(nextPhotos);
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail) return;
    const photos = nextPhotos[providerEmail] || [];
    const response = await fetch('/api/activity', {
      method: photos.length ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos.length ? { type: 'portfolio', providerEmail, photos } : { providerEmail, photos }),
    });
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    console.log('saveProviderPhotos response', response.status, data);
    if (!response.ok) {
      const message = data?.error || 'Unable to save portfolio to MongoDB';
      throw new Error(message);
    }
  };

  const compressImage = (file: File) => new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const reader = new FileReader();
    reader.onload = () => { image.src = String(reader.result); };
    reader.onerror = reject;
    image.onload = () => {
      const maxSize = 1280;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadPortfolioPhotos = async (files: FileList | null) => {
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail || !files?.length) return;
    const selectedFiles = Array.from(files).slice(0, 8);
    const uploaded = await Promise.all(selectedFiles.map(compressImage));
    const existing = providerPhotos[providerEmail] || [];
    await saveProviderPhotos({ ...providerPhotos, [providerEmail]: [...uploaded, ...existing].slice(0, 12) });
    setPortfolioMessage(`${uploaded.length} ${uploaded.length === 1 ? 'photo' : 'photos'} added to your SERVLY portfolio.`);
  };

  const removePortfolioPhoto = (index: number) => {
    const providerEmail = dbProvider?.userEmail || dbUser?.email;
    if (!providerEmail) return;
    const next = (providerPhotos[providerEmail] || []).filter((_, photoIndex) => photoIndex !== index);
    void saveProviderPhotos({ ...providerPhotos, [providerEmail]: next });
    setPortfolioMessage('Portfolio photo removed.');
  };

  const handleBecomeProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProvider(true);
    const email = (firebaseUser?.email || dbUser?.email || 'demo@servly.in').trim().toLowerCase();

    try {
      const res = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          ...providerForm
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDbUser(data.user);
        setDbProvider(data.provider);
        setShowProviderModal(false);
        setActiveTab('provider-hub');
      } else {
        alert(data.error || 'Failed to submit provider registration');
      }
    } catch (err) {
      console.error('Provider submission failed', err);
      alert(err instanceof Error ? err.message : 'Provider submission failed. Please try again.');
    } finally {
      setSubmittingProvider(false);
    }
  };

  const toggleProviderStatus = async () => {
    if (!dbUser) return;
    const newStatus = !dbUser.isProvider;
    try {
      const res = await fetch('/api/provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dbUser.email,
          isProvider: newStatus
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDbUser(data.user);
        if (dbProvider) {
          setDbProvider({ ...dbProvider, status: newStatus ? 'active' : 'paused' });
        }
      }
    } catch (err) {
      console.error('Failed toggling provider status', err);
    }
  };

  const saveSettings = async () => {
    if (!dbUser) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dbUser.email.trim().toLowerCase(),
          city: cityInput,
          bio: bioInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDbUser(data.user);
        alert('Profile details updated in MongoDB!');
      }
    } catch (err) {
      console.error('Failed saving profile', err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <>
        <FirebaseScripts />
        <div className="profile-loading-screen">
          <LoaderCircle className="spin" size={28} />
          <p>Loading Profile...</p>
        </div>
      </>
    );
  }

  const displayName = firebaseUser?.displayName || dbUser?.displayName || 'Servly Guest';
  const email = firebaseUser?.email || dbUser?.email || 'guest@servly.in';
  const photo = firebaseUser?.photoURL || dbUser?.photoURL;
  const isProviderActive = dbUser?.isProvider && dbProvider?.status === 'active';
  const customerBookings = localBookings.filter((booking) => booking.customerEmail === email);
  const providerBookings = dbProvider ? localBookings.filter((booking) => booking.providerEmail === dbProvider.userEmail) : [];
  const providerReviews = dbProvider ? localReviews.filter((review) => review.providerEmail === dbProvider.userEmail) : [];
  const portfolioPhotos = dbProvider ? (providerPhotos[dbProvider.userEmail] || []) : [];

  return (
    <main className="profile-wrapper">
      <FirebaseScripts />
      
      {/* Top Bar Navigation */}
      <header className="profile-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        <Link href="/" className="logo">
          serv<span>ly</span><i />
        </Link>
        {firebaseUser ? (
          <button onClick={() => window.firebase?.auth()?.signOut()} className="profile-signout-btn">
            <LogOut size={15} /> Sign out
          </button>
        ) : (
          <button 
            className="google-signin" 
            onClick={async () => {
              try {
                if (!window.firebase.apps?.length) {
                  window.firebase.initializeApp({
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBFzj8N_5mGPeDd2wccqeq5JMWGLqESqog',
                    authDomain: 'dark-foundry-222205.firebaseapp.com',
                    databaseURL: 'https://dark-foundry-222205.firebaseio.com',
                    projectId: 'dark-foundry-222205',
                    storageBucket: 'dark-foundry-222205.firebasestorage.app',
                    messagingSenderId: '687932477288',
                    appId: '1:687932477288:web:50f6487bf56b3f174750dd',
                  });
                }
                await window.firebase.auth().signInWithPopup(new window.firebase.auth.GoogleAuthProvider());
              } catch (e) {
                console.error(e);
              }
            }}
          >
            Sign in with Google
          </button>
        )}
      </header>

      <div className="profile-container">
        {/* TOP BANNER: BECOME A PROVIDER OPTION */}
        <section className={`provider-banner ${isProviderActive ? 'is-active-provider' : ''}`}>
          <div className="provider-banner-content">
            <div className="provider-badge-icon">
              {isProviderActive ? <ShieldCheck size={28} /> : <Briefcase size={28} />}
            </div>
            <div className="provider-banner-text">
              {isProviderActive ? (
                <>
                  <div className="badge-pill">Verified Servly Provider</div>
                  <h2>You are an active Service Provider!</h2>
                  <p>Accept booking requests in {dbProvider?.city || dbUser?.city}, manage your rates (₹{dbProvider?.hourlyRate}/hr), and grow your earnings.</p>
                </>
              ) : (
                <>
                  <div className="badge-pill highlight">Become a Partner</div>
                  <h2>Become a Service Provider on Servly</h2>
                  <p>Offer your services on Servly and reach local customers needing plumbing, electrical work, cleaning, tutoring & more.</p>
                </>
              )}
            </div>
          </div>
          <div className="provider-banner-actions">
            {isProviderActive ? (
              <div className="provider-controls">
                <button 
                  className="button button-dark" 
                  onClick={() => setActiveTab('provider-hub')}
                >
                  <Wrench size={16} /> Open Provider Dashboard
                </button>
                <button className="button-outline-light" onClick={toggleProviderStatus}>
                  Pause Provider Status
                </button>
              </div>
            ) : (
              <button 
                className="button button-provider" 
                onClick={() => setShowProviderModal(true)}
              >
                <Sparkles size={16} /> Apply to Become a Provider
              </button>
            )}
          </div>
        </section>

        {/* USER PROFILE HEADER CARD */}
        <section className="profile-card">
          <div className="profile-header">
            <div className="avatar-container">
              {photo ? (
                <Image src={photo} alt={displayName} width={88} height={88} className="profile-avatar" unoptimized />
              ) : (
                <div className="profile-avatar-fallback">{displayName.charAt(0).toUpperCase()}</div>
              )}
              {isProviderActive && (
                <span className="verified-check" title="Verified Provider">
                  <Check size={14} />
                </span>
              )}
              {customerBookings.length > 0 && (
                <span className="appointment-count-badge" title="Booked appointments">
                  {customerBookings.length}
                </span>
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{displayName}</h1>
                <span className={`role-badge ${isProviderActive ? 'provider' : 'customer'}`}>
                  {isProviderActive ? `Pro: ${dbProvider?.category}` : 'Customer Account'}
                </span>
              </div>
              <div className="profile-meta">
                <span><Mail size={14} /> {email}</span>
                <span><MapPin size={14} /> {dbUser?.city || 'Indiranagar, Bengaluru'}</span>
                <span><Clock size={14} /> Member since {new Date(dbUser?.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* PROFILE TABS */}
          <div className="profile-tabs">
            <button 
              className={activeTab === 'overview' ? 'active' : ''} 
              onClick={() => setActiveTab('overview')}
            >
              <UserIcon size={16} /> Profile Overview
            </button>
            {isProviderActive && (
              <button 
                className={activeTab === 'provider-hub' ? 'active' : ''} 
                onClick={() => setActiveTab('provider-hub')}
              >
                <Wrench size={16} /> Provider Dashboard
              </button>
            )}
            <button 
              className={activeTab === 'bookings' ? 'active' : ''} 
              onClick={() => setActiveTab('bookings')}
            >
              <Clock size={16} /> My Bookings
            </button>
            <button 
              className={activeTab === 'settings' ? 'active' : ''} 
              onClick={() => setActiveTab('settings')}
            >
              <Award size={16} /> Account Settings
            </button>
          </div>
        </section>

        {/* TAB CONTENTS */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="info-card">
                <h3>About Me</h3>
                <p>{dbUser?.bio || 'No bio added yet. Go to Account Settings to update your profile bio.'}</p>
                <div className="stats-subgrid">
                  <div>
                    <strong>{dbUser?.completedOrders ?? 0}</strong>
                    <span>Completed Orders</span>
                  </div>
                  <div>
                    <strong>{dbUser?.rating ?? 5.0} ★</strong>
                    <span>Rating Score</span>
                  </div>
                  <div>
                    <strong>{dbUser?.safetyScore || '100%'}</strong>
                    <span>Safety Score</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Account Status (MongoDB Synced)</h3>
                <ul className="privilege-list">
                  <li><CheckCircle2 size={16} className="text-green" /> Verified Servly Member Account</li>
                  <li><CheckCircle2 size={16} className="text-green" /> Standard Price protection & verified matching</li>
                  <li>
                    {isProviderActive ? (
                      <span className="flex-item"><CheckCircle2 size={16} className="text-green" /> Enrolled Provider: {dbProvider?.category}</span>
                    ) : (
                      <span className="flex-item muted"><AlertCircle size={16} /> Not a Provider yet (Click "Apply to Become a Provider" above)</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'provider-hub' && dbProvider && (
            <div className="provider-hub-view">
              <div className="hub-header">
                <div>
                  <h2>Provider Dashboard</h2>
                  <p>Connected to MongoDB Provider collection (`{dbProvider.userEmail}`)</p>
                </div>
                <span className="hub-status-tag">Status: <b>Active & Accepting Requests</b></span>
              </div>

              <div className="provider-stats-row">
                <div className="p-stat-card">
                  <DollarSign size={20} className="icon-orange" />
                  <div>
                    <label>Rate / Hour</label>
                    <strong>₹{dbProvider.hourlyRate} / hr</strong>
                  </div>
                </div>
                <div className="p-stat-card">
                  <Wrench size={20} className="icon-blue" />
                  <div>
                    <label>Primary Category</label>
                    <strong>{dbProvider.category}</strong>
                  </div>
                </div>
                <div className="p-stat-card">
                  <Award size={20} className="icon-green" />
                  <div>
                    <label>Experience</label>
                    <strong>{dbProvider.experience}</strong>
                  </div>
                </div>
              </div>

              <div className="info-card mt-20">
                <h3>Services You Provide</h3>
                <div className="services-tag-list">
                  {dbProvider.servicesOffered.map(s => (
                    <span key={s} className="service-tag"><Check size={14} /> {s}</span>
                  ))}
                  <button className="add-service-btn" onClick={() => setShowProviderModal(true)}>
                    <PlusCircle size={14} /> Edit Service Info
                  </button>
                </div>
              </div>

              <div className="portfolio-manager mt-20">
                <div className="portfolio-manager-head">
                  <div>
                    <span className="section-kicker"><Images size={14} /> Your portfolio</span>
                    <h3>Show customers your best work</h3>
                    <p>Upload up to 12 service photos. They appear on your home card and full profile.</p>
                  </div>
                  <label className="portfolio-upload-button">
                    <ImagePlus size={16} /> Add photos
                    <input type="file" accept="image/*" multiple onChange={(event) => uploadPortfolioPhotos(event.target.files)} />
                  </label>
                </div>
                {portfolioMessage && <p className="portfolio-message"><Check size={14} /> {portfolioMessage}</p>}
                {portfolioPhotos.length ? (
                  <div className="portfolio-grid">
                    {portfolioPhotos.map((portfolioPhoto, index) => (
                      <div className={`portfolio-photo ${index === 0 ? 'featured' : ''}`} key={`${portfolioPhoto.slice(-20)}-${index}`}>
                        <img src={portfolioPhoto} alt={`Service work ${index + 1}`} />
                        {index === 0 && <span className="portfolio-featured-tag">Featured on card</span>}
                        <button type="button" className="portfolio-delete" onClick={() => removePortfolioPhoto(index)} aria-label={`Remove service photo ${index + 1}`} title="Remove photo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="portfolio-empty">
                    <ImagePlus size={24} />
                    <strong>Build your visual portfolio</strong>
                    <span>Customers see real examples before they book.</span>
                    <input type="file" accept="image/*" multiple onChange={(event) => uploadPortfolioPhotos(event.target.files)} />
                  </label>
                )}
              </div>

              <div className="info-card mt-20">
                <h3>Incoming Appointment Requests</h3>
                {providerBookings.length ? (
                  <div className="profile-booking-list">
                    {providerBookings.map((booking) => (
                      <article key={booking.id} className="profile-booking-card">
                        <div>
                          <strong>{booking.customerName}</strong>
                          <p>{booking.providerCategory} appointment on {booking.date} at {booking.time}</p>
                        </div>
                        <span>{booking.status}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No incoming appointment requests yet.</p>
                )}
              </div>

              <div className="info-card mt-20">
                <h3>Reviews With Photos</h3>
                {providerReviews.length ? (
                  <div className="profile-review-grid">
                    {providerReviews.map((review) => (
                      <article key={review.id} className="profile-review-card">
                        {review.image && <img src={review.image} alt={`${review.authorName} review`} />}
                        <strong>{review.authorName} - {review.rating.toFixed(1)} stars</strong>
                        <p>{review.text}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No customer photo reviews yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="info-card">
              <h3>Your Bookings</h3>
              {customerBookings.length ? (
                <div className="profile-booking-list">
                  {customerBookings.map((booking) => (
                    <article key={booking.id} className="profile-booking-card with-photo">
                      {booking.providerPhoto && <img src={booking.providerPhoto} alt={booking.providerName} />}
                      <div>
                        <strong>{booking.providerName}</strong>
                        <p>{booking.providerCategory} appointment on {booking.date} at {booking.time}</p>
                      </div>
                      <span>{booking.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <>
                  <p className="muted-text">No active service bookings found yet. Explore local services on the home page!</p>
                  <Link href="/" className="button button-dark mt-15" style={{ display: 'inline-flex' }}>
                    Explore Services
                  </Link>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="info-card">
              <h3>Update Account Profile</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email} readOnly className="input-field" />
                </div>
                <div className="form-group">
                  <label>City / Neighborhood</label>
                  <input 
                    type="text" 
                    value={cityInput} 
                    onChange={(e) => setCityInput(e.target.value)}
                    className="input-field" 
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="input-field textarea" 
                    rows={3}
                  />
                </div>
                <button className="button button-dark" onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? <LoaderCircle className="spin" size={14} /> : <Check size={14} />}
                  {savingSettings ? 'Saving to MongoDB...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BECOME A PROVIDER MODAL */}
      {showProviderModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Become a Servly Provider</h2>
              <button className="close-btn" onClick={() => setShowProviderModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBecomeProviderSubmit} className="provider-form">
              <p className="modal-sub">Register as a provider to list your services, set your hourly rate, and accept customer bookings.</p>

              <div className="form-group">
                <label>Primary Service Category</label>
                <select 
                  className="input-field" 
                  value={providerForm.category}
                  onChange={(e) => setProviderForm({ ...providerForm, category: e.target.value })}
                >
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Years of Experience</label>
                  <select 
                    className="input-field" 
                    value={providerForm.experience}
                    onChange={(e) => setProviderForm({ ...providerForm, experience: e.target.value })}
                  >
                    <option value="1-2 years">1-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Rate (₹ / hr)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={providerForm.hourlyRate}
                    onChange={(e) => setProviderForm({ ...providerForm, hourlyRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="+91 98765 43210" 
                  value={providerForm.phone}
                  onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Work Location / City</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={providerForm.city}
                  onChange={(e) => setProviderForm({ ...providerForm, city: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio & Specialization</label>
                <textarea 
                  className="input-field textarea" 
                  rows={3}
                  placeholder="Describe your specialization, tools, and service quality..."
                  value={providerForm.bio}
                  onChange={(e) => setProviderForm({ ...providerForm, bio: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="button-outline" onClick={() => setShowProviderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-provider" disabled={submittingProvider}>
                  {submittingProvider ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}
                  {submittingProvider ? 'Saving to MongoDB...' : 'Complete Provider Registration'}
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
      <Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js" strategy="afterInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-auth-compat.js" strategy="afterInteractive" />
    </>
  );
}
