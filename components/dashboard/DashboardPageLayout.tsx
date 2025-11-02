
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface DashboardPageLayoutProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-200, 200], [5, -5]);
    const rotateY = useTransform(x, [-200, 200], [-5, 5]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if(!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };
    
    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    }
    
    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`bg-brand-surface/20 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl shadow-black/30 ${className}`}
        >
            <div style={{ transform: 'translateZ(20px)' }}>
                {children}
            </div>
        </motion.div>
    )
};


const DashboardPageLayout: React.FC<DashboardPageLayoutProps> = ({ title, icon, children }) => {
  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -20, scale: 0.98 },
  };

  return (
    <motion.div
      key={title}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex flex-col gap-8 mt-12 lg:mt-0"
    >
      <div className="flex items-center gap-4">
        <motion.div 
            className="p-3 bg-brand-primary/10 text-brand-primary rounded-full shadow-[0_0_20px_theme(colors.brand.primary)]"
            animate={{ scale: [1, 1.1, 1], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-wider">{title}</h1>
      </div>
      {children}
    </motion.div>
  );
};

export default DashboardPageLayout;
export { Card as InteractiveCard };
