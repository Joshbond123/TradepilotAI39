import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData, WalletConfig } from '../../types';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { ArrowDownToLine, Copy } from 'lucide-react';
import { getWalletConfig } from '../../services/userDataService';

const CRYPTO_LOGOS: { [key: string]: string } = {
    BTC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/btc.svg',
    ETH: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/eth.svg',
    USDT: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/usdt.svg'
};

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DepositPage: React.FC<{ userData: UserData; showToast: (msg: string, type?: 'success' | 'error') => void; onUpdate: () => void; }> = ({ userData, showToast }) => {
    const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState<string>('');
    const detailsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getWalletConfig();
            setWalletConfig(config);
            if (Object.keys(config).length > 0) {
                // Don't auto-select to let user choose
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (selectedCrypto && detailsRef.current) {
            const timer = setTimeout(() => {
                detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); // Short delay to allow element to render before scrolling
            return () => clearTimeout(timer);
        }
    }, [selectedCrypto]);


    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
        showToast('Address Copied!');
    };

    const deposits = useMemo(() => userData.transactions.filter(t => t.type === 'Deposit'), [userData.transactions]);

    if (!walletConfig) {
        return (
            <DashboardPageLayout title="Deposit" icon={<ArrowDownToLine size={28} />}>
                <div className="flex items-center justify-center h-full pt-20">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardPageLayout>
        );
    }

    const selectedWallet = walletConfig[selectedCrypto];

    return (
        <DashboardPageLayout title="Deposit" icon={<ArrowDownToLine size={28} />}>
            <InteractiveCard className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <div>
                    <p className="text-brand-text-secondary">Current Balance</p>
                    <p className="text-3xl font-bold font-mono text-white">{formatCurrency(userData.balance)}</p>
                </div>
            </InteractiveCard>

            <h3 className="text-xl font-bold text-white mt-4">Select Crypto to Deposit</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.keys(walletConfig).map(key => {
                    const crypto = walletConfig[key];
                    return (
                        <motion.div 
                            key={key} 
                            onClick={() => setSelectedCrypto(key)} 
                            whileHover={{ y: -8, scale: 1.03 }} 
                            className={`cursor-pointer bg-brand-surface/30 backdrop-blur-lg border-2 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden ${selectedCrypto === key ? 'border-brand-primary' : 'border-white/10'}`}
                        >
                             {selectedCrypto === key && (
                                <motion.div 
                                    layoutId="deposit-glow" 
                                    className="absolute inset-0 bg-brand-primary/20 -z-10 shadow-[0_0_20px_theme(colors.brand.primary)]"
                                    transition={{type: 'spring', stiffness: 300, damping: 25}}
                                />
                             )}
                            <div className="flex items-center gap-3 mb-3">
                                <img src={CRYPTO_LOGOS[key]} alt={key} className="w-10 h-10"/>
                                <span className="text-xl font-bold text-white">{crypto.name}</span>
                            </div>
                            <p className="text-sm text-brand-text-secondary">Network: {crypto.network}</p>
                        </motion.div>
                    )
                })}
            </div>

            <AnimatePresence>
            {selectedWallet && (
                <motion.div 
                    ref={detailsRef}
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 20 }} 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2"
                >
                   <InteractiveCard className="p-6 shadow-[0_0_25px_rgba(0,245,255,0.15)] border-brand-primary/30">
                        <h3 className="font-bold text-white text-lg mb-4">Deposit {selectedWallet.name}</h3>
                        <p className="text-brand-text-secondary text-sm mb-2">Only send {selectedWallet.name} ({selectedWallet.symbol}) to this address.</p>
                        <div className="flex items-center bg-brand-bg border border-white/20 rounded-lg p-2">
                            <input type="text" readOnly value={selectedWallet.address} className="w-full bg-transparent outline-none p-2 text-brand-text-secondary font-mono text-sm" />
                            <button onClick={() => handleCopy(selectedWallet.address)} className="p-2 text-white hover:text-brand-primary transition-colors"><Copy /></button>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-400/50 rounded-lg text-yellow-300 text-xs">
                            Any amount sent will be automatically converted to USD upon confirmation.
                        </div>
                   </InteractiveCard>
                   <InteractiveCard className="p-6 shadow-[0_0_25px_rgba(0,245,255,0.15)] border-brand-primary/30">
                       <h3 className="font-bold text-white text-lg mb-4">Important Instructions</h3>
                       <ul className="list-disc list-inside space-y-2 text-brand-text-secondary text-sm">
                           <li>Ensure you select the correct network ({selectedWallet.network}).</li>
                           <li>Do not send any other assets to this address.</li>
                           <li>Deposits are typically confirmed within 5-30 minutes.</li>
                       </ul>
                   </InteractiveCard>
                </motion.div>
            )}
            </AnimatePresence>

            {deposits.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">Deposit History</h3>
                    <InteractiveCard className="p-4 overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-3 text-brand-text-secondary">Date</th>
                                    <th className="p-3 text-brand-text-secondary">Asset</th>
                                    <th className="p-3 text-brand-text-secondary">Amount (USD)</th>
                                    <th className="p-3 text-brand-text-secondary">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.map(deposit => (
                                    <tr key={deposit.id} className="border-b border-white/10 last:border-b-0">
                                        <td className="p-3 text-brand-text">{new Date(deposit.date).toLocaleString()}</td>
                                        <td className="p-3 text-brand-text">{deposit.asset}</td>
                                        <td className="p-3 text-white font-mono">{formatCurrency(deposit.usdValue || deposit.amount)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                deposit.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' :
                                                deposit.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {deposit.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </InteractiveCard>
                </div>
            )}
        </DashboardPageLayout>
    );
};

export default DepositPage;