
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import { User, PublicSystemSettings } from '../../types';
import { ArrowLeft } from 'lucide-react';
import { findUserByEmailOrName, createInitialUserData } from '../../services/userDataService';
import ReCaptcha from './ReCaptcha';

interface RegisterPageProps {
  onNavigate: (view: 'login' | 'homepage') => void;
  onRegisterSuccess: (user: User) => void;
  settings: PublicSystemSettings | null;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegisterSuccess, settings }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields (except referral) are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    if (settings?.recaptchaEnabled && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    setIsLoading(true);

    try {
      const existingUser = await findUserByEmailOrName(email);
      if (existingUser) {
          setError('An account with this email already exists.');
          setIsLoading(false);
          return;
      }

      const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          plan: 'Starter AI',
          balance: 0,
          totalProfit: 0,
          hasSeenWelcome: false,
          isVerified: true,
      };

      await createInitialUserData(newUser);
      onRegisterSuccess(newUser);
      setIsLoading(false);
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Registration failed. Please try again.');
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold text-center text-white mb-2">Create Your Account</h1>
        <p className="text-center text-brand-text-secondary mb-8">Join the financial revolution.</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Username" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
          <input type="text" placeholder="Referral Code (Optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input" />
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          {settings?.recaptchaEnabled && settings.recaptchaSiteKey && (
            <ReCaptcha
              siteKey={settings.recaptchaSiteKey}
              onVerify={setRecaptchaToken}
              onExpired={() => setRecaptchaToken('')}
            />
          )}
          
          <button type="submit" disabled={isLoading || (settings?.recaptchaEnabled && !recaptchaToken)} className="w-full py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <div className="w-6 h-6 border-2 border-brand-bg border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Register'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-brand-text-secondary">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="font-bold text-brand-primary hover:underline">
            Login
          </button>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;