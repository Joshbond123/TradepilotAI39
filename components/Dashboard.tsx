

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserData, Transaction } from '../types';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
    LayoutDashboard, LogOut, Bot, X, Menu, TrendingUp, Rocket, Wallet, Mail, Users, ArrowUpFromLine, ArrowDownToLine, LineChart as HistoryIcon, User as UserIcon, Download, MessageSquare
} from 'lucide-react';
import DashboardBackground from './three/DashboardBackground';
import { getUserData, recordProfitAndUpdateDate, getMessages, showBrowserNotification, updateUserNotificationPermission } from '../services/userDataService';

// Import new page components
import HistoryPage from './dashboard/HistoryPage';
import ProfilePage from './dashboard/ProfilePage';
import DepositPage from './dashboard/DepositPage';
import WithdrawPage from './dashboard/WithdrawPage';
import PlansPage from './dashboard/PlansPage';
import ReferralsPage from './dashboard/ReferralsPage';
import InboxPage from './dashboard/InboxPage';
import MessagesPanel from './dashboard/MessagesPanel'; // Import the new MessagesPanel
import NotificationPermissionModal from './dashboard/NotificationPermissionModal';
import BottomNavBar from './dashboard/BottomNavBar';

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = React.useRef<() => void>();
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    function tick() { if (savedCallback.current) savedCallback.current(); }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export type DashboardView = 'overview' | 'history' | 'profile' | 'deposit' | 'withdraw' | 'plans' | 'referrals' | 'inbox';

const Dashboard: React.FC<{ user: User; onLogout: () => void; initialView?: DashboardView }> = ({ user, onLogout, initialView = 'overview' }) => {
    const [activeView, setActiveView] = useState<DashboardView>(initialView);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMessagesPanelOpen, setMessagesPanelOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    const notificationIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadUserData = useCallback(async () => {
        setIsLoading(true);
        const data = await getUserData(user.id);
        if (data) {
            setUserData(data);
            if (data.notificationPermission === 'default') {
                const timer = setTimeout(() => setNotificationModalOpen(true), 5000);
                return () => clearTimeout(timer);
            }
        }
        setIsLoading(false);
    }, [user.id]);
    
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // PWA Install & Notification Permission Logic
    useEffect(() => {
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        (installPrompt as any).userChoice.then(() => {
            setInstallPrompt(null);
            setIsAppInstalled(true);
        });
    };

    // Daily profit generation logic & notification
    useEffect(() => {
        const checkAndAddProfit = async () => {
            if (userData?.activePlan?.isActive) {
                const { activePlan } = userData;
                const now = new Date();
                const lastProfit = activePlan.lastProfitDate ? new Date(activePlan.lastProfitDate) : new Date(activePlan.activationDate!);

                const msInDay = 24 * 60 * 60 * 1000;
                if (now.getTime() - lastProfit.getTime() >= msInDay) {
                    const dailyProfit = activePlan.investment * (activePlan.dailyReturn / 100);
                    
                    const updatedData = await recordProfitAndUpdateDate(userData.id, parseFloat(dailyProfit.toFixed(2)));
                    if (updatedData) {
                        setUserData(updatedData);
                        const profitText = `+${formatCurrency(dailyProfit)} profit generated!`;
                        showToast(profitText);
                        showBrowserNotification('Profit Generated!', { body: `Your AI has generated ${formatCurrency(dailyProfit)}. New balance: ${formatCurrency(updatedData.balance)}.` });
                    }
                }
            }
        };

        if (userData) {
            const timer = setTimeout(() => checkAndAddProfit(), 2000); // Check 2s after data loads
            return () => clearTimeout(timer);
        }
    }, [userData]);

    // New messages check for indicator and notifications
    const checkNewMessages = useCallback(async () => {
        if (!userData) return;

        const allMessages = await getMessages();
        const lastCheck = localStorage.getItem(`lastMessageCheck_${userData.id}`) || new Date(0).toISOString();
        
        const newMessages = allMessages
            .filter(msg => new Date(msg.createdAt) > new Date(lastCheck))
            .filter(msg => !msg.recipientId || msg.recipientId === userData.id);
        
        const newCount = newMessages.length;
        setNewMessageCount(newCount);
        
        const newMessagesExist = newCount > 0;
        
        if (newMessagesExist && !hasNewMessages) {
            setHasNewMessages(true);
            // Show browser notification only once per check if permission granted
            if (Notification.permission === 'granted') {
                const latestMessage = newMessages.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                showBrowserNotification(`New Message: ${latestMessage.title}`, {
                    body: latestMessage.text.substring(0, 100) + '...',
                });
            }
        } else if (!newMessagesExist) {
            setHasNewMessages(false);
        }
    }, [userData, hasNewMessages]);

    useInterval(checkNewMessages, 15000); // Check every 15 seconds for new messages

    // Effect to handle the repeating notification popup
    useEffect(() => {
        if (hasNewMessages) {
            const showAndHidePopup = () => {
                setShowNotificationPopup(true);
                setTimeout(() => setShowNotificationPopup(false), 4000); // Popup visible for 4s
            };
    
            showAndHidePopup(); // Show immediately once
            notificationIntervalRef.current = setInterval(showAndHidePopup, 20000); // Then repeat every 20s
    
            return () => {
                if (notificationIntervalRef.current) {
                    clearInterval(notificationIntervalRef.current);
                }
            };
        } else {
            setShowNotificationPopup(false);
            if (notificationIntervalRef.current) {
                clearInterval(notificationIntervalRef.current);
            }
        }
    }, [hasNewMessages]);


    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleResize = () => setSidebarOpen(mediaQuery.matches);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleInboxOpened = useCallback(() => {
        if (userData) {
            localStorage.setItem(`lastMessageCheck_${userData.id}`, new Date().toISOString());
            setHasNewMessages(false);
            setNewMessageCount(0);
        }
    }, [userData]);
    
    const renderContent = () => {
        if (isLoading || !userData) {
            return (
                <div className="flex items-center justify-center h-full pt-20">
                    <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }
        
        switch(activeView) {
            case 'overview': return <OverviewContent userData={userData} />;
            case 'history': return <HistoryPage transactions={userData.transactions} />;
            case 'profile': return <ProfilePage user={userData} showToast={showToast} onUpdate={loadUserData} onLogout={onLogout} />;
            case 'deposit': return <DepositPage userData={userData} showToast={showToast} onUpdate={loadUserData} />;
            case 'withdraw': return <WithdrawPage userData={userData} showToast={showToast} onUpdate={loadUserData} />;
            case 'plans': return <PlansPage userData={userData} showToast={showToast} onUpdate={loadUserData} />;
            case 'referrals': return <ReferralsPage userData={userData} showToast={showToast} />;
            case 'inbox': return <InboxPage user={userData} />;
            default: return <OverviewContent userData={userData} />;
        }
    };

    const NavItem: React.FC<{ view: DashboardView; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => {
                setActiveView(view);
                if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                }
            }}
            className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-300 transform hover:scale-105 ${activeView === view ? 'bg-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(0,245,255,0.5)]' : 'text-brand-text-secondary hover:bg-white/10 hover:text-white'}`}
        >
            {icon}
            <span className="ml-4 whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-brand-bg font-sans">
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                      onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
            
            <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-brand-surface/50 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col p-4 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-brand-primary">TradePilot</h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-full hover:bg-white/10 text-brand-text-secondary">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex flex-col gap-2">
                    <NavItem view="overview" icon={<LayoutDashboard size={20}/>} label="Overview" />
                    <NavItem view="history" icon={<HistoryIcon size={20}/>} label="History" />
                    <NavItem view="profile" icon={<UserIcon size={20}/>} label="Profile" />
                </nav>
                <div className="mt-auto">
                    {installPrompt && !isAppInstalled && (
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-white bg-gradient-to-br from-brand-primary/50 to-brand-secondary/50 border border-white/20 shadow-lg mb-2
                                       transition-all duration-300 transform hover:scale-105 hover:shadow-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <Download size={20} className="mr-3"/>
                            <span className="font-semibold whitespace-nowrap">Download App</span>
                        </button>
                    )}
                    <button onClick={onLogout} className="flex items-center w-full px-4 py-3 text-left rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 transform hover:scale-105">
                        <LogOut size={20}/>
                        <span className="ml-4">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative pb-24 lg:pb-8">
                <DashboardBackground />
                 <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 absolute top-6 left-6 text-white z-20 transition-opacity ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <Menu size={28}/>
                </button>
                <motion.button
                    onClick={() => {
                        if (userData) {
                            handleInboxOpened();
                            setMessagesPanelOpen(true);
                        }
                    }}
                    className="fixed top-6 right-6 lg:right-8 z-20 text-white p-3 bg-brand-surface/50 backdrop-blur-lg rounded-full border border-white/10 shadow-lg"
                    whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 245, 255, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Open Inbox"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <Mail size={24} />
                    <AnimatePresence>
                    {hasNewMessages && (
                        <motion.div 
                            className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-brand-surface shadow-[0_0_12px_2px_theme(colors.red.500)]"
                            style={{ transform: 'translateZ(10px)' }}
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.3, 1] }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
                        />
                    )}
                    </AnimatePresence>
                </motion.button>
                <AnimatePresence>
                    {showNotificationPopup && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: 50, scale: 0.8, rotateX: -20 }}
                            animate={{ opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, y: 50, x: 50, scale: 0.8, rotateX: 20, transition: { duration: 0.4 } }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="fixed top-24 right-6 lg:right-8 z-50 p-4 w-full max-w-xs bg-brand-surface/70 backdrop-blur-2xl border border-brand-primary/50 rounded-2xl shadow-2xl shadow-brand-primary/30"
                            style={{ pointerEvents: 'auto', perspective: '800px' }}
                        >
                            <div style={{ transformStyle: 'preserve-3d' }}>
                                <div style={{ transform: 'translateZ(20px)' }} className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-primary/20 rounded-full text-brand-primary">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">You have {newMessageCount} unread message{newMessageCount === 1 ? '' : 's'}.</p>
                                        <p className="text-sm text-brand-text-secondary">Check your inbox.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative z-10 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
            <Toast toast={toast} />
            {userData && <MessagesPanel 
                isOpen={isMessagesPanelOpen} 
                onClose={() => setMessagesPanelOpen(false)}
                user={userData}
            />}
            <NotificationPermissionModal 
                isOpen={isNotificationModalOpen} 
                onClose={() => setNotificationModalOpen(false)}
                onPermissionResult={(permission) => {
                    if (userData) {
                        updateUserNotificationPermission(userData.id, permission);
                    }
                }}
            />
        </div>
    );
};

const Card: React.FC<{children: React.ReactNode, className?: string, isHoverable?: boolean}> = ({ children, className = '', isHoverable = true }) => (
    <div className={`bg-gradient-to-br from-brand-surface/40 to-brand-surface/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden group ${isHoverable && 'hover:border-violet-500/50 hover:shadow-violet-500/20 hover:-translate-y-1'} ${className}`}>
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/40 to-violet-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
        <div className="relative h-full w-full">
            {children}
        </div>
    </div>
);

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCryptoPrice = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: value > 1 ? 3 : 6 })}`;

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
            >
                {formatCurrency(value)}
            </motion.span>
        </AnimatePresence>
    );
};

const ArbitrageDisplay: React.FC = () => {
    const TradingVisualization = React.lazy(() => import('./three/TradingVisualization'));

    return (
        <Card className="h-[280px] p-0" isHoverable={false}>
            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-brand-text-secondary">Loading live feed...</div>}>
                <TradingVisualization />
            </React.Suspense>
        </Card>
    );
};

const UserSummary: React.FC<{ userData: UserData }> = ({ userData }) => {
    const recentTransactions = [...userData.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    return (
        <Card className="p-6" isHoverable={false}>
            <h3 className="font-bold text-white text-lg mb-4">Recent Activity</h3>
            {recentTransactions.length > 0 ? (
                <ul className="space-y-3">
                    {recentTransactions.map(tx => (
                        <li key={tx.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold text-white">{tx.type}</p>
                                <p className="text-xs text-brand-text-secondary">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <p className={`font-mono font-bold ${tx.type === 'Deposit' || tx.type === 'Profit' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.type === 'Deposit' || tx.type === 'Profit' ? '+' : '-'}{formatCurrency(tx.usdValue || tx.amount)}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-brand-text-secondary text-center py-4">No recent transactions.</p>
            )}
        </Card>
    );
};

const OverviewContent: React.FC<{ userData: UserData; }> = ({ userData }) => (
    <div className="flex flex-col gap-6 mt-12 lg:mt-0">
        <DashboardHeader user={userData} />
        <WalletSummary userData={userData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AiPerformance userData={userData} />
            <ArbitrageDisplay />
        </div>
        <UserSummary userData={userData} />
    </div>
);

const DashboardHeader: React.FC<{ user: UserData; }> = ({ user }) => (
    <div className="p-6 bg-brand-surface/40 backdrop-blur-lg border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Welcome, {user.name}!</h2>
            <div className="flex items-center gap-3 mt-2">
                {user.activePlan?.isActive ? (
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_theme(colors.green.400)]"></div>
                        <span className="font-semibold text-sm">AI Trading Active</span>
                    </div>
                ) : user.activePlan && !user.activePlan.isActive ? (
                     <div className="flex items-center gap-2 text-yellow-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <span className="font-semibold text-sm">AI Inactive - Activate your plan</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-red-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <span className="font-semibold text-sm">No Active Plan</span>
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-4">
            <p className="font-bold text-white px-3 py-1 bg-brand-primary/20 border border-brand-primary/80 rounded-full text-sm">{user.activePlan?.name || "No Plan"}</p>
        </div>
    </div>
);

const WalletSummary: React.FC<{ userData: UserData }> = ({ userData }) => {
    const WalletCard: React.FC<{ title: string, value: number, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <Card className="p-4">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-full">{icon}</div>
                <div>
                    <p className="text-sm text-brand-text-secondary">{title}</p>
                    <p className="text-lg md:text-xl font-bold text-white font-mono"><AnimatedCounter value={value} /></p>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <WalletCard title="Available Balance" value={userData.balance} icon={<Wallet size={24}/>} />
            <WalletCard title="Total Profit" value={userData.totalProfit} icon={<TrendingUp size={24}/>} />
            <WalletCard title="Active Investment" value={userData.activePlan?.investment || 0} icon={<Rocket size={24}/>} />
        </div>
    );
};

const AnimatedNumber = ({ value, formatter }: { value: number, formatter: (val: number) => string }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 100, damping: 20 });
    const display = useTransform(spring, (current) => formatter(current));

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};

const AiPerformance: React.FC<{ userData: UserData }> = ({ userData }) => {
    const NeuralNetwork = React.lazy(() => import('./three/NeuralNetwork'));
    
    const [duration, setDuration] = useState('0d, 0h');

    useEffect(() => {
        if (!userData.activePlan?.isActive || !userData.activePlan.activationDate) {
            setDuration('0d, 0h');
            return;
        }

        const timer = setInterval(() => {
            const activationTime = new Date(userData.activePlan!.activationDate!).getTime();
            const now = new Date().getTime();
            const diff = now - activationTime;

            if (diff < 0) {
                setDuration("0d, 0h");
                return;
            }

            let seconds = Math.floor(diff / 1000);
            let hours = Math.floor(seconds / 3600);
            const days = Math.floor(hours / 24);
            hours = hours % 24;
            setDuration(`${days}d, ${hours}h`);
        }, 1000);

        return () => clearInterval(timer);
    }, [userData.activePlan]);

    const performanceMetrics = useMemo(() => {
        const totalTrades = userData.transactions.filter(t => t.type === 'Profit').length;

        if (!userData.activePlan) {
            return { dailyROI: 0, totalTrades, daysLeft: 'N/A', cycleProgress: 0 };
        }
        
        const { dailyReturn, activationDate, duration, isActive } = userData.activePlan;
        
        if (!isActive || !activationDate) {
             return { dailyROI: dailyReturn, totalTrades, daysLeft: '0 days', cycleProgress: 0 };
        }

        const activationTime = new Date(activationDate).getTime();
        const now = new Date().getTime();
        const endTime = activationTime + duration * 24 * 60 * 60 * 1000;
        const timeLeft = endTime - now;
        
        const daysLeft = timeLeft <= 0 ? "0 days" : `${Math.ceil(timeLeft / (1000 * 60 * 60 * 24))} days`;

        const totalDurationMs = duration * 24 * 60 * 60 * 1000;
        const elapsedTimeMs = now - activationTime;
        const cycleProgress = Math.min(100, Math.max(0, (elapsedTimeMs / totalDurationMs) * 100));

        return { dailyROI: dailyReturn, totalTrades, daysLeft, cycleProgress };
    }, [userData]);
    
    const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
        const radius = 18; const stroke = 3;
        const normalizedRadius = radius - stroke;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress / 100) * circumference;
        return (
            <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                <circle stroke="rgba(255,255,255,0.1)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <motion.circle
                    stroke="url(#progressGradient)" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference}
                    style={{ strokeDashoffset }} r={normalizedRadius} cx={radius} cy={radius}
                    initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1, ease: 'easeInOut' }}
                />
                <defs><linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#00f5ff" /><stop offset="100%" stopColor="#e040fb" /></linearGradient></defs>
            </svg>
        );
    };

    const StatCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
        <motion.div
            whileHover={{ y: -5, scale: 1.05 }}
            className={`bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-center flex flex-col justify-center items-center ${className}`}
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div style={{ transform: 'translateZ(20px)' }}>
                <p className="text-xs text-brand-text-secondary mb-1">{title}</p>
                {children}
            </div>
        </motion.div>
    );

    return (
        <Card className="p-4 flex flex-col h-[280px] overflow-hidden" isHoverable={false}>
            <div className="flex-shrink-0 text-center mb-2 relative">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary" style={{ textShadow: '0 0 10px rgba(0, 245, 255, 0.5)'}}>
                    AI Performance
                </h3>
                <p className="text-xs text-brand-text-secondary/80">Live metrics powered by real AI trading data</p>
                <div className="absolute inset-x-0 bottom-[-5px] h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent animate-pulse"></div>
            </div>

            <div className="flex-grow relative flex items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-50">
                    <React.Suspense fallback={null}><NeuralNetwork /></React.Suspense>
                </div>
                
                <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-3 w-full max-w-sm">
                    <StatCard title="Daily ROI">
                        <p className="text-2xl font-bold font-mono text-green-400">
                           +<AnimatedNumber value={performanceMetrics.dailyROI} formatter={(v) => v.toFixed(2)} />%
                        </p>
                    </StatCard>
                    <StatCard title="Profit Trades">
                        <p className="text-2xl font-bold font-mono text-white">
                            <AnimatedNumber value={performanceMetrics.totalTrades} formatter={(v) => Math.round(v).toLocaleString()} />
                        </p>
                    </StatCard>
                    <StatCard title="Active Duration">
                        <p className="text-lg font-bold font-mono text-white">{duration}</p>
                    </StatCard>
                     <StatCard title="Days Left">
                        <div className="flex items-center justify-center gap-2">
                            <CircularProgress progress={performanceMetrics.cycleProgress} />
                            <p className="text-lg font-bold font-mono text-white">{performanceMetrics.daysLeft}</p>
                        </div>
                    </StatCard>
                </div>
            </div>
        </Card>
    );
};

const Toast: React.FC<{ toast: { message: string, type: 'success' | 'error' } | null }> = ({ toast }) => {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                    className={`fixed bottom-24 lg:bottom-10 right-10 z-50 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                    {toast.message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Dashboard;