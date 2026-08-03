'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import GoogleAuth from '../components/google-auth';
import { motion, useScroll, useSpring, type Variants } from 'framer-motion';
import { ArrowRight, BadgeCheck, Bell, CalendarDays, Check, ChevronRight, CirclePlay, Clock3, CreditCard, Flame, ImagePlus, Images, LoaderCircle, Menu, Navigation, Search, Send, SlidersHorizontal, Star, MapPin, ShieldCheck, Sparkles, X, Wrench, Zap, Paintbrush, Camera, GraduationCap, HeartHandshake, Users, Bot, Instagram, Linkedin, Twitter, type LucideIcon } from 'lucide-react';

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
    } catch (error) {
      console.error('Failed saving booking to MongoDB', error);
      alert('Unable to save booking right now. Please try again.');
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

  if (!user) {
    return <main>
      <motion.div className="progress" style={{ scaleX }} />
      <nav className="nav"><a className="logo" href="#top">serv<span>ly</span><i /></a><div className={'navlinks ' + (menu ? 'active' : '')}><a href="#services">Services</a><a href="#ecosystem">For professionals</a><a href="#story">Our story</a><a href="#contact">Contact</a><GoogleAuth/></div><button className="menubtn" onClick={() => setMenu(!menu)} aria-label="menu">{menu ? <X/>:<Menu/>}</button></nav>

      <section id="top" className="hero">
        <div className="mesh orb-one"/><div className="mesh orb-two"/><div className="grid-fade"/>
        <motion.div initial="hidden" animate="show" variants={{show:{transition:{staggerChildren:.11}}}} className="hero-copy">
          <motion.div variants={reveal} className="eyebrow"><span/> India’s trusted local network</motion.div>
          <motion.h1 variants={reveal}>Every local<br/>service. <em>One app.</em></motion.h1>
          <motion.p variants={reveal}>A calmer way to get things done. SERVLY connects households with verified local professionals through instant booking, transparent pricing, and quality you can count on.</motion.p>
          <motion.div variants={reveal} className="hero-actions"><Button>Book a service</Button><button className="watch"><span><CirclePlay size={18}/></span> Watch the film</button></motion.div>
          <motion.div variants={reveal} className="rating"><div className="avatar-stack"><b>R</b><b>M</b><b>A</b></div><div><strong><Star size={13} fill="currentColor"/> 4.9 from 50,000+ neighbours</strong><small>Built for the way India lives</small></div></motion.div>
        </motion.div>
        <motion.div initial={{opacity:0, scale:.88, rotate:8}} animate={{opacity:1, scale:1, rotate:0}} transition={{duration:1.1, ease:heroEase}} className="hero-visual"><HeroScene/>
          <div className="float-tag tag-top"><MapPin size={15}/><span>Nearby now</span><b>12 min</b></div><div className="float-tag tag-bottom"><span className="verified"><Check size={12}/></span><span>Verified professionals</span></div>
          <div className="phone-shadow"/><div className="phone"><div className="phone-top"><small>9:41</small><i/><small>•••</small></div><div className="phone-screen"><div className="app-head"><span>Good morning, Ananya</span><b><MapPin size={13}/> Indiranagar</b></div><h3>What do you need<br/>help with?</h3><div className="search">⌕&nbsp; Search services</div><div className="mini-title">Recommended for you <ChevronRight size={15}/></div><div className="mini-cards"><div><span className="mini-icon orange">⌁</span><b>Home<br/>cleaning</b><small>From ₹399</small></div><div><span className="mini-icon blue">ϟ</span><b>Electrical<br/>repair</b><small>From ₹249</small></div></div><div className="home-bar"><i/><span>Home</span><span>Bookings</span><span>Profile</span></div></div></div>
          <div className="spark spark-a"/><div className="spark spark-b"/><div className="spark spark-c"/>
        </motion.div>
      </section>

      <section className="trusted"><p>THE NEW STANDARD FOR EVERYDAY HELP</p><div className="trust-row">{['KYC verified', 'Instant booking', 'Transparent pricing', 'Smart matching'].map((x,i)=><div key={x}><span>{[<ShieldCheck/>,<Clock3/>,<CreditCard/>,<Bot/>][i]}</span>{x}</div>)}</div></section>

      <section className="numbers"><p className="eyebrow"><span/> built close to home</p><h2>Local service,<br/><em>on a larger scale.</em></h2><div className="stat-grid">{stats.map(([n,t])=><motion.div whileHover={{y:-6}} key={t}><strong>{n}</strong><span>{t}</span></motion.div>)}</div></section>

      <section id="story" className="problem section-pad"><div className="section-head"><p className="eyebrow"><span/> a better answer</p><h2>Because the old way<br/>wasn’t built for <em>today.</em></h2><p>Finding quality help shouldn’t feel like a leap of faith. We’re rebuilding the local-services experience from the ground up.</p></div><div className="problem-grid">{[['Unreliable discovery','A recommendation from a neighbour is helpful. A verified network is better.'],['Opaque pricing','Know what you’ll pay, before you book — with no awkward surprises.'],['No quality control','Every professional is KYC-checked, rated and held to a clear standard.'],['Provider struggles','Independent professionals get the tools, dignity and demand to grow.']].map((x,i)=><motion.article whileHover={{y:-10, rotateX:3}} key={x[0]}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p><ArrowRight size={20}/></motion.article>)}</div></section>

      <section className="solution section-pad"><div className="solution-photo"><Image fill sizes="(max-width: 800px) 100vw, 50vw" src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85" alt="Professional cleaning a home"/><div className="image-label"><span><ShieldCheck/></span><div><b>Protected every step</b><small>Only trusted professionals, ever.</small></div></div></div><div className="solution-copy"><p className="eyebrow"><span/> the servly difference</p><h2>Made for real life.<br/><em>Powered by trust.</em></h2><p>SERVLY brings India’s fragmented service economy into one thoughtful, intelligent platform — making each interaction simpler for customers and more rewarding for professionals.</p><div className="feature-list">{['Hyperlocal discovery','Transparent, upfront booking','Professional empowerment','Secure escrow payments','Live GPS tracking','KYC verification'].map(x=><div key={x}><i><Check size={13}/></i>{x}</div>)}</div><Button>Discover SERVLY</Button></div></section>

      <section id="services" className="services section-pad"><div className="section-head centered"><p className="eyebrow"><span/> made for every moment</p><h2>Whatever life<br/>throws your <em>way.</em></h2></div><div className="service-grid">{services.map(([name,Icon,sub],i)=><motion.div whileHover={{y:-8}} key={name} className={'service-card service-'+i}><span><Icon size={24}/></span><h3>{name}</h3><p>{sub}</p><ArrowRight size={17}/></motion.div>)}</div><button className="link-button">Explore 35+ service categories <ArrowRight size={17}/></button></section>

      <section className="vision section-pad"><article><p className="eyebrow"><span/> our north star</p><h2>India’s most<br/><em>trusted</em> local<br/>services platform.</h2><div className="line-arrow">↗</div></article><article><p className="eyebrow"><span/> why we exist</p><h2>To digitize local service — and put millions of independent professionals <em>on the map.</em></h2><div className="circle-word">SERVLY<br/>SERVLY</div></article></section>

      <section className="audience section-pad"><div className="section-head"><p className="eyebrow"><span/> for all of us</p><h2>A little more ease,<br/>for <em>every kind of day.</em></h2></div><div className="audience-grid">{audience.map(([t,d],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{d}</p><div className="aud-icon">{i===0?<Users/>:i===1?<GraduationCap/>:i===2?<Clock3/>:<Sparkles/>}</div></article>)}</div></section>

      <section id="ecosystem" className="ecosystem section-pad"><div className="section-head centered"><p className="eyebrow"><span/> one seamless network</p><h2>A better experience<br/>for <em>everyone involved.</em></h2></div><div className="ecosystem-grid">{[['01','Customer app','Find, book and track thoughtful service in a few taps.', 'Book in under 60 seconds'],['02','Provider app','Build a thriving business with powerful tools in your pocket.', 'Grow on your terms'],['03','Operations hub','The intelligence behind safer, smoother service at scale.', 'Built for clarity']].map(([n,t,d,cta],i)=><article key={t} className={'eco-card eco-'+i}><small>{n}</small><div className="device-ui"><span/><span/><span/></div><h3>{t}</h3><p>{d}</p><button>{cta} <ArrowRight size={15}/></button></article>)}</div></section>

      <section className="journey section-pad"><p className="eyebrow"><span/> designed to flow</p><h2>From “I need help”<br/>to “all sorted.”</h2><div className="journey-line"/><div className="journey-grid"><div><b>For customers</b>{['Open SERVLY','Choose a professional','Book instantly','Track in real time','Rate your experience'].map((x,i)=><p key={x}><span>{String(i+1).padStart(2,'0')}</span>{x}</p>)}</div><div><b>For professionals</b>{['Join the network','Complete KYC','Receive a booking','Do your best work','Get paid securely'].map((x,i)=><p key={x}><span>{String(i+1).padStart(2,'0')}</span>{x}</p>)}</div></div></section>

      <section className="tech section-pad"><p>BUILT WITH THE BEST, FOR THE BEST</p><div>{['Flutter','Node.js','PostgreSQL','Firebase','Google Maps','AWS','Supabase','Razorpay'].map(x=><span key={x}>{x}</span>)}</div></section>

      <section className="team section-pad"><div className="section-head"><p className="eyebrow"><span/> builders at heart</p><h2>The people making<br/>local feel <em>limitless.</em></h2></div><div className="team-grid">{[['Ilma Khan','Co-founder'],['Divyanshi Rai','Co-founder'],['Vashudha Singh','Co-founder'],['Ritika Yadav','Co-founder']].map(([n,r],i)=><article key={n}><div className={'portrait portrait-'+i}><span>{n.split(' ').map(q=>q[0]).join('')}</span></div><p>{r}</p><h3>{n}</h3><Linkedin size={18}/></article>)}</div></section>

      <section className="cta"><div className="cta-orb"/><p className="eyebrow"><span/> your neighbourhood, elevated</p><h2>Ready to make<br/>everyday <em>easier?</em></h2><p>One thoughtful app. A city of trusted professionals.</p><div><Button>Book a service</Button><Button dark>Join as a professional</Button></div></section>
      <footer id="contact"><a className="logo" href="#top">serv<span>ly</span><i/></a><p>Every local service. One app.</p><div className="footer-links"><div><b>Explore</b><a>Services</a><a>For professionals</a><a>How it works</a></div><div><b>Company</b><a>Our story</a><a>Careers</a><a>Contact</a></div><div><b>Stay in the loop</b><div className="newsletter"><input placeholder="Your email address"/><button><ArrowRight size={17}/></button></div></div></div><div className="footer-bottom"><span>© 2026 SERVLY Technologies Pvt. Ltd.</span><span><Instagram size={16}/><Twitter size={16}/><Linkedin size={16}/></span><span>Privacy · Terms</span></div></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'SERVLY',url:'https://servly.in',description:'India’s trusted hyperlocal services platform.'})}}/>
    </main>
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
            <div className="home-hero-badges">
              <span><ShieldCheck size={14} /> KYC verified</span>
              <span><Clock3 size={14} /> 30 min slots</span>
              <span><Star size={14} fill="currentColor" /> 4.9 average</span>
            </div>
          </div>
        </motion.div>

        <motion.label initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .55, delay: .15 }} className="home-search-input">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for painting, cleaning, plumbing..." />
          <button type="button" aria-label="Filters"><SlidersHorizontal size={17} /></button>
        </motion.label>

        <div className="home-section-head compact">
          <div>
            <h2>Categories</h2>
            <p>Tap a service and SERVLY will tune the recommendations below.</p>
          </div>
          <button className="see-all">See all <ChevronRight size={14} /></button>
        </div>

        <div className="service-chip-row category-rail">
          <motion.button whileTap={{ scale: .95 }} className={`service-tile ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}>
            <span><Sparkles size={21} /></span>
            <b>All</b>
            <small>Explore</small>
          </motion.button>
          {serviceCategories.map((item, index) => {
            const Icon = categoryIcons[item] || Sparkles;
            return (
              <motion.button initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .035 }} whileHover={{ y: -6 }} whileTap={{ scale: .95 }} key={item} className={`service-tile ${activeCategory === item ? 'active' : ''}`} onClick={() => setActiveCategory(item)}>
                <span><Icon size={21} /></span>
                <b>{item}</b>
                <small>Near you</small>
              </motion.button>
            );
          })}
        </div>

        <div className="offer-strip">
          <div>
            <span>SMART SAVINGS</span>
            <b>Book today and unlock verified pros, review photos, and priority slots.</b>
          </div>
          <CalendarDays size={22} />
        </div>

        <div className="home-section-head">
          <div>
            <h2>Popular categories</h2>
            <p>Large visual picks inspired by food delivery apps, redesigned for premium services.</p>
          </div>
          <span>{discoveryCategories.length} curated picks</span>
        </div>

        <div className="category-grid">
          {discoveryCategories.map((item, index) => (
            <motion.button initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: .55, delay: index * .05 }} whileHover={{ y: -8, scale: 1.01 }} key={item.name} className={`category-card ${activeCategory === item.name ? 'active' : ''}`} onClick={() => setActiveCategory(item.name)}>
              <img src={item.image} alt={item.name} />
              <div className="category-card-content">
                <span>{item.subtitle}</span>
                <h3>{item.name}</h3>
                <b>{item.price}</b>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="home-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p>Service pro profiles with photos, ratings, speciality, pricing and nearby availability.</p>
          </div>
          <span>{filteredProviders.length} results</span>
        </div>

        {loadingProviders ? (
          <div className="home-loading-card small">
            <LoaderCircle className="spin" size={20} />
            <p>Loading providers near you…</p>
          </div>
        ) : (
          <div className="provider-grid">
            {filteredProviders.map((provider, index) => (
              <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: .5, delay: index * .06 }} whileHover={{ y: -7 }} key={provider.userEmail} className="provider-card">
                <div className="provider-image-wrap">
                  <span className="provider-category-badge">{provider.category}</span>
                  {providerPhotos[provider.userEmail]?.[0] || provider.photoURL ? (
                    <img src={providerPhotos[provider.userEmail]?.[0] || provider.photoURL} alt={provider.displayName} />
                  ) : (
                    <div className="provider-image-fallback"><span>{provider.displayName.charAt(0)}</span></div>
                  )}
                  {(providerPhotos[provider.userEmail] || []).slice(1, 3).map((photo, photoIndex) => (
                    <img key={`${photo.slice(-18)}-${photoIndex}`} className="provider-work-thumb" src={photo} alt={`${provider.displayName} service work ${photoIndex + 2}`} />
                  ))}
                  {(providerPhotos[provider.userEmail] || []).length > 3 && <span className="provider-photo-count"><Images size={12} /> +{providerPhotos[provider.userEmail].length - 3} more</span>}
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
                  <button
                    className="button button-dark full"
                    onClick={() => {
                      setSelectedProvider(provider);
                      setAppointmentDate('');
                      setAppointmentSlot('10:00 AM');
                      setBookingConfirmed(false);
                      setReviewText('');
                      setReviewImage('');
                      setServicePhotoMessage('');
                    }}
                  >
                    Book appointment <ArrowRight size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
            {!filteredProviders.length && (
              <div className="empty-results">
                <Sparkles size={24} />
                <h3>No matching providers yet</h3>
                <p>Try another category or search term to discover more SERVLY professionals.</p>
              </div>
            )}
          </div>
        )}
      </section>
      {selectedProvider && (
        <div className="booking-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Book ${selectedProvider.displayName}`}>
          <motion.div initial={{ opacity: 0, y: 28, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="booking-modal-card">
            <button className="booking-close" onClick={() => setSelectedProvider(null)} aria-label="Close booking details"><X size={18} /></button>
            <div className="booking-gallery">
              {([...(providerPhotos[selectedProvider.userEmail] || []), ...(selectedProvider.photoURL ? [selectedProvider.photoURL] : [])].slice(0, 4)).length ? (
                ([...(providerPhotos[selectedProvider.userEmail] || []), ...(selectedProvider.photoURL ? [selectedProvider.photoURL] : [])].slice(0, 4)).map((photo, index) => (
                  <img key={photo + index} src={photo} alt={`${selectedProvider.displayName} work ${index + 1}`} />
                ))
              ) : (
                <div className="booking-gallery-empty">No gallery photos available for this provider.</div>
              )}
            </div>
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
                <button className="button button-dark full" onClick={confirmAppointment} disabled={!appointmentDate}>
                  Confirm appointment <CalendarDays size={14} />
                </button>
                {bookingConfirmed && (
                  <p className="booking-success">Appointment requested with {selectedProvider.displayName} for {appointmentDate} at {appointmentSlot}.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

