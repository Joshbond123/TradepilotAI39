import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, Zap, Repeat, TrendingUp, BarChart, Star, CheckCircle, Send } from 'lucide-react';
import { getTestimonials, addTestimonial } from '../services/userDataService';
import { Testimonial } from '../types';

const Header: React.FC<{ onLogoClick: () => void; onNavigate: (view: 'login' | 'register' | 'testimonials') => void; }> = ({ onLogoClick, onNavigate }) => (
    <header 
      className="fixed top-0 left-0 right-0 z-50 py-4 px-4 sm:px-8"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 bg-brand-surface/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
        <div onClick={onLogoClick} className="flex items-center gap-2 cursor-pointer">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00f5ff" />
                    <stop offset="100%" stopColor="#e040fb" />
                </linearGradient>
            </defs>
          </svg>
          <span className="font-bold text-xl text-white">TradePilot AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-brand-text-secondary font-semibold">
          <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-300">Reviews</a>
        </nav>
        <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('login')} className="hidden sm:block px-6 py-2 text-brand-text-secondary font-bold rounded-full transition-all duration-300 hover:text-white hover:bg-white/10">
                Login
            </button>
            <button onClick={() => onNavigate('register')} className="px-6 py-2 bg-brand-primary text-brand-bg font-bold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_theme(colors.brand.primary)]">
            Get Started
            </button>
        </div>
      </div>
    </header>
);

const Section: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({ children, id, className }) => (
    <section 
        id={id} 
        className={`py-24 px-4 sm:px-6 lg:px-8 relative ${className}`}
    >
        <div className="max-w-7xl mx-auto">{children}</div>
    </section>
);

const SectionTitle: React.FC<{ subtitle: string; title: React.ReactNode; }> = ({ subtitle, title }) => (
    <div className="text-center mb-16">
        <p className="text-lg text-brand-primary font-bold uppercase tracking-widest">{subtitle}</p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mt-2 text-white">{title}</h2>
    </div>
);

const StatCounter: React.FC<{ to: number; label: string; suffix?: string; decimals?: number }> = ({ to, label, suffix = '', decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);
  
    useEffect(() => {
        if (!inView) return;

        let start = 0;
        const duration = 1200;
        const end = to;
        if (start === end) return;
        
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentCount = progress * (end - start) + start;
            setCount(parseFloat(currentCount.toFixed(decimals)));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [to, decimals, inView]);
  
    return (
      <div ref={ref} className="text-center group" style={{ perspective: '500px' }}>
        <div className="transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-x-[-10deg]" style={{ transformStyle: 'preserve-3d' }}>
            <p className="text-5xl md:text-6xl font-bold text-brand-primary font-mono" style={{ textShadow: '0 4px 15px rgba(0, 245, 255, 0.4)' }}>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</p>
            <p className="text-sm text-brand-text-secondary uppercase tracking-widest mt-2">{label}</p>
        </div>
      </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            ref={ref}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative p-8 rounded-3xl border border-white/10 bg-brand-surface/20 backdrop-blur-md text-center h-full flex flex-col items-center"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
            <AnimatePresence>
            {isHovered && (
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-px rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary blur-lg opacity-50"
                 />
            )}
            </AnimatePresence>
            <div className="relative z-10 flex flex-col items-center flex-grow">
                <motion.div 
                    className="inline-block p-4 bg-brand-primary/10 rounded-full text-brand-primary mb-6"
                    animate={{ y: isHovered ? -10 : 0, scale: isHovered ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                    {icon}
                </motion.div>
                <h3 className="text-xl font-bold mt-4 text-white">{title}</h3>
                <p className="mt-2 text-brand-text-secondary flex-grow">{description}</p>
            </div>
        </motion.div>
    );
}

const StarRating: React.FC<{ rating: number, className?: string }> = ({ rating, className }) => (
    <div className={`flex gap-1 ${className}`}>
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
        ))}
    </div>
);

