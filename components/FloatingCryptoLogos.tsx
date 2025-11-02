import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CryptoLogo {
  id: string;
  name: string;
  logo: string;
}

const cryptoLogos: CryptoLogo[] = [
  { id: 'bitcoin', name: 'Bitcoin', logo: '/crypto-logos/bitcoin.png' },
  { id: 'ethereum', name: 'Ethereum', logo: '/crypto-logos/ethereum.png' },
  { id: 'binancecoin', name: 'BNB', logo: '/crypto-logos/binancecoin.png' },
  { id: 'ripple', name: 'XRP', logo: '/crypto-logos/ripple.png' },
  { id: 'cardano', name: 'Cardano', logo: '/crypto-logos/cardano.png' },
];

interface FloatingLogoProps {
  crypto: CryptoLogo;
  index: number;
}

const FloatingLogo: React.FC<FloatingLogoProps> = ({ crypto, index }) => {
  // Pre-calculate random values to avoid using Math.random() in render
  const animationConfig = useMemo(() => {
    const seed = index * 123.456; // Use index as seed for consistent randomness
    
    // Generate pseudo-random values based on index
    const x = (Math.sin(seed) * 50 + 50) % 100; // 0-100
    const y = (Math.cos(seed) * 50 + 50) % 100; // 0-100
    const duration = 15 + (Math.sin(seed * 2) + 1) * 10; // 15-35 seconds
    const delay = (Math.cos(seed * 3) + 1) * 3; // 0-6 seconds
    const scale = 0.5 + (Math.sin(seed * 4) + 1) * 0.3; // 0.5-1.1
    const opacity = 0.15 + (Math.cos(seed * 5) + 1) * 0.15; // 0.15-0.45
    
    return { x, y, duration, delay, scale, opacity };
  }, [index]);

  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{
        x: `${animationConfig.x}vw`,
        y: `${animationConfig.y}vh`,
        scale: animationConfig.scale,
        opacity: 0,
      }}
      animate={{
        x: [
          `${animationConfig.x}vw`,
          `${(animationConfig.x + 30) % 100}vw`,
          `${(animationConfig.x - 20) % 100}vw`,
          `${animationConfig.x}vw`,
        ],
        y: [
          `${animationConfig.y}vh`,
          `${(animationConfig.y - 25) % 100}vh`,
          `${(animationConfig.y + 15) % 100}vh`,
          `${animationConfig.y}vh`,
        ],
        opacity: [0, animationConfig.opacity, animationConfig.opacity, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration: animationConfig.duration,
        delay: animationConfig.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <img
        src={crypto.logo}
        alt={crypto.name}
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain filter blur-[1px]"
        loading="lazy"
      />
    </motion.div>
  );
};

const FloatingCryptoLogos: React.FC = () => {
  // Create multiple instances of each logo for better coverage
  const logoInstances = useMemo(() => {
    const instances: Array<{ crypto: CryptoLogo; instanceId: number }> = [];
    
    // Create 3 instances of each logo
    cryptoLogos.forEach((crypto, cryptoIndex) => {
      for (let i = 0; i < 3; i++) {
        instances.push({
          crypto,
          instanceId: cryptoIndex * 3 + i,
        });
      }
    });
    
    return instances;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {logoInstances.map(({ crypto, instanceId }) => (
        <FloatingLogo
          key={`${crypto.id}-${instanceId}`}
          crypto={crypto}
          index={instanceId}
        />
      ))}
    </div>
  );
};

export default FloatingCryptoLogos;
