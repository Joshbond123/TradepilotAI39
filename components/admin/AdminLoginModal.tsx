
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!onLogin(password)) {
      setError('Invalid Admin Password');
      setTimeout(() => setError(''), 2000);
    } else {
        setPassword('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-brand-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm p-8 shadow-2xl relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white"><X/></button>
            <h2 className="text-2xl font-bold text-center mb-2 text-brand-primary">Admin Access</h2>
            <p className="text-center text-brand-text-secondary mb-6">Enter password to continue.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary focus:outline-none focus:border-brand-primary transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
              />
              
              <AnimatePresence>
              {error && 
                <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-sm text-center">{error}</motion.p>}
              </AnimatePresence>
              
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/40 transform hover:-translate-y-1 transition-all duration-300"
              >
                Login
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminLoginModal;
