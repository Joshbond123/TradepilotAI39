import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData } from '../../types';
import DashboardPageLayout from './DashboardPageLayout';
import { investInPlan, activatePlan } from '../../services/userDataService';
import { Bot, CheckCircle, Cpu, Gem, Rocket, X, Zap } from 'lucide-react';

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AI_PLANS_DATA = [
    { name: 'Starter AI Bot', dailyReturn: 17.5, minDeposit: 50, maxDeposit: 500, duration: 30, totalROI: 525.0, features: ['Real-time market scanning', 'Basic risk management', '24/7 automated trading'], buttonText: 'Select Plan', isPopular: false, icon: <Cpu size={28}/>, color: 'brand-primary' },
    { name: 'Professional AI Bot', dailyReturn: 25.2, minDeposit: 500, maxDeposit: 2500, duration: 60, totalROI: 1512.0, features: ['Multi-exchange arbitrage', 'Advanced algorithms', 'Priority support', 'Risk diversification'], buttonText: 'Select Plan', isPopular: true, icon: <Zap size={28}/>, color: 'brand-secondary' },
    { name: 'Elite AI Bot', dailyReturn: 38.4, minDeposit: 2500, maxDeposit: 10000, duration: 90, totalROI: 3456.0, features: ['Institutional-grade algorithms', 'Cross-chain arbitrage', 'Dedicated account manager', 'Custom strategies', 'VIP support'], buttonText: 'Select Plan', isPopular: false, icon: <Gem size={28} />, color: 'brand-accent' },
];

const PlansPage: React.FC<{ userData: UserData; showToast: (msg: string, type?: 'success' | 'error') => void; onUpdate: () => void; }> = ({ userData, showToast, onUpdate }) => {
    const [selectedPlan, setSelectedPlan] = useState<typeof AI_PLANS_DATA[0] | null>(null);
    const [investmentAmount, setInvestmentAmount] = useState<string>('');

    const handleSelectPlan = (plan: typeof AI_PLANS_DATA[0]) => {
        if (userData.activePlan) return;
        setSelectedPlan(plan);
    };

    const handleConfirmInvestment = async () => {
        if (!selectedPlan) return;
        const amount = parseFloat(investmentAmount);

        if(isNaN(amount) || amount <= 0) {
            showToast('Invalid amount', 'error'); return;
        }
        if (amount < selectedPlan.minDeposit || amount > selectedPlan.maxDeposit) {
            showToast('Amount is outside plan limits', 'error'); return;
        }
        if(amount > userData.balance) {
            showToast('Insufficient balance', 'error'); return;
        }

        const updatedData = await investInPlan(userData.id, selectedPlan, amount);
        if (updatedData) {
            showToast(`Successfully invested in ${selectedPlan.name}!`);
            onUpdate();
        } else {
            showToast('Investment failed. Check your balance.', 'error');
        }
        
        setSelectedPlan(null);
        setInvestmentAmount('');
    };
    
    const handlePlanActivation = async () => {
        if (!userData || !userData.activePlan) return;
        const updatedData = await activatePlan(userData.id);
        if (updatedData) {
            showToast(`${updatedData.activePlan?.name} has been activated!`);
            onUpdate();
        } else {
            showToast('Activation failed.', 'error');
        }
    };

    if (userData.activePlan) {
        return (
            <DashboardPageLayout title="Active Plan" icon={<Bot size={28}/>}>
                <div className="flex flex-col items-center justify-center text-center gap-6 p-8 min-h-[60vh]">
                     <motion.div className="p-4 bg-brand-primary/10 text-brand-primary rounded-full" animate={{ scale: [1, 1.1, 1]}} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                        <Rocket size={48} />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white">Your Plan: {userData.activePlan.name}</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                        <div className="text-brand-text-secondary">Status</div><div className={`font-bold ${userData.activePlan.isActive ? 'text-green-400' : 'text-yellow-400'}`}>{userData.activePlan.isActive ? 'Active' : 'Inactive'}</div>
                        <div className="text-brand-text-secondary">Investment</div><div className="font-bold font-mono">{formatCurrency(userData.activePlan.investment)}</div>
                        <div className="text-brand-text-secondary">Daily Return</div><div className="font-bold font-mono">{userData.activePlan.dailyReturn}%</div>
                    </div>

                    {!userData.activePlan.isActive && (
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handlePlanActivation} 
                            className="mt-4 px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg shadow-green-500/30"
                        >
                            Activate Plan Now
                        </motion.button>
                    )}
                </div>
            </DashboardPageLayout>
        )
    }

    return (
        <DashboardPageLayout title="AI Trading Plans" icon={<Bot size={28} />}>
            <p className="text-brand-text-secondary">Choose your AI plan to start generating passive income. Your capital is fully managed by our advanced arbitrage bots.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {AI_PLANS_DATA.map((plan, i) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                        <PlanCard plan={plan} onSelect={handleSelectPlan} />
                    </motion.div>
                ))}
            </div>
            <InvestmentModal 
                isOpen={!!selectedPlan} 
                onClose={() => setSelectedPlan(null)} 
                plan={selectedPlan} 
                userData={userData}
                amount={investmentAmount}
                setAmount={setInvestmentAmount}
                onConfirm={handleConfirmInvestment}
            />
        </DashboardPageLayout>
    );
};

const PlanCard: React.FC<{ plan: typeof AI_PLANS_DATA[0], onSelect: (plan: any) => void }> = ({ plan, onSelect }) => {
    const popularGlow = "absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt";

    return (
        <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            className={`relative group h-full ${plan.isPopular ? 'p-0.5' : ''}`}
        >
            {plan.isPopular && <div className={popularGlow}></div>}
            <div className="relative bg-brand-surface/60 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-full flex flex-col">
                {plan.isPopular && <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-brand-accent text-brand-bg text-xs font-bold rounded-full uppercase">Most Popular</div>}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 bg-${plan.color}/10 text-${plan.color} rounded-full`}>{plan.icon}</div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>
                
                <div className="my-4 text-center">
                    <p className="text-5xl font-bold text-white font-mono">{plan.dailyReturn}%</p>
                    <p className="text-brand-text-secondary">Daily Return</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center my-4 border-y border-white/10 py-4">
                    <div><p className="font-bold text-white">{plan.duration} Days</p><p className="text-xs text-brand-text-secondary">Duration</p></div>
                    <div><p className="font-bold text-white">{plan.totalROI.toLocaleString()}%</p><p className="text-xs text-brand-text-secondary">Total ROI</p></div>
                    <div><p className="font-bold text-white">{formatCurrency(plan.minDeposit)}</p><p className="text-xs text-brand-text-secondary">Min Deposit</p></div>
                    <div><p className="font-bold text-white">{formatCurrency(plan.maxDeposit)}</p><p className="text-xs text-brand-text-secondary">Max Deposit</p></div>
                </div>

                <ul className="space-y-2 text-brand-text-secondary mb-6 flex-grow">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-400" /><span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <button onClick={() => onSelect(plan)} className={`w-full mt-auto py-3 bg-brand-primary text-brand-bg font-bold rounded-lg transition-transform hover:scale-105 group-hover:shadow-[0_0_20px_theme(colors.brand.primary)]`}>
                    {plan.buttonText}
                </button>
            </div>
        </motion.div>
    );
};

const InvestmentModal: React.FC<{
    isOpen: boolean; onClose: () => void; plan: typeof AI_PLANS_DATA[0] | null; userData: UserData; amount: string; setAmount: (val: string) => void; onConfirm: () => void;
}> = ({ isOpen, onClose, plan, userData, amount, setAmount, onConfirm }) => {
    const numericAmount = parseFloat(amount) || 0;
    const dailyProfit = plan ? numericAmount * (plan.dailyReturn / 100) : 0;
    const totalReturn = plan ? numericAmount + (numericAmount * (plan.totalROI / 100)) : 0;

    const error = useMemo(() => {
        if (!plan || !amount) return null;
        if (numericAmount < plan.minDeposit) return `Minimum investment is ${formatCurrency(plan.minDeposit)}`;
        if (numericAmount > plan.maxDeposit) return `Maximum investment is ${formatCurrency(plan.maxDeposit)}`;
        if (numericAmount > userData.balance) return `Insufficient balance`;
        return null;
    }, [numericAmount, plan, userData.balance, amount]);

    return (
        <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Invest in {plan?.name || ''}</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
                    </div>
                    {plan && (
                        <div className="space-y-4">
                            <div className="p-4 bg-brand-bg border border-white/10 rounded-lg text-center">
                                <p className="text-sm text-brand-text-secondary">Available Balance</p>
                                <p className="text-2xl font-bold font-mono text-white">{formatCurrency(userData.balance)}</p>
                            </div>
                            <div>
                                <label className="block text-brand-text-secondary mb-2">Enter Investment Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">$</span>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder={`${plan.minDeposit} - ${plan.maxDeposit}`}
                                        className="w-full pl-7 p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary focus:outline-none focus:border-brand-primary transition-all duration-300 glow-input"
                                    />
                                </div>
                            </div>
                            
                            <AnimatePresence>
                            {numericAmount > 0 && (
                                <motion.div initial={{opacity:0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity:0, height: 0}} className="overflow-hidden">
                                    <div className="p-4 bg-brand-bg/50 border border-white/10 rounded-lg space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-brand-text-secondary">Daily Profit</span><span className="font-mono font-bold text-green-400">~{formatCurrency(dailyProfit)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-brand-text-secondary">Total Return</span><span className="font-mono font-bold text-brand-primary">~{formatCurrency(totalReturn)}</span></div>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>

                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                            
                            <button onClick={onConfirm} disabled={!!error || !amount} className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105">
                                Confirm Investment
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
    );
};

export default PlansPage;