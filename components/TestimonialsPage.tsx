import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Testimonial } from '../types';
import { getTestimonials } from '../services/userDataService';
import { Star, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import HomePageBackground from './three/HomePageBackground';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
        ))}
    </div>
);

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <motion.div 
        className="bg-brand-surface/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col"
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
        <div className="flex justify-between items-start mb-3">
            <div>
                <p className="font-bold text-white">{testimonial.name || 'Anonymous'}</p>
                <p className="text-xs text-brand-text-secondary">{new Date(testimonial.createdAt).toLocaleDateString()}</p>
            </div>
            <StarRating rating={testimonial.rating} />
        </div>
        <p className="text-brand-text italic flex-grow">"{testimonial.text}"</p>
        {testimonial.adminReply && (
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-brand-primary mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-brand-primary text-sm">Reply from TradePilot AI</p>
                        <p className="text-brand-text-secondary text-sm italic">"{testimonial.adminReply}"</p>
                    </div>
                </div>
            </div>
        )}
    </motion.div>
);

const TestimonialsPage: React.FC<{ onNavigate: (view: 'homepage') => void }> = ({ onNavigate }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const testimonialsPerPage = 7;

    useEffect(() => {
        const fetchTestimonials = async () => {
            const data = await getTestimonials();
            setTestimonials(data);
        };
        fetchTestimonials();
    }, []);

    const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);
    const paginatedTestimonials = testimonials.slice(
        (currentPage - 1) * testimonialsPerPage,
        currentPage * testimonialsPerPage
    );

    return (
        <motion.div 
            className="min-h-screen bg-brand-bg text-brand-text font-sans relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <HomePageBackground />
            <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:py-24">
                <motion.button 
                    onClick={() => onNavigate('homepage')} 
                    className="flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
                >
                    <ArrowLeft size={20} /> Back to Home
                </motion.button>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold text-white">What Our Users Say</h1>
                    <p className="text-lg text-brand-text-secondary mt-4">Real feedback from the TradePilot AI community.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedTestimonials.map(testimonial => (
                        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <motion.div 
                        className="flex justify-center items-center gap-4 mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                    >
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            className="p-2 rounded-full bg-brand-surface/50 hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <span className="font-mono text-brand-text-secondary">Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span></span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-full bg-brand-surface/50 hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default TestimonialsPage;