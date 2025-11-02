import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Imported the 'Transaction' type to resolve a type error in the handleWithdraw function.
import { UserData, WalletConfig, Transaction } from '../../types';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { getWalletConfig, addTransaction } from '../../services/userDataService';
import { ArrowUpFromLine } from 'lucide-react';

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CRYPTO_LOGOS: { [key: string]: string } = {
    BTC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/btc.svg',
    ETH: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/eth.svg',
    USDT: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/usdt.svg'
};

const WithdrawPage: React.FC<{
    userData: UserData;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    onUpdate: () => void;
}> = ({ userData, showToast, onUpdate }) => {
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState<string>('');
    const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);
    const detailsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getWalletConfig();
            setWalletConfig(config);
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (selectedCrypto && detailsRef.current) {
            const timer = setTimeout(() => {
                detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedCrypto]);

    const handleWithdraw = async (txData: Omit<Transaction, 'id' | 'date' | 'status'>) => {
        const updatedData = await addTransaction(userData.id, txData);
        if (updatedData) {
            onUpdate();
        } else {
             showToast('Transaction failed: Insufficient funds.', 'error');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletConfig || !selectedCrypto) return;

        const numericAmount = parseFloat(amount);
        const wallet = walletConfig[selectedCrypto];
        if (!wallet) {
            showToast('Selected crypto wallet not found.', 'error');
            return;
        }

        if (isNaN(numericAmount) || numericAmount <= 0) {
            showToast('Please enter a valid amount.', 'error');
            return;
        }
        if (numericAmount > userData.balance) {
            showToast('Insufficient balance.', 'error');
            return;
        }
        if (numericAmount < 10) {
            showToast(`Minimum withdrawal is $10.00.`, 'error');
            return;
        }
        if (!address) {
            showToast('Please enter a withdrawal address.', 'error');
            return;
        }

        handleWithdraw({
            type: 'Withdrawal',
            amount: numericAmount,
            asset: selectedCrypto,
            usdValue: numericAmount,
        });
        showToast('Withdrawal request submitted.');
        setAmount('');
        setAddress('');
        setSelectedCrypto('');
    };
    
    if (!walletConfig || Object.keys(walletConfig).length === 0) {
        return <DashboardPageLayout title="Withdraw" icon={<ArrowUpFromLine size={28} />}><div className="flex items-center justify-center h-full pt-20"><div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div></DashboardPageLayout>;
    }

    return (
        <DashboardPageLayout title="Withdraw" icon={<ArrowUpFromLine size={28} />}>
            <InteractiveCard className="p-6">
                <p className="text-brand-text-secondary">Available for Withdrawal</p>
                <p className="text-4xl font-bold font-mono text-white tracking-wider">{formatCurrency(userData.balance)}</p>
            </InteractiveCard>

            <div className="space-y-4">
                 <h3 className="text-xl font-bold text-white">1. Select Asset</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ perspective: '1000px' }}>
                     {Object.keys(walletConfig).map((key, index) => {
                         const isSelected = selectedCrypto === key;
                         return (
                            <motion.div
                                key={key}
                                onClick={() => setSelectedCrypto(key)}
                                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 relative overflow-hidden ${isSelected ? 'border-brand-primary' : 'border-white/10 bg-brand-surface/30'}`}
                                whileHover={{ y: -10, rotateX: 5, scale: 1.05 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 * index }}
                            >
                                {isSelected && <motion.div layoutId="withdraw-glow" className="absolute inset-0 bg-brand-primary/20 -z-10 shadow-[0_0_20px_theme(colors.brand.primary)]"/>}
                                <div className="flex items-center gap-3">
                                    <img src={CRYPTO_LOGOS[key]} alt={key} className="w-10 h-10"/>
                                    <div>
                                        <p className="font-bold text-white text-lg">{walletConfig[key].name}</p>
                                        <p className="text-sm text-brand-text-secondary">{walletConfig[key].network}</p>
                                    </div>
                                </div>
                            </motion.div>
                         )
                     })}
                 </div>
            </div>

            <AnimatePresence>
            {selectedCrypto && walletConfig[selectedCrypto] && (
                <motion.div 
                    ref={detailsRef}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="space-y-4"
                >
                    <h3 className="text-xl font-bold text-white">2. Enter Details</h3>
                    <InteractiveCard className="p-6 shadow-[0_0_25px_rgba(0,245,255,0.15)] border-brand-primary/30">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-brand-text-secondary mb-2">Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-secondary">$</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        placeholder="0.00" 
                                        className="w-full pl-8 p-4 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white font-mono text-lg tracking-wider focus:outline-none transition-all duration-300 glow-input" 
                                    />
                                </div>
                                 <p className="text-xs text-brand-text-secondary mt-2">Minimum withdrawal: $10.00</p>
                            </div>
                             <div>
                                <label className="block text-brand-text-secondary mb-2">{walletConfig[selectedCrypto].name} Address ({walletConfig[selectedCrypto].network})</label>
                                <input 
                                    type="text" 
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)} 
                                    placeholder={`Enter your ${walletConfig[selectedCrypto].network} address`} 
                                    className="w-full p-4 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none transition-all duration-300 glow-input"
                                />
                            </div>
                            <motion.button 
                                type="submit" 
                                className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg text-lg shadow-lg shadow-brand-primary/30"
                                whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 20px rgba(0, 245, 255, 0.4)' }}
                                whileTap={{ scale: 0.98, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                Submit Withdrawal Request
                            </motion.button>
                        </form>
                    </InteractiveCard>
                </motion.div>
            )}
            </AnimatePresence>
        </DashboardPageLayout>
    );
};

export default WithdrawPage;