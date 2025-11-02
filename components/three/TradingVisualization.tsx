import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- CoinGecko API Logic & Types ---
// Using multiple keys to rotate and avoid rate limits on the free tier.
const API_KEYS = [
  'CG-V1Z1MdM5Bfk4C9P6VW5oYJUw',
  'CG-Gz4wxBKfDbN7bHXZfm8rG9nX',
  'CG-dZtR2c6qrHUdrxv2cpcBjpFT',
  'CG-YijXd9KPMsv9RiVRFF8iJpNG',
  'CG-ctftx4eQqLpwDUuPLXdu7khV',
];
let keyIndex = 0;

const getApiKey = () => {
  const key = API_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  return key;
};

interface Ticker {
  market: { name: string; logo: string; };
  converted_last: { usd: number; };
  trust_score: string;
}

interface ArbitrageOpportunity {
  id: string;
  coinName: string;
  coinSymbol: string;
  coinLogo: string;
  buyExchange: { name: string; logo: string; price: number };
  sellExchange: { name: string; logo: string; price: number };
  profit: number;
}

const COINS_TO_TRACK = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/btc.svg' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/eth.svg' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/sol.svg' },
];

const AnimatedHeader = () => (
    <div className="relative text-center text-sm text-brand-text-secondary mb-4 overflow-hidden py-1 w-full max-w-lg mx-auto">
        <span className="relative z-10 font-mono">🔍 Scanning crypto exchanges for live arbitrage opportunities...</span>
        <motion.div
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
    </div>
);

const formatPrice = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: value > 1 ? 3 : 6 })}`;
const formatProfit = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;

const Particles = React.memo(() => {
    const points = useRef<THREE.Points>(null!);
    const count = 150;
    const radius = 6;

    const particles = React.useMemo(() => {
        const temp = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            temp[i3] = (Math.random() - 0.5) * radius * 2;
            temp[i3 + 1] = (Math.random() - 0.5) * radius * 2;
            temp[i3 + 2] = (Math.random() - 0.5) * radius * 2;
        }
        return temp;
    }, [count, radius]);

    useFrame((state) => {
        if(points.current) {
            points.current.rotation.y += 0.0003;
            points.current.rotation.x += 0.0001;
            points.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="position" count={particles.length / 3} array={particles} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.04} color="#00f5ff" transparent sizeAttenuation opacity={0.7} />
        </points>
    );
});

const TradingVisualization = () => {
    const [opportunity, setOpportunity] = useState<ArbitrageOpportunity | null>(null);
    const coinIndexRef = useRef(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentCoin, setCurrentCoin] = useState(COINS_TO_TRACK[0]);
    const recentOppIds = useRef<string[]>([]);

    const fetchArbitrageData = useCallback(async () => {
        setIsLoading(true);
        const coin = COINS_TO_TRACK[coinIndexRef.current];
        setCurrentCoin(coin);
        coinIndexRef.current = (coinIndexRef.current + 1) % COINS_TO_TRACK.length;

        try {
            const apiKey = getApiKey();
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/tickers?x_cg_demo_api_key=${apiKey}&include_exchange_logo=true&depth=false&order=volume_desc`);
            if (!response.ok) throw new Error(`API Error for ${coin.id}: ${response.statusText}`);

            const data = await response.json();
            const validTickers = data.tickers
                .filter((t: Ticker) => t.trust_score === 'green' && t.converted_last.usd > 0)
                .sort((a: Ticker, b: Ticker) => a.converted_last.usd - b.converted_last.usd);

            let newOpportunity: ArbitrageOpportunity | null = null;

            if (validTickers.length >= 2) {
                const potentialBuys = validTickers.slice(0, 5); // Take top 5 cheapest
                const potentialSells = validTickers.slice(-5).reverse(); // Take top 5 most expensive

                for (const buy of potentialBuys) {
                    for (const sell of potentialSells) {
                        if (buy.market.name !== sell.market.name) {
                            const profit = sell.converted_last.usd - buy.converted_last.usd;
                            const oppId = `${coin.id}-${buy.market.name}-${sell.market.name}`;
                            
                            // Check for profit and if it's a new opportunity (not in recent history)
                            if (profit > 0.01 && !recentOppIds.current.includes(oppId)) {
                                newOpportunity = {
                                    id: oppId,
                                    coinName: coin.name, coinSymbol: coin.symbol, coinLogo: coin.logo,
                                    buyExchange: { name: buy.market.name, logo: buy.market.logo, price: buy.converted_last.usd },
                                    sellExchange: { name: sell.market.name, logo: sell.market.logo, price: sell.converted_last.usd },
                                    profit: profit,
                                };
                                break;
                            }
                        }
                    }
                    if (newOpportunity) break;
                }
            }

            if (newOpportunity) {
                recentOppIds.current.unshift(newOpportunity.id);
                if (recentOppIds.current.length > 5) {
                    recentOppIds.current.pop();
                }
                setOpportunity(newOpportunity);
            } else {
                // Keep the last opportunity if no new one is found, to avoid flickering
                // setOpportunity(null);
            }
        } catch (error) {
            console.error("Error fetching arbitrage data:", error);
            // setOpportunity(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArbitrageData();
        const interval = setInterval(fetchArbitrageData, 8000);
        return () => clearInterval(interval);
    }, [fetchArbitrageData]);

    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-200, 200], [15, -15], { clamp: true });
    const rotateY = useTransform(x, [-200, 200], [-15, 15], { clamp: true });
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => { x.set(0); y.set(0); };

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-full flex flex-col p-4 text-white overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a1a]/80 to-[#1a1a2e]/90"
            style={{ perspective: '1000px' }}
        >
            <div className="absolute inset-0 -z-10 opacity-60">
                 <Canvas><Particles /></Canvas>
            </div>
            <AnimatedHeader />
            <motion.div style={{ transformStyle: 'preserve-3d', rotateX, rotateY }} className="flex-grow flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {isLoading && !opportunity ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-xs text-brand-text-secondary font-mono">Scanning {currentCoin.name}...</p>
                        </motion.div>
                    ) : opportunity ? (
                        <motion.div
                            key={opportunity.id}
                            className="relative w-full max-w-xl h-48"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                           <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-2xl border border-cyan-300/20 shadow-2xl shadow-black/50 p-4 flex flex-col justify-between group" style={{ transform: 'translateZ(40px)' }}>
                                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/50 via-violet-600/50 to-purple-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <motion.img whileHover={{ rotate: 360 }} transition={{ duration: 2, ease: "linear", repeat: Infinity }} src={opportunity.coinLogo} alt={opportunity.coinName} className="w-10 h-10" />
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{opportunity.coinName}</h3>
                                            <p className="text-xs text-brand-text-secondary">{opportunity.coinSymbol}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-400 uppercase tracking-wider">Profit</p>
                                        <div 
                                            className="text-4xl font-bold font-mono text-green-400"
                                            style={{ textShadow: '0 0 10px #22c55e' }}
                                        >
                                            {formatProfit(opportunity.profit)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-end text-center">
                                    {/* BUY SIDE */}
                                    <div className="w-2/5 flex flex-col items-center">
                                        <span className="text-xs text-brand-text-secondary uppercase tracking-wider">Buy At</span>
                                        <div className="flex items-center justify-center gap-1.5 mt-1 font-semibold text-sm">
                                            <img src={opportunity.buyExchange.logo} className="w-5 h-5 rounded-full bg-white/10" alt="" />
                                            <span className="truncate max-w-[100px]">{opportunity.buyExchange.name}</span>
                                        </div>
                                        <p className="font-mono text-lg">{formatPrice(opportunity.buyExchange.price)}</p>
                                    </div>

                                    {/* CONNECTOR */}
                                    <div className="w-1/5 flex items-center justify-center -mb-2">
                                       <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent relative">
                                            <motion.div 
                                                className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]"
                                                animate={{ x: '1000%' }}
                                                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* SELL SIDE */}
                                    <div className="w-2/5 flex flex-col items-center">
                                        <span className="text-xs text-brand-text-secondary uppercase tracking-wider">Sell At</span>
                                         <div className="flex items-center justify-center gap-1.5 mt-1 font-semibold text-sm">
                                            <img src={opportunity.sellExchange.logo} className="w-5 h-5 rounded-full bg-white/10" alt="" />
                                             <span className="truncate max-w-[100px]">{opportunity.sellExchange.name}</span>
                                        </div>
                                        <p className="font-mono text-lg">{formatPrice(opportunity.sellExchange.price)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="no-opp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-brand-text-secondary">
                            <p className="font-mono">No significant arbitrage opportunity for {currentCoin.symbol}.</p>
                            <p className="text-xs">Scanning next asset...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TradingVisualization;