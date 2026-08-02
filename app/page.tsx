'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import GoogleAuth from '../components/google-auth';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, CirclePlay, Clock3, CreditCard, Menu, Star, MapPin, ShieldCheck, Sparkles, X, Wrench, Zap, Paintbrush, Camera, GraduationCap, HeartHandshake, Users, Bot, Globe2, LockKeyhole, Instagram, Linkedin, Twitter } from 'lucide-react';
import { useState } from 'react';
const HeroScene = dynamic(() => import('../components/hero-scene'), { ssr: false });

const easeOut = [0.22, 1, 0.36, 1] as const;
const easeSoft = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
} as const;
const services = [
  ['Plumbing', Wrench, 'From ₹199'], ['Electrician', Zap, 'From ₹249'], ['Cleaning', Sparkles, 'From ₹399'], ['Painting', Paintbrush, 'From ₹999'], ['Photography', Camera, 'From ₹799'], ['Tutoring', GraduationCap, 'From ₹299'], ['Beauty at home', HeartHandshake, 'From ₹499'], ['15+ more', ChevronRight, 'Explore all'],
];
const stats = [['100K+', 'verified professionals'], ['1M+', 'services completed'], ['500+', 'cities in reach'], ['4.9★', 'customer love score']];
const categories = ['Plumbing','Electrician','Carpentry','Home Cleaning','Painting','Beauty','Makeup Artist','Mehndi Artist','Photography','Tutors','Packers & Movers','Car Wash','Pest Control','Laundry','Gardening','Pet Care','Event Décor','AC Repair','Appliance Repair'];
const audience = [['Homeowners','Care that keeps every corner running.'],['Students','Dependable help around a busy schedule.'],['Working professionals','Your time, beautifully protected.'],['Families','The little things, effortlessly handled.'],['Small businesses','A reliable operations partner nearby.'],['Event organizers','Every detail, delivered in time.']];

function Button({ children, dark = false }: {children: React.ReactNode, dark?: boolean}) { return <button className={dark ? 'button button-dark' : 'button'}>{children}<ArrowRight size={16}/></button> }

export default function Home() {
  const [menu, setMenu] = useState(false);
  const { scrollYProgress } = useScroll(); const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
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
      <motion.div initial={{opacity:0, scale:.88, rotate:8}} animate={{opacity:1, scale:1, rotate:0}} transition={{duration:1.1, ease:easeSoft}} className="hero-visual"><HeroScene/>
        <div className="float-tag tag-top"><MapPin size={15}/><span>Nearby now</span><b>12 min</b></div><div className="float-tag tag-bottom"><span className="verified"><Check size={12}/></span><span>Verified professionals</span></div>
        <div className="phone-shadow"/><div className="phone"><div className="phone-top"><small>9:41</small><i/><small>•••</small></div><div className="phone-screen"><div className="app-head"><span>Good morning, Ananya</span><b><MapPin size={13}/> Indiranagar</b></div><h3>What do you need<br/>help with?</h3><div className="search">⌕&nbsp; Search services</div><div className="mini-title">Recommended for you <ChevronRight size={15}/></div><div className="mini-cards"><div><span className="mini-icon orange">⌁</span><b>Home<br/>cleaning</b><small>From ₹399</small></div><div><span className="mini-icon blue">ϟ</span><b>Electrical<br/>repair</b><small>From ₹249</small></div></div><div className="home-bar"><i/><span>Home</span><span>Bookings</span><span>Profile</span></div></div></div>
        <div className="spark spark-a"/><div className="spark spark-b"/><div className="spark spark-c"/>
      </motion.div>
    </section>

    <section className="trusted"><p>THE NEW STANDARD FOR EVERYDAY HELP</p><div className="trust-row">{['KYC verified', 'Instant booking', 'Transparent pricing', 'Smart matching'].map((x,i)=><div key={x}><span>{[<ShieldCheck/>,<Clock3/>,<CreditCard/>,<Bot/>][i]}</span>{x}</div>)}</div></section>

    <section className="numbers"><p className="eyebrow"><span/> built close to home</p><h2>Local service,<br/><em>on a larger scale.</em></h2><div className="stat-grid">{stats.map(([n,t])=><motion.div whileHover={{y:-6}} key={t}><strong>{n}</strong><span>{t}</span></motion.div>)}</div></section>

    <section id="story" className="problem section-pad"><div className="section-head"><p className="eyebrow"><span/> a better answer</p><h2>Because the old way<br/>wasn’t built for <em>today.</em></h2><p>Finding quality help shouldn’t feel like a leap of faith. We’re rebuilding the local-services experience from the ground up.</p></div><div className="problem-grid">{[['Unreliable discovery','A recommendation from a neighbour is helpful. A verified network is better.'],['Opaque pricing','Know what you’ll pay, before you book — with no awkward surprises.'],['No quality control','Every professional is KYC-checked, rated and held to a clear standard.'],['Provider struggles','Independent professionals get the tools, dignity and demand to grow.']].map((x,i)=><motion.article whileHover={{y:-10, rotateX:3}} key={x[0]}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p><ArrowRight size={20}/></motion.article>)}</div></section>

    <section className="solution section-pad"><div className="solution-photo"><Image fill sizes="(max-width: 800px) 100vw, 50vw" src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85" alt="Professional cleaning a home"/><div className="image-label"><span><ShieldCheck/></span><div><b>Protected every step</b><small>Only trusted professionals, ever.</small></div></div></div><div className="solution-copy"><p className="eyebrow"><span/> the servly difference</p><h2>Made for real life.<br/><em>Powered by trust.</em></h2><p>SERVLY brings India’s fragmented service economy into one thoughtful, intelligent platform — making each interaction simpler for customers and more rewarding for professionals.</p><div className="feature-list">{['Hyperlocal discovery','Transparent, upfront booking','Professional empowerment','Secure escrow payments','Live GPS tracking','KYC verification'].map(x=><div key={x}><i><Check size={13}/></i>{x}</div>)}</div><Button>Discover SERVLY</Button></div></section>

    <section id="services" className="services section-pad"><div className="section-head centered"><p className="eyebrow"><span/> made for every moment</p><h2>Whatever life<br/>throws your <em>way.</em></h2></div><div className="service-grid">{services.map(([name,Icon,sub],i)=>{const I=Icon as typeof Wrench;return <motion.div whileHover={{y:-8}} key={name as string} className={'service-card service-'+i}><span><I size={24}/></span><h3>{name}</h3><p>{sub}</p><ArrowRight size={17}/></motion.div>})}</div><button className="link-button">Explore 35+ service categories <ArrowRight size={17}/></button></section>

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
