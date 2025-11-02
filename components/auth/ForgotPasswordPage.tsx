
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import { findUserByEmailOrName } from '../../services/userDataService';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (view: 'login' | 'homepage') => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    try {
      const user = await findUserByEmailOrName(email);
      if (user) {
        // Simulate sending a reset link
        setMessage('A password reset link has been sent to your email.');
      } else {
        setError('Email not registered.');
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
        setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative"
        style={{ transform: 'translateZ(50px)' }}
      >
        <button onClick={() => onNavigate('homepage')} className="absolute top-4 left-4 text-brand-text-secondary hover:text-white transition-colors">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-center text-white mb-2">Reset Password</h1>
        <p className="text-center text-brand-text-secondary mb-8">Enter your email to receive a reset link.</p>
        
        {message ? (
            <div className="text-center">
                <p className="text-green-400 mb-6">{message}</p>
                <button onClick={() => onNavigate('login')} className="w-full py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/40 transform hover:-translate-y-1 transition-all duration-300">
                    Back to Login
                </button>
            </div>
        ) : (
            <form onSubmit={handleReset} className="space-y-4">
            <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input"
            />
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <div className="w-6 h-6 border-2 border-brand-bg border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Reset Password'}
            </button>
            </form>
        )}
        
        <p className="text-center mt-6 text-brand-text-secondary">
          Remember your password?{' '}
          <button onClick={() => onNavigate('login')} className="font-bold text-brand-primary hover:underline">
            Login
          </button>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
