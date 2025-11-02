

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWelcomePageTemplate } from '../services/userDataService';
import { WelcomePageTemplate } from '../types';
import { DashboardView } from './Dashboard';
import { Mail, LayoutDashboard } from 'lucide-react';
import AuthBackground from './auth/AuthBackground';

interface WelcomePageProps {
  onNavigate: (destination: DashboardView) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
  const [template, setTemplate] = useState<WelcomePageTemplate | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      const data = await getWelcomePageTemplate();
      setTemplate(data);
    };
    fetchTemplate();
  }, []);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
      } 
    },
    exit: { opacity: 0, y: -50, scale: 0.95, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4 font-sans"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
        <AuthBackground />
        <motion.div
            variants={cardVariants}
            className="relative z-10 w-full max-w-2xl bg-brand-surface/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
        >
            <AnimatePresence mode="wait">
            {template ? (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }}
                        className="text-3xl md:text-4xl font-bold text-white mb-4"
                    >
                        {template.title}
                    </motion.h1>

                    {template.imageUrl && (
                        <motion.img 
                            src={template.imageUrl} 
                            alt="Welcome Visual" 
                            className="my-6 rounded-lg max-h-60 mx-auto"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.5 } }}
                        />
                    )}
                    {template.videoUrl && (
                        <motion.video 
                            src={template.videoUrl} 
                            controls 
                            className="my-6 rounded-lg w-full max-w-md mx-auto"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.5 } }}
                        />
                    )}
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.5 } }}
                        className="text-brand-text-secondary max-w-lg mx-auto mb-8 whitespace-pre-wrap"
                    >
                        {template.text}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.5 } }}
                        className="flex flex-col sm:flex-row justify-center items-center gap-4"
                    >
                        <motion.button 
                            onClick={() => onNavigate('inbox')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-secondary text-white font-bold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_theme(colors.brand.secondary)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Mail size={18} /> Go to Inbox
                        </motion.button>
                        <motion.button 
                            onClick={() => onNavigate('overview')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-brand-bg font-bold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_theme(colors.brand.primary)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                             <LayoutDashboard size={18} /> Go to Dashboard
                        </motion.button>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div key="loader" className="h-96 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    </motion.div>
  );
};

export default WelcomePage;