
import React from 'react';
import { UserData } from '../../types';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { Users, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ReferralsPage: React.FC<{ userData: UserData; showToast: (msg: string) => void }> = ({ userData, showToast }) => {
    const { referrals } = userData;

    const handleCopy = () => {
        if (referrals.link) {
            navigator.clipboard.writeText(referrals.link);
            showToast('Referral link copied!');
        }
    };

    return (
        <DashboardPageLayout title="Referrals" icon={<Users size={28} />}>
            <p className="text-brand-text-secondary">Earn commissions by referring new users to TradePilot AI. You get a percentage of their profits, forever!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div initial={{opacity: 0, x: -50}} animate={{opacity: 1, x: 0}} transition={{ duration: 0.5, delay: 0.1 }}>
                    <InteractiveCard className="p-6">
                        <p className="text-brand-text-secondary">Total Referrals</p>
                        <p className="text-4xl font-bold text-white font-mono">{referrals.count}</p>
                    </InteractiveCard>
                </motion.div>
                <motion.div initial={{opacity: 0, x: 50}} animate={{opacity: 1, x: 0}} transition={{ duration: 0.5, delay: 0.2 }}>
                     <InteractiveCard className="p-6">
                        <p className="text-brand-text-secondary">Total Earnings</p>
                        <p className="text-4xl font-bold text-white font-mono">{formatCurrency(referrals.earnings)}</p>
                    </InteractiveCard>
                </motion.div>
            </div>

            <motion.div initial={{opacity: 0, y: 50}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.5, delay: 0.3 }}>
                <InteractiveCard className="p-6">
                    <h3 className="font-bold text-white text-lg mb-4">Your Unique Referral Link</h3>
                    <div className="flex items-center bg-brand-bg border border-white/20 rounded-lg p-2">
                        <input type="text" readOnly value={referrals.link} className="w-full bg-transparent outline-none p-2 text-brand-text-secondary font-mono text-sm" />
                        <button onClick={handleCopy} className="p-2 text-white hover:text-brand-primary transition-colors" disabled={!referrals.link}><Copy /></button>
                    </div>
                </InteractiveCard>
            </motion.div>

            <motion.div initial={{opacity: 0, y: 50}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.5, delay: 0.4 }}>
                <h3 className="font-bold text-white text-lg mb-4">Referral History</h3>
                <InteractiveCard className="p-6">
                    {referrals.count > 0 ? (
                        <div className="space-y-3">
                            <p className="text-brand-text-secondary text-sm">You have successfully referred {referrals.count} {referrals.count === 1 ? 'user' : 'users'} to TradePilot AI.</p>
                            <div className="p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-brand-text-secondary text-sm">Total Referrals</p>
                                        <p className="text-2xl font-bold text-white font-mono">{referrals.count}</p>
                                    </div>
                                    <div>
                                        <p className="text-brand-text-secondary text-sm">Total Earnings</p>
                                        <p className="text-2xl font-bold text-brand-primary font-mono">{formatCurrency(referrals.earnings)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-green-500/10 border border-green-400/50 rounded-lg text-green-300 text-sm">
                                <p>💡 <strong>Keep sharing!</strong> You earn a commission for every user who signs up using your referral link and starts trading.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-brand-text-secondary mb-4">You haven't referred anyone yet.</p>
                            <p className="text-sm text-brand-text-secondary">Share your referral link above to start earning commissions!</p>
                        </div>
                    )}
                </InteractiveCard>
            </motion.div>
        </DashboardPageLayout>
    );
};

export default ReferralsPage;
