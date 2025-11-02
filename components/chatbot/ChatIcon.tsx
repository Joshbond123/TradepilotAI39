
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatIconProps {
    onClick: () => void;
    hasNewMessage: boolean;
    text: string;
    showGreetingBubble: boolean;
    greetingMessage: string;
}

const GreetingBubble: React.FC<{ message: string }> = ({ message }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
            exit={{ 
                opacity: 0, 
                y: 20, 
                scale: 0.8,
                transition: { duration: 0.4, ease: 'easeIn' }
            }}
            className="absolute bottom-full right-full mr-4 mb-4 w-64 p-px rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-2xl shadow-brand-primary/30"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <motion.div 
                className="relative bg-brand-surface/80 backdrop-blur-xl rounded-[23px] px-5 py-4 text-center text-white"
                animate={{
                    y: [0, -8, 0],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ transform: 'translateZ(10px)' }}
            >
                <p className="text-sm leading-snug">{message}</p>
                 <div className="absolute top-0 left-0 w-full h-full rounded-[23px] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-2/3 h-1/2 bg-white/10 -translate-x-1/4 -translate-y-1/4 rotate-45 blur-2xl"></div>
                </div>
                <div className="absolute bottom-[-10px] right-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-brand-secondary/80"></div>
            </motion.div>
        </motion.div>
    );
};


const ChatIcon: React.FC<ChatIconProps> = ({ onClick, hasNewMessage, text, showGreetingBubble, greetingMessage }) => {
    return (
        <motion.div
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
            className="fixed bottom-24 right-6 lg:bottom-6 z-50"
        >
            <div className="relative flex flex-col items-center gap-2">
                <AnimatePresence>
                    {showGreetingBubble && <GreetingBubble message={greetingMessage} />}
                </AnimatePresence>

                <motion.button
                    onClick={onClick}
                    className="relative w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-2xl shadow-brand-primary/40 flex items-center justify-center text-brand-bg"
                    whileHover={{ scale: 1.15, y: -5, transition: { type: 'spring', stiffness: 300 } }}
                    whileTap={{ scale: 0.95 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full bg-brand-primary opacity-50"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 0.7, 0.3],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    <div style={{ transform: 'translateZ(20px)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0a0a1a" stopOpacity="0.8"/>
                                    <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.9"/>
                                </linearGradient>
                                <filter id="icon-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <g>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="url(#bubble-grad)" stroke="#00f5ff" strokeWidth="1"/>
                                <circle cx="8" cy="10" r="1.2" fill="#e040fb" filter="url(#icon-glow-filter)" />
                                <circle cx="12" cy="10" r="1.2" fill="#e040fb" filter="url(#icon-glow-filter)" />
                                <circle cx="16" cy="10" r="1.2" fill="#e040fb" filter="url(#icon-glow-filter)" />
                            </g>
                        </svg>
                    </div>

                    <AnimatePresence>
                        {hasNewMessage && (
                             <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-surface shadow-[0_0_10px_theme(colors.red.500)]"
                                style={{ transform: 'translateZ(30px)' }}
                            />
                        )}
                    </AnimatePresence>
                </motion.button>
                <span className="text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-md">{text}</span>
            </div>
        </motion.div>
    );
};

export default ChatIcon;