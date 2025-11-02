import React from 'react';
import { motion } from 'framer-motion';
import { DashboardView } from '../Dashboard';

// --- 3D SVG Icons ---
// Each icon is designed to have a 3D feel with gradients and a glowing effect when active.

// FIX: Changed the component to be explicitly typed as React.FC to resolve a props-related type error.
const IconWrapper: React.FC<{ children: React.ReactNode, isActive: boolean }> = ({ children, isActive }) => (
  <motion.div
    className="relative w-7 h-7 flex items-center justify-center"
    animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -5 : 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
  >
    {children}
  </motion.div>
);

const SVGDefs = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            <linearGradient id="iconGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="100%" stopColor="#e040fb" />
            </linearGradient>
            <linearGradient id="iconGradInactive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a0a0b0" />
                <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
            <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    </svg>
);


const OverviewIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ filter: isActive ? 'url(#iconGlow)' : 'none' }}>
            <path d="M3 10H10V3H3V10Z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 10H21V3H14V10Z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 21H21V14H14V21Z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 21H10V14H3V21Z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

const DepositIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ filter: isActive ? 'url(#iconGlow)' : 'none' }}>
            <path d="M12 3V15M12 15L16 11M12 15L8 11" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

const WithdrawIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ filter: isActive ? 'url(#iconGlow)' : 'none' }}>
            <path d="M12 21V9M12 9L16 13M12 9L8 13" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

// FIX: Changed the component to be explicitly typed as React.FC to resolve a props-related type error.
const AIPlanIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ filter: isActive ? 'url(#iconGlow)' : 'none' }}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.11.64-1.14 1.05-2.28 1.05-3.39 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 1.11.41 2.25 1.05 3.39-.65.81-.66 2.27.05 3.11z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.5 9.5c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.11.64-1.14 1.05-2.28 1.05-3.39 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 1.11.41 2.25 1.05 3.39-.65.81-.66 2.27.05 3.11z" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

const ReferralIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ filter: isActive ? 'url(#iconGlow)' : 'none' }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="7" r="4" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 8v6" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11h-6" stroke={isActive ? "url(#iconGradActive)" : "url(#iconGradInactive)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);


interface BottomNavBarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: DashboardView; icon: React.FC<{ isActive: boolean }>; label: string }[] = [
        { view: 'overview', icon: OverviewIcon, label: 'Overview' },
        { view: 'deposit', icon: DepositIcon, label: 'Deposit' },
        { view: 'withdraw', icon: WithdrawIcon, label: 'Withdraw' },
        { view: 'plans', icon: AIPlanIcon, label: 'AI Plan' },
        { view: 'referrals', icon: ReferralIcon, label: 'Referral' },
    ];

    return (
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="fixed bottom-0 left-0 right-0 p-3 z-30 lg:hidden"
        >
            <SVGDefs />
            <div className="relative mx-auto max-w-sm bg-black/30 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex justify-around items-center shadow-[0px_8px_25px_rgba(0,0,0,0.6)]">
                 <div className="absolute inset-0 border-2 border-brand-primary/50 rounded-[2rem] blur-sm pointer-events-none animate-pulse"></div>
                 <div className="absolute inset-0 border border-brand-primary/80 rounded-[2rem] pointer-events-none"></div>

                {navItems.map(({ view, icon: Icon, label }) => {
                    const isActive = activeView === view;
                    return (
                        <motion.button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className="relative flex flex-col items-center justify-center gap-1.5 transition-colors w-full h-full py-2 rounded-full z-10"
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ y: -2 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill-glow"
                                    className="absolute inset-0 bg-gradient-to-br from-brand-primary/30 to-brand-secondary/30 rounded-full"
                                    style={{ borderRadius: 9999 }}
                                    transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
                                />
                            )}
                            <IconWrapper isActive={isActive}>
                                <Icon isActive={isActive} />
                            </IconWrapper>
                            <span className={`text-xs transition-colors ${isActive ? 'text-white font-bold' : 'text-brand-text-secondary'}`}>{label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default BottomNavBar;