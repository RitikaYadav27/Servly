'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import GoogleAuth from '../components/google-auth';
import { motion, useScroll, useSpring, type Variants } from 'framer-motion';
import { ArrowRight, BadgeCheck, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, CirclePlay, Clock3, CreditCard, Flame, ImagePlus, Images, LoaderCircle, Menu, Navigation, Search, Send, SlidersHorizontal, Star, MapPin, ShieldCheck, Sparkles, X, Wrench, Zap, Paintbrush, Camera, GraduationCap, HeartHandshake, Users, Bot, Instagram, Linkedin, Twitter, type LucideIcon } from 'lucide-react';

const HeroScene = dynamic(() => import('../components/hero-scene'), { ssr: false });

type FirebaseUser = { displayName?: string | null; photoURL?: string | null; email?: string | null };
type ProviderRecord = {
  userEmail: string;
  category: string;
  experience: string;
  hourlyRate: string;
  bio: string;
  phone: string;
  city: string;
  servicesOffered: string[];
  status: string;
  displayName: string;
  photoURL?: string;
  rating: number;
};
type StoredReview = { id: string; providerEmail: string; authorName: string; rating: number; text: string; image?: string; createdAt: string };
type StoredBooking = { id: string; bookingId?: string; providerEmail: string; providerName: string; providerCategory: string; providerPhoto?: string; customerEmail: string; customerName: string; date: string; time: string; status: string; createdAt: string };
type ProviderPhotoMap = Record<string, string[]>;

declare global { interface Window { firebase?: any } }

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBFzj8N_5mGPeDd2wccqeq5JMWGLqESqog',
  authDomain: 'dark-foundry-222205.firebaseapp.com',
  databaseURL: 'https://dark-foundry-222205.firebaseio.com',
  projectId: 'dark-foundry-222205',
  storageBucket: 'dark-foundry-222205.firebasestorage.app',
  messagingSenderId: '687932477288',
  appId: '1:687932477288:web:50f6487bf56b3f174750dd',
};

const revealEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const heroEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const reveal: Variants = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: .7, ease: revealEase } } };
const services: Array<[name: string, Icon: LucideIcon, sub: string]> = [
  ['Plumbing', Wrench, 'From ₹199'], ['Electrician', Zap, 'From ₹249'], ['Cleaning', Sparkles, 'From ₹399'], ['Painting', Paintbrush, 'From ₹999'], ['Photography', Camera, 'From ₹799'], ['Tutoring', GraduationCap, 'From ₹299'], ['Beauty at home', HeartHandshake, 'From ₹499'], ['15+ more', ChevronRight, 'Explore all'],
];
const stats = [['100K+', 'verified professionals'], ['1M+', 'services completed'], ['500+', 'cities in reach'], ['4.9★', 'customer love score']];
const categories = ['Plumbing','Electrician','Carpentry','Home Cleaning','Painting','Beauty','Makeup Artist','Mehndi Artist','Photography','Tutors','Packers & Movers','Car Wash','Pest Control','Laundry','Gardening','Pet Care','Event Décor','AC Repair','Appliance Repair'];
const audience = [['Homeowners','Care that keeps every corner running.'],['Students','Dependable help around a busy schedule.'],['Working professionals','Your time, beautifully protected.'],['Families','The little things, effortlessly handled.'],['Small businesses','A reliable operations partner nearby.'],['Event organizers','Every detail, delivered in time.']];
const serviceCategories = ['Plumbing', 'Electrician', 'Home Cleaning', 'Painting', 'Photography', 'Tutoring', 'Beauty & Wellness', 'Carpentry', 'Appliance Repair', 'AC Repair'];
const categoryIcons: Record<string, LucideIcon> = {
  Plumbing: Wrench,
  Electrician: Zap,
  'Home Cleaning': Sparkles,
  Painting: Paintbrush,
  Photography: Camera,
  Tutoring: GraduationCap,
  'Beauty & Wellness': HeartHandshake,
  Carpentry: Wrench,
  'Appliance Repair': Zap,
  'AC Repair': Sparkles,
};
const discoveryCategories = [
  { name: 'Plumbing', subtitle: 'Leak fixes & installations', price: 'from Rs 199', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Home Cleaning', subtitle: 'Deep cleaning, sofa & kitchen', price: 'from Rs 399', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Painting', subtitle: 'Premium walls & texture work', price: 'from Rs 999', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Electrician', subtitle: 'Switchboards & smart lighting', price: 'from Rs 249', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Photography', subtitle: 'Events, portraits & products', price: 'from Rs 799', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Beauty & Wellness', subtitle: 'Salon-grade self-care at home', price: 'from Rs 499', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80' },
];

function Button({ children, dark = false }: {children: ReactNode, dark?: boolean}) { return <button className={dark ? 'button button-dark' : 'button'}>{children}<ArrowRight size={16}/></button> }

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecord | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentSlot, setAppointmentSlot] = useState('10:00 AM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [providerPhotos, setProviderPhotos] = useState<ProviderPhotoMap>({});
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewImage, setReviewImage] = useState('');
  const [servicePhotoMessage, setServicePhotoMessage] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [location, setLocation] = useState('Indiranagar, Bengaluru');
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { scrollYProgress } = useScroll(); const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let timer: number | undefined;

    const connect = () => {
      if (!window.firebase) {
        timer = window.setTimeout(connect, 250);
        return;
      }
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      unsubscribe = window.firebase.auth().onAuthStateChanged((currentUser: FirebaseUser | null) => {
        setUser(currentUser);
      });
    };

    connect();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`Near ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
        },
        () => undefined,
      );
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoadingProviders(true);
        const response = await fetch('/api/providers');
        const data = await response.json();
        setProviders(data.providers || []);
      } catch (error) {
        console.error('Failed to load providers', error);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  useEffect(() => {
    try {
      setReviews(JSON.parse(localStorage.getItem('servly-reviews') || '[]'));
      setProviderPhotos(JSON.parse(localStorage.getItem('servly-provider-photos') || '{}'));
    } catch (error) {
      console.error('Failed to load local SERVLY activity', error);
    }
  }, []);

  useEffect(() => {
    const loadProviderPhotos = async () => {
      try {
        const response = await fetch('/api/activity?type=all');
        if (!response.ok) throw new Error('Provider media unavailable');
        const data = await response.json();
        if (data.providerPhotos) {
          setProviderPhotos(data.providerPhotos);
          localStorage.setItem('servly-provider-photos', JSON.stringify(data.providerPhotos));
        }
      } catch (error) {
        console.error('Failed loading provider photos from MongoDB', error);
      }
    };

    void loadProviderPhotos();
  }, []);

  const saveReviews = (nextReviews: StoredReview[]) => {
    setReviews(nextReviews);
    localStorage.setItem('servly-reviews', JSON.stringify(nextReviews));
  };

  const saveProviderPhotos = (nextPhotos: ProviderPhotoMap) => {
    setProviderPhotos(nextPhotos);
    localStorage.setItem('servly-provider-photos', JSON.stringify(nextPhotos));
  };

  const persistProviderPhotos = async (providerEmail: string, photos: string[]) => {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'portfolio', providerEmail, photos }),
    });
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    console.log('persistProviderPhotos response', response.status, data);
    if (!response.ok) {
      throw new Error(data?.error || `Unable to save provider photos to MongoDB (${response.status})`);
    }
    return data;
  };

  const persistBooking = async (booking: StoredBooking) => {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking', ...booking, bookingId: booking.id }),
    });
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    console.log('persistBooking response', response.status, data);
    if (!response.ok) {
      throw new Error(data?.error || `Unable to save booking to MongoDB (${response.status})`);
    }
    return data;
  };

  const submitReview = () => {
    if (!selectedProvider || !reviewText.trim()) return;
    const nextReview: StoredReview = {
      id: `${Date.now()}-${selectedProvider.userEmail}`,
      providerEmail: selectedProvider.userEmail,
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Servly user',
      rating: Number(reviewRating),
      text: reviewText.trim(),
      image: reviewImage || undefined,
      createdAt: new Date().toISOString(),
    };
    saveReviews([nextReview, ...reviews]);
    setReviewText('');
    setReviewRating('5');
    setReviewImage('');
  };

  const uploadProviderServicePhoto = async (file?: File) => {
    if (!selectedProvider || !file) return;
    const image = await fileToDataUrl(file);
    const existing = providerPhotos[selectedProvider.userEmail] || [];
    const nextPhotos = { ...providerPhotos, [selectedProvider.userEmail]: [image, ...existing].slice(0, 5) };
    saveProviderPhotos(nextPhotos);

    try {
      await persistProviderPhotos(selectedProvider.userEmail, nextPhotos[selectedProvider.userEmail]);
      setServicePhotoMessage('Service photo added to this provider card.');
    } catch (error) {
      console.error('Failed persisting provider photo', error);
      setServicePhotoMessage('Service photo saved locally, but could not be synced to the backend right now.');
    }
  };

  const confirmAppointment = async () => {
    if (!selectedProvider || !appointmentDate) return;
    setBookingLoading(true);
    const providerImage = providerPhotos[selectedProvider.userEmail]?.[0] || selectedProvider.photoURL;
    const bookingId = `${Date.now()}-${selectedProvider.userEmail}`;
    const booking: StoredBooking = {
      id: bookingId,
      bookingId,
      providerEmail: selectedProvider.userEmail,
      providerName: selectedProvider.displayName,
      providerCategory: selectedProvider.category,
      providerPhoto: providerImage,
      customerEmail: user?.email || 'guest@servly.in',
      customerName: user?.displayName || user?.email?.split('@')[0] || 'Servly user',
      date: appointmentDate,
      time: appointmentSlot,
      status: 'Requested',
      createdAt: new Date().toISOString(),
    };

    try {
      await persistBooking(booking);
      setBookingConfirmed(true);
      setShowConfirmPopup(true);
    } catch (error) {
      console.error('Failed saving booking to MongoDB', error);
      alert('Unable to save booking right now. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    const normalized = search.toLowerCase();
    return providers.filter((provider) => {
      const matchesCategory = activeCategory === 'All' || provider.category === activeCategory;
      const termMatches = !normalized || [provider.displayName, provider.category, provider.city, provider.bio, provider.servicesOffered.join(' ')].join(' ').toLowerCase().includes(normalized);
      return matchesCategory && termMatches;
    });
  }, [activeCategory, providers, search]);

  const triggerGoogleAuth = async () => {
    if (!window.firebase) {
      alert('Google Auth is initializing. Please try again in a moment.');
      return;
    }
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      await window.firebase.auth().signInWithPopup(new window.firebase.auth.GoogleAuthProvider());
    } catch (error) {
      console.error('Google sign-in failed', error);
    }
  };

  if (!user) {
    return (
      <main className="landing-root">
        <motion.div className="progress" style={{ scaleX }} />

        {/* Top Navbar */}
        <nav className="nav">
          <a className="logo" href="#top">
            serv<span>ly</span><i />
          </a>
          <div className={`navlinks ${menu ? 'active' : ''}`}>
            <a href="#services">Services</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#story">Our Story</a>
            <div className="nav-auth-wrapper">
              <GoogleAuth />
            </div>
          </div>
          <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Toggle navigation menu">
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Minimal Hero Section */}
        <section id="top" className="hero hero-minimal">
          <div className="mesh orb-one" />
          <div className="mesh orb-two" />
          <div className="grid-fade" />

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="hero-copy hero-copy-minimal"
          >
            <motion.div variants={reveal} className="eyebrow">
              <span /> Hyperlocal Services Network
            </motion.div>

            <motion.h1 variants={reveal} className="hero-heading-minimal">
              Every local service.<br />
              <em>One intelligent app.</em>
            </motion.h1>

            <motion.p variants={reveal} className="hero-sub-minimal">
              Book verified experts for home cleaning, plumbing, electrical, and painting. Sign in with Google to explore & book instantly.
            </motion.p>

            <motion.div variants={reveal} className="hero-actions-minimal">
              <button className="button button-google-hero" onClick={triggerGoogleAuth}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.35 12.2c0-.7-.06-1.36-.18-2H12v3.79h5.24a4.48 4.48 0 0 1-1.94 2.94v2.46h3.14c1.84-1.7 2.91-4.2 2.91-7.19Z"/>
                  <path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.44-2.31l-3.14-2.46c-.87.58-1.99.93-3.3.93-2.53 0-4.68-1.71-5.45-4.01H3.3v2.53A9.72 9.72 0 0 0 12 21.7Z"/>
                  <path fill="#FBBC05" d="M6.55 13.85a5.84 5.84 0 0 1 0-3.7V7.62H3.3a9.7 9.7 0 0 0 0 8.76l3.25-2.53Z"/>
                  <path fill="#EA4335" d="M12 6.14c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.82 3.19 14.62 2.3 12 2.3a9.72 9.72 0 0 0-8.7 5.32l3.25 2.53C7.32 7.85 9.47 6.14 12 6.14Z"/>
                </svg>
                Sign in with Google to Book <ArrowRight size={16} />
              </button>
            </motion.div>

            <motion.div variants={reveal} className="rating">
              <div className="avatar-stack">
                <b>R</b><b>M</b><b>A</b><b>S</b>
              </div>
              <div>
                <strong>
                  <Star size={13} fill="currentColor" /> 4.9/5 rated by 50,000+ neighbors
                </strong>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: heroEase }}
            className="hero-visual hero-visual-minimal"
          >
            <HeroScene />
            
            <motion.div 
              animate={{ y: [0, -8, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="float-tag tag-top"
              onClick={triggerGoogleAuth}
              style={{ cursor: 'pointer' }}
            >
              <MapPin size={15} className="text-orange" />
              <div>
                <b>14 Pros Nearby</b>
                <small>Tap to sign in & book</small>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 8, 0] }} 
              transition={{ repeat: Infinity, duration: 4.5, delay: 0.5, ease: 'easeInOut' }}
              className="float-tag tag-bottom"
              onClick={triggerGoogleAuth}
              style={{ cursor: 'pointer' }}
            >
              <span className="verified"><BadgeCheck size={14} /></span>
              <div>
                <b>100% Verified</b>
                <small>Sign in to view background checks</small>
              </div>
            </motion.div>

            <div className="phone-shadow" />
            <div className="phone" onClick={triggerGoogleAuth} style={{ cursor: 'pointer' }}>
              <div className="phone-top">
                <small>9:41</small>
                <i />
                <small>5G •••</small>
              </div>
              <div className="phone-screen">
                <div className="app-head">
                  <span>Welcome to SERVLY</span>
                  <b><MapPin size={12} /> Bengaluru</b>
                </div>
                <h3>What do you need<br />done today?</h3>
                <div className="search">⌕ &nbsp;Click to sign in & search...</div>
                
                <div className="mini-title">
                  Trending near you <ChevronRight size={13} />
                </div>
                
                <div className="mini-cards">
                  <div>
                    <span className="mini-icon orange">⚡</span>
                    <b>Home<br />Cleaning</b>
                    <small>From ₹399</small>
                  </div>
                  <div>
                    <span className="mini-icon blue">🔧</span>
                    <b>Electrical<br />Repair</b>
                    <small>From ₹249</small>
                  </div>
                </div>

                <div className="phone-banner-preview">
                  <img 
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" 
                    alt="Plumbing pro preview" 
                  />
                  <div>
                    <b>Verified Experts</b>
                    <small>Sign in with Google</small>
                  </div>
                </div>

                <div className="home-bar">
                  <i />
                  <span>Home</span>
                  <span>Explore</span>
                  <span>Sign In</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Trust Badges Bar */}
        <section className="trusted">
          <p>THE GOLD STANDARD FOR HOME SERVICES</p>
          <div className="trust-row">
            {[
              { title: 'KYC Verified Pros', icon: ShieldCheck, desc: 'Government ID verified' },
              { title: 'Instant Booking', icon: Clock3, desc: 'Slot confirmation in seconds' },
              { title: 'Transparent Upfront Rates', icon: CreditCard, desc: 'No hidden charges ever' },
              { title: 'Smart AI Matching', icon: Bot, desc: 'Best local pros chosen for you' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="trust-item" onClick={triggerGoogleAuth} style={{ cursor: 'pointer' }}>
                  <span className="trust-icon"><Icon size={18} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Visual Category Showcase (Unsplash Images) */}
        <section id="services" className="services section-pad">
          <div className="section-head centered">
            <p className="eyebrow"><span /> curated for modern homes</p>
            <h2>Explore Top Rated <em>Services.</em></h2>
            <p>High quality home maintenance, beauty, and repair performed by verified professionals.</p>
          </div>

          <div className="service-unsplash-grid">
            {discoveryCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                className="unsplash-card"
                onClick={triggerGoogleAuth}
                style={{ cursor: 'pointer' }}
              >
                <div className="unsplash-img-wrap">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <span className="card-price-badge">{cat.price}</span>
                </div>
                <div className="unsplash-card-content">
                  <span className="category-subtitle">{cat.subtitle}</span>
                  <h3>{cat.name}</h3>
                  <div className="card-footer">
                    <span className="rating-tag"><Star size={12} fill="currentColor" /> 4.9 (1.2k+ jobs)</span>
                    <button className="mini-book-btn" onClick={(e) => { e.stopPropagation(); triggerGoogleAuth(); }}>
                      Book now <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="quick-service-pills">
            {services.map(([name, Icon, sub]) => (
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                key={name} 
                className="pill-item"
                onClick={triggerGoogleAuth}
              >
                <Icon size={18} />
                <span>{name}</span>
                <small>{sub}</small>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Interactive Stats Section */}
        <section className="numbers">
          <p className="eyebrow"><span /> built with care in India</p>
          <h2>Local expertise,<br /><em>scaled with technology.</em></h2>
          <div className="stat-grid">
            {stats.map(([n, t]) => (
              <motion.div whileHover={{ y: -6 }} key={t}>
                <strong>{n}</strong>
                <span>{t}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why SERVLY / Problem Solution */}
        <section id="story" className="problem section-pad">
          <div className="section-head">
            <p className="eyebrow"><span /> a better way forward</p>
            <h2>Reinventing how home<br />services <em>should feel.</em></h2>
            <p>No endless calls, no pricing friction, and no compromises on quality.</p>
          </div>
          <div className="problem-grid">
            {[
              ['Unreliable Discovery', 'Neighborhood referrals are hit or miss. We provide instant access to KYC-verified local professionals.'],
              ['Opaque Pricing', 'Get fixed upfront rates before your pro arrives. No surprising haggling or hidden fees.'],
              ['Quality Guarantee', 'Every service is backed by SERVLY satisfaction assurance and 4.9★ rating standard.'],
              ['Provider Dignity', 'Independent mechanics, cleaners, and technicians receive tools, insurance, and steady earnings.'],
            ].map((x, i) => (
              <motion.article whileHover={{ y: -10, rotateX: 3 }} key={x[0]}>
                <span>0{i + 1}</span>
                <h3>{x[0]}</h3>
                <p>{x[1]}</p>
                <ArrowRight size={20} />
              </motion.article>
            ))}
          </div>
        </section>

        {/* High Impact Visual Solution Showcase */}
        <section className="solution section-pad">
          <div className="solution-photo">
            <Image
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
              src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=85"
              alt="Professional home cleaning service"
            />
            <div className="image-label">
              <span><ShieldCheck size={20} /></span>
              <div>
                <b>Guaranteed Peace of Mind</b>
                <small>KYC verified, insured & background checked experts.</small>
              </div>
            </div>
          </div>
          <div className="solution-copy">
            <p className="eyebrow"><span /> the servly promise</p>
            <h2>Designed for comfort.<br /><em>Driven by trust.</em></h2>
            <p>
              SERVLY unites India’s fragmented local service market under one sleek, transparent platform — empowering households while uplifting local professionals.
            </p>
            <div className="feature-list">
              {['Hyperlocal pro discovery', 'Transparent fixed pricing', 'Professional partner dignity', 'Secure escrow protection', 'Live GPS status updates', '100% background checked'].map((x) => (
                <div key={x}>
                  <i><Check size={13} /></i>{x}
                </div>
              ))}
            </div>
            <div className="solution-auth-cta">
              <GoogleAuth />
            </div>
          </div>
        </section>

        {/* How It Works Journey */}
        <section id="how-it-works" className="journey section-pad">
          <p className="eyebrow"><span /> effortless process</p>
          <h2>From booking to done<br />in <em>4 simple steps.</em></h2>
          <div className="journey-line" />
          <div className="journey-grid">
            <div>
              <b>For Customers</b>
              {['Sign in with Google in 1 click', 'Pick your service category & date', 'Track your pro arriving in real time', 'Pay securely after work is complete'].map((x, i) => (
                <p key={x}>
                  <span>{String(i + 1).padStart(2, '0')}</span>{x}
                </p>
              ))}
            </div>
            <div>
              <b>For Service Professionals</b>
              {['Complete digital KYC onboarding', 'Set your skills & work coverage', 'Receive instant job requests', 'Get paid directly with zero delays'].map((x, i) => (
                <p key={x}>
                  <span>{String(i + 1).padStart(2, '0')}</span>{x}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section with Google Auth */}
        <section className="cta">
          <div className="cta-orb" />
          <p className="eyebrow"><span /> get started in seconds</p>
          <h2>Experience calmer,<br /><em>smarter local help today.</em></h2>
          <p>Join thousands of happy homeowners and verified professionals across your city.</p>
          <div className="cta-action-box">
            <GoogleAuth />
          </div>
        </section>

        {/* Footer */}
        <footer id="contact">
          <a className="logo" href="#top">
            serv<span>ly</span><i />
          </a>
          <p>Every local service. One app.</p>
          <div className="footer-links">
            <div>
              <b>Explore</b>
              <a href="#services">Services</a>
              <a href="#how-it-works">How it works</a>
              <a href="#ecosystem">For professionals</a>
            </div>
            <div>
              <b>Company</b>
              <a href="#story">Our story</a>
              <a href="#contact">Contact</a>
            </div>
            <div>
              <b>Stay in the loop</b>
              <div className="newsletter">
                <input placeholder="Your email address" />
                <button aria-label="Subscribe"><ArrowRight size={17} /></button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 SERVLY Technologies Pvt. Ltd.</span>
            <span>
              <Instagram size={16} />
              <Twitter size={16} />
              <Linkedin size={16} />
            </span>
            <span>Privacy Policy • Terms of Service</span>
          </div>
        </footer>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'SERVLY',
              url: 'https://servly.in',
              description: 'India’s trusted hyperlocal services platform.',
            }),
          }}
        />
      </main>
    );
  }

  return (
    <main className="home-discovery-shell">
      <nav className="home-topbar">
        <Link href="/profile" className="logo">serv<span>ly</span><i /></Link>
        <div className="home-topbar-actions">
          <button className="icon-button" aria-label="Notifications"><Bell size={17} /></button>
          <Link href="/profile" className="profile-mini">
            {user.photoURL ? <img src={user.photoURL} alt={user.displayName || 'Profile'} /> : <span>{(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}</span>}
          </Link>
          <button className="button-outline" onClick={() => window.firebase?.auth()?.signOut()}>Sign out</button>
        </div>
      </nav>

      <section className="home-discovery-card">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: revealEase }} className="location-stack">
          <button className="location-button">
            <Navigation size={17} />
            <span>
              <small>Your location</small>
              <b>{location}</b>
            </span>
            <ChevronRight size={17} />
          </button>
          <span className="availability-badge"><span /> 42 trusted pros nearby</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .08, ease: revealEase }} className="home-hero-banner">
          <div className="home-hero-copy">
            <span className="home-pill"><Flame size={13} /> Trending today</span>
            <h1>What service do you need at home?</h1>
            <p>Book verified professionals for cleaning, painting, plumbing and more with a polished, food-app-fast discovery flow.</p>
          </div>
        </motion.div>

        <motion.label initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .55, delay: .15 }} className="home-search-input advanced-search-bar">
          <Search size={20} className="search-icon-accent" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services, professionals or locations (e.g. Plumbing, Cleaning, Electrician)..." />
          {search && <button type="button" onClick={() => setSearch('')} className="search-clear-btn"><X size={15} /></button>}
          <button type="button" aria-label="Filters" className="search-filter-btn"><SlidersHorizontal size={17} /></button>
        </motion.label>

        <div className="home-section-head compact">
          <div>
            <h2>Categories</h2>
            <p>Select a service to filter top verified experts nearby.</p>
          </div>
          <button className="see-all" onClick={() => setActiveCategory('All')}>Reset filter <ChevronRight size={14} /></button>
        </div>

        <div className="service-chip-row category-rail category-rail-advanced">
          <motion.button whileTap={{ scale: .95 }} className={`service-tile ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}>
            <span><Sparkles size={21} /></span>
            <b>All Services</b>
            <small>Explore all</small>
          </motion.button>
          {serviceCategories.map((item, index) => {
            const Icon = categoryIcons[item] || Sparkles;
            return (
              <motion.button initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .035 }} whileHover={{ y: -6 }} whileTap={{ scale: .95 }} key={item} className={`service-tile ${activeCategory === item ? 'active' : ''}`} onClick={() => setActiveCategory(item)}>
                <span><Icon size={21} /></span>
                <b>{item}</b>
                <small>Available</small>
              </motion.button>
            );
          })}
        </div>

        <div className="home-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p>Click any professional card to view full service details, portfolio photos, ratings and instant booking.</p>
          </div>
          <span className="results-badge">{filteredProviders.length} verified pros available</span>
        </div>

        {loadingProviders ? (
          <div className="home-loading-card small">
            <LoaderCircle className="spin" size={20} />
            <p>Loading top verified service providers...</p>
          </div>
        ) : (
          <div className="provider-grid provider-grid-advanced">
            {filteredProviders.map((provider, index) => (
              <motion.article 
                initial={{ opacity: 0, y: 24 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, margin: '-50px' }} 
                transition={{ duration: .45, delay: index * 0.05 }} 
                whileHover={{ y: -8, scale: 1.01 }} 
                key={provider.userEmail} 
                className="provider-card provider-card-clickable"
                onClick={() => {
                  setSelectedProvider(provider);
                  setSlideIndex(0);
                  setAppointmentDate('');
                  setAppointmentSlot('10:00 AM');
                  setBookingConfirmed(false);
                  setShowConfirmPopup(false);
                  setReviewText('');
                  setReviewImage('');
                  setServicePhotoMessage('');
                }}
              >
                <div className="provider-image-wrap">
                  <span className="provider-category-badge">{provider.category}</span>
                  {providerPhotos[provider.userEmail]?.[0] || provider.photoURL ? (
                    <img src={providerPhotos[provider.userEmail]?.[0] || provider.photoURL} alt={provider.displayName} />
                  ) : (
                    <div className="provider-image-fallback"><span>{provider.displayName.charAt(0)}</span></div>
                  )}
                  {(providerPhotos[provider.userEmail] || []).slice(1, 3).map((photo, photoIndex) => (
                    <img key={`${photo.slice(-18)}-${photoIndex}`} className="provider-work-thumb" src={photo} alt={`${provider.displayName} work ${photoIndex + 2}`} />
                  ))}
                  {(providerPhotos[provider.userEmail] || []).length > 3 && <span className="provider-photo-count"><Images size={12} /> +{providerPhotos[provider.userEmail].length - 3}</span>}
                  <span className="pro-badge"><BadgeCheck size={13} /> Verified pro</span>
                </div>

                <div className="provider-card-body">
                  <div className="provider-card-top">
                    <div>
                      <h3>{provider.displayName}</h3>
                      <p>{provider.category} • {provider.city}</p>
                    </div>
                    <span className="rating-pill"><Star size={12} fill="currentColor" /> {provider.rating.toFixed(1)}</span>
                  </div>

                  <div className="provider-meta">
                    <span><MapPin size={12} /> {provider.city}</span>
                    <span><Clock3 size={12} /> ₹{provider.hourlyRate}/hr</span>
                  </div>

                  <p className="provider-bio">{provider.bio}</p>

                  <div className="provider-tags">
                    {provider.servicesOffered.slice(0, 3).map((service) => <span key={service}>{service}</span>)}
                  </div>

                  <div className="card-action-row">
                    <button
                      className="book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProvider(provider);
                        setSlideIndex(0);
                        setAppointmentDate('');
                        setAppointmentSlot('10:00 AM');
                        setBookingConfirmed(false);
                        setShowConfirmPopup(false);
                        setReviewText('');
                        setReviewImage('');
                        setServicePhotoMessage('');
                      }}
                    >
                      <CalendarDays size={15} /> Book appointment
                    </button>
                    <span className="view-details-hint">Full details <ChevronRight size={14} /></span>
                  </div>
                </div>
              </motion.article>
            ))}
            {!filteredProviders.length && (
              <div className="empty-results">
                <Sparkles size={28} className="icon-orange" />
                <h3>No matching service pros found</h3>
                <p>Try searching for a different service or clearing the category filter.</p>
                <button className="button button-outline mt-15" onClick={() => { setSearch(''); setActiveCategory('All'); }}>
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        )}
      </section>
      {selectedProvider && (
        <div className="booking-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Book ${selectedProvider.displayName}`}>
          <motion.div initial={{ opacity: 0, y: 28, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="booking-modal-card">
            <button className="booking-close" onClick={() => setSelectedProvider(null)} aria-label="Close booking details"><X size={18} /></button>
            {(() => {
              const allPhotos = [...(providerPhotos[selectedProvider.userEmail] || []), ...(selectedProvider.photoURL ? [selectedProvider.photoURL] : [])];
              if (!allPhotos.length) {
                return (
                  <div className="slideshow slideshow--empty">
                    <div className="slideshow-empty"><ImagePlus size={32} /><span>No photos yet</span></div>
                  </div>
                );
              }
              const safeIndex = slideIndex % allPhotos.length;
              return (
                <div className="slideshow">
                  <div className="slideshow-track" style={{ transform: `translateX(-${safeIndex * 100}%)` }}>
                    {allPhotos.map((photo, i) => (
                      <div key={`slide-${i}`} className="slideshow-slide">
                        <img src={photo} alt={`${selectedProvider.displayName} photo ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                  {allPhotos.length > 1 && (
                    <>
                      <button className="slide-arrow slide-arrow--left" onClick={(e) => { e.stopPropagation(); setSlideIndex((safeIndex - 1 + allPhotos.length) % allPhotos.length); }}><ChevronLeft size={20} /></button>
                      <button className="slide-arrow slide-arrow--right" onClick={(e) => { e.stopPropagation(); setSlideIndex((safeIndex + 1) % allPhotos.length); }}><ChevronRight size={20} /></button>
                      <div className="slide-dots">
                        {allPhotos.map((_, i) => (
                          <button key={`dot-${i}`} className={`slide-dot${i === safeIndex ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); setSlideIndex(i); }} />
                        ))}
                      </div>
                      <span className="slide-counter">{safeIndex + 1} / {allPhotos.length}</span>
                    </>
                  )}
                </div>
              );
            })()}
            <div className="booking-modal-body">
              <div className="booking-provider-head">
                <div>
                  <span className="pro-badge inline"><BadgeCheck size={13} /> Verified provider</span>
                  <h2>{selectedProvider.displayName}</h2>
                  <p>{selectedProvider.category} specialist in {selectedProvider.city}</p>
                </div>
                <span className="rating-pill large"><Star size={14} fill="currentColor" /> {selectedProvider.rating.toFixed(1)}</span>
              </div>

              <div className="booking-facts">
                <div><b>{selectedProvider.experience}</b><span>Past experience</span></div>
                <div><b>Rs {selectedProvider.hourlyRate}/hr</b><span>Transparent rate</span></div>
                <div><b>120+</b><span>Jobs completed</span></div>
              </div>

              <div className="booking-section">
                <h3>About this service pro</h3>
                <p>{selectedProvider.bio}</p>
                <div className="provider-tags">
                  {selectedProvider.servicesOffered.map((service) => <span key={service}>{service}</span>)}
                </div>
                <label className="photo-upload-btn">
                  <ImagePlus size={15} />
                  Add service photo
                  <input type="file" accept="image/*" onChange={(event) => uploadProviderServicePhoto(event.target.files?.[0])} />
                </label>
                {servicePhotoMessage && <p className="booking-success compact">{servicePhotoMessage}</p>}
              </div>

              <div className="booking-section">
                <h3>Customer reviews</h3>
                <div className="review-list">
                  {([
                    ...reviews.filter((review) => review.providerEmail === selectedProvider.userEmail),
                    { id: 'sample-1', providerEmail: selectedProvider.userEmail, authorName: 'Neha S.', rating: 5, text: 'Very professional, arrived on time and explained the work clearly.', createdAt: '' },
                    { id: 'sample-2', providerEmail: selectedProvider.userEmail, authorName: 'Arjun M.', rating: 5, text: 'Clean finish and fair pricing. I would book again.', createdAt: '' },
                  ] as StoredReview[]).map((review) => (
                    <div key={review.id} className="review-card">
                      <strong>{review.authorName}</strong>
                      <span><Star size={12} fill="currentColor" /> {review.rating.toFixed(1)}</span>
                      <p>{review.text}</p>
                      {review.image && <img src={review.image} alt={`${review.authorName} review`} />}
                    </div>
                  ))}
                </div>
                <div className="review-writer">
                  <div className="schedule-grid">
                    <label>
                      <span>Your rating</span>
                      <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                        {['5', '4', '3', '2', '1'].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                      </select>
                    </label>
                    <label className="photo-upload-field">
                      <span>Review photo</span>
                      <input type="file" accept="image/*" onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) setReviewImage(await fileToDataUrl(file));
                      }} />
                    </label>
                  </div>
                  <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Write your review for this service provider..." />
                  {reviewImage && <img className="review-preview" src={reviewImage} alt="Review upload preview" />}
                  <button className="button button-dark full" onClick={submitReview} disabled={!reviewText.trim()}>
                    Post review <Send size={14} />
                  </button>
                </div>
              </div>

              <div className="booking-section schedule-box">
                <h3>Schedule appointment</h3>
                <div className="schedule-grid">
                  <label>
                    <span>Date</span>
                    <input type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
                  </label>
                  <label>
                    <span>Time</span>
                    <select value={appointmentSlot} onChange={(event) => setAppointmentSlot(event.target.value)}>
                      {['9:00 AM', '10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '7:00 PM'].map((slot) => <option key={slot}>{slot}</option>)}
                    </select>
                  </label>
                </div>
                <button className="confirm-btn" onClick={confirmAppointment} disabled={!appointmentDate || bookingLoading}>
                  {bookingLoading ? <><LoaderCircle size={15} className="spin" /> Confirming…</> : <><CalendarDays size={15} /> Confirm appointment</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Booking Confirmation Popup */}
      {showConfirmPopup && selectedProvider && (
        <div className="confirm-popup-backdrop" onClick={() => setShowConfirmPopup(false)}>
          <motion.div
            initial={{ opacity: 0, scale: .88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .92, y: 16 }}
            transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}
            className="confirm-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-popup-icon"><Check size={28} /></div>
            <h3>Appointment Confirmed!</h3>
            <p>Your booking with <strong>{selectedProvider.displayName}</strong> has been requested.</p>
            <div className="confirm-popup-details">
              <div><CalendarDays size={14} /><span>{appointmentDate}</span></div>
              <div><Clock3 size={14} /><span>{appointmentSlot}</span></div>
              <div><MapPin size={14} /><span>{selectedProvider.city}</span></div>
            </div>
            <p className="confirm-popup-note">You'll receive a confirmation once the provider accepts. Check your bookings in your profile.</p>
            <div className="confirm-popup-actions">
              <Link href="/profile" className="confirm-popup-btn primary">View my bookings</Link>
              <button className="confirm-popup-btn secondary" onClick={() => { setShowConfirmPopup(false); setSelectedProvider(null); }}>Done</button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