const StarRatingInput: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => (
    <div className="flex justify-center gap-2">
        {[...Array(5)].map((_, i) => {
            const starValue = i + 1;
            return (
                <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(starValue)}
                    className="cursor-pointer"
                >
                    <Star
                        size={32}
                        className={`transition-colors duration-200 ${starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                    />
                </motion.div>
            );
        })}
    </div>
);

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
    return (
        <div className="h-full bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col text-left shadow-lg transition-all duration-300 hover:border-brand-primary/50 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-brand-bg text-xl">
                    {testimonial.name?.charAt(0) || 'A'}
                </div>
                <div>
                    <p className="font-bold text-white text-lg">{testimonial.name || 'Anonymous'}</p>
                    <StarRating rating={testimonial.rating} />
                </div>
            </div>
            <p className="text-brand-text-secondary italic my-2 flex-grow">"{testimonial.text}"</p>
        </div>
    );
};


const HomePage: React.FC<{ onNavigate: (view: 'login' | 'register' | 'homepage' | 'testimonials') => void, onLogoClick: () => void }> = ({ onNavigate, onLogoClick }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    
    // Testimonial Form State
    const [formRating, setFormRating] = useState(0);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formText, setFormText] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchTestimonials = async () => {
            const allTestimonials = await getTestimonials();
            // Show the 6 most recent testimonials
            setTestimonials(allTestimonials.slice(0, 6));
        };
        fetchTestimonials();
    }, []);

    const features = [
        { icon: <Cpu size={28} />, title: "AI-Powered Arbitrage", description: "Our machine learning algorithms scan 50+ exchanges in real-time to find and execute profitable trades." },
        { icon: <Zap size={28} />, title: "Fully Automated", description: "Set it and forget it. TradePilot AI operates 24/7, capitalizing on market opportunities while you sleep." },
        { icon: <ShieldCheck size={28} />, title: "Bank-Grade Security", description: "Your funds and data are protected with multi-layer encryption and industry-leading security protocols." },
        { icon: <Repeat size={28} />, title: "Instant Execution", description: "High-frequency trading infrastructure ensures your arbitrage opportunities are seized without delay." },
        { icon: <TrendingUp size={28} />, title: "Profit Tracking", description: "Monitor your AI's performance and track your profits with our intuitive dashboard." },
        { icon: <BarChart size={28} />, title: "Transparent Reporting", description: "Get detailed reports on every trade, ensuring complete transparency and trust." },
    ];
    
    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formText || !formName) {
            setFormError('Full Name and Testimonial text are required.');
            return;
        }
        if(formRating < 1 || formRating > 5) {
            setFormError('Please select a star rating.');
            return;
        }
        setFormError('');
        setIsSubmitting(true);
        try {
            const newTestimonial = await addTestimonial({ name: formName, email: formEmail, text: formText, rating: formRating });
            setShowSuccess(true);
            setFormName('');
            setFormEmail('');
            setFormText('');
            setFormRating(0);
            // Add new testimonial to the top of the list
            setTestimonials(prev => [newTestimonial, ...prev.slice(0, 5)]);
        } catch (error) {
            setFormError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-brand-bg min-h-screen overflow-x-hidden text-brand-text selection:bg-brand-primary selection:text-brand-bg">
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-brand-bg via-brand-bg to-purple-900/20"></div>
            <Header onLogoClick={onLogoClick} onNavigate={onNavigate} />
            
            <main>
                <section className="relative h-screen flex items-center justify-center text-center px-4 overflow-hidden">
                    <div className="relative z-10">
                        <h1 
                            className="text-5xl sm:text-6xl md:text-8xl font-bold text-white leading-tight tracking-tighter"
                            style={{ textShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
                        >
                            The Future of <br/>
                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-brand-primary to-brand-secondary">
                                Intelligent Trading
                            </span>
                        </h1>
                        <p 
                            className="mt-6 max-w-2xl mx-auto text-lg text-brand-text-secondary"
                        >
                            TradePilot AI executes thousands of arbitrage trades per day, fully automated, across 50+ exchanges. Your passive income journey starts here.
                        </p>
                        <div
                            className="mt-10 flex justify-center items-center gap-4"
                        >
                             <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-brand-primary text-brand-bg font-bold rounded-full text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_theme(colors.brand.primary)]">
                                Start Earning Now
                            </button>
                        </div>
                    </div>
                </section>

                <Section className="bg-brand-bg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <StatCounter to={50} suffix="+" label="Exchanges Monitored" />
                        <StatCounter to={24000} suffix="+" label="Active Users" />
                        <StatCounter to={2.7} decimals={1} suffix="M+" label="USD Daily Volume" />
                    </div>
                </Section>
                
                <Section id="features" className="bg-brand-bg">
                    <SectionTitle subtitle="Why TradePilot" title={<>An <span className="bg-clip-text text-transparent bg-gradient-to-br from-brand-primary to-brand-secondary">Unfair</span> Advantage</>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div key={feature.title}>
                                <FeatureCard {...feature} />
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="testimonials" className="bg-brand-bg">
                    <SectionTitle subtitle="Social Proof" title="Trusted by Thousands" />
                    <p className="text-center max-w-3xl mx-auto -mt-8 mb-16 text-lg text-brand-text-secondary">
                        Hear from our community and share your success story. Your feedback helps us innovate and grow. Real stories, real results.
                    </p>

                     <div className="max-w-2xl mx-auto mb-20">
                        <div className="relative p-8 bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl">
                            <AnimatePresence mode="wait">
                            {showSuccess ? (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="text-center py-12"
                                >
                                    <CheckCircle className="mx-auto text-green-400 w-16 h-16 mb-4" />
                                    <h3 className="text-2xl font-bold text-white">Thank You!</h3>
                                    <p className="text-brand-text-secondary mt-2">Your testimonial has been submitted.</p>
                                    <button onClick={() => setShowSuccess(false)} className="mt-6 px-6 py-2 bg-brand-primary text-brand-bg font-bold rounded-full">Submit Another</button>
                                </motion.div>
                            ) : (
                                <motion.form 
                                    key="form"
                                    onSubmit={handleTestimonialSubmit} 
                                    className="space-y-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="text-center">
                                        <label className="text-brand-text-secondary mb-3 block">Click to select your rating</label>
                                        <StarRatingInput rating={formRating} setRating={setFormRating} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <input type="text" placeholder="Full Name (required)" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
                                        <input type="email" placeholder="Email (optional)" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
                                    </div>
                                    <textarea placeholder="Your testimonial... (required)" value={formText} onChange={e => setFormText(e.target.value)} rows={5} required className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
                                    {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}
                                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 disabled:opacity-50">
                                        {isSubmitting ? <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div> : <><Send size={18}/> Submit Review</>}
                                    </button>
                                </motion.form>
                            )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <div 
                                key={testimonial.id}
                                className="h-full"
                            >
                                <TestimonialCard testimonial={testimonial} />
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <button onClick={() => onNavigate('testimonials')} className="px-8 py-3 bg-brand-surface/50 border border-white/20 text-white font-bold rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/40">
                            View All Testimonials
                        </button>
                    </div>
                </Section>
            </main>

            <footer className="bg-transparent border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto text-center text-brand-text-secondary">
                    <p>&copy; {new Date().getFullYear()} TradePilot AI. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;