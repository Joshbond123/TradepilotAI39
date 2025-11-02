
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import { findUserByEmailOrName, logLogin } from '../../services/userDataService';
import { User, PublicSystemSettings } from '../../types';
import { ArrowLeft } from 'lucide-react';
import ReCaptcha from './ReCaptcha';

interface LoginPageProps {
  onNavigate: (view: 'register' | 'forgot' | 'homepage') => void;
  onLoginSuccess: (user: User) => void;
  settings: PublicSystemSettings | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess, settings }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier || !password) {
      setError('Please enter your email/username and password.');
      setIsLoading(false);
      return;
    }

    if (settings?.recaptchaEnabled && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      setIsLoading(false);
      return;
    }

    try {
      const user = await findUserByEmailOrName(identifier);
      if (user && user.password === password) {
        await logLogin(user.id);
        setTimeout(() => {
          // Exclude password from the user object that gets stored in the session
          const { password: _, ...userToLog } = user;
          onLoginSuccess(userToLog);
        }, 1000); // Simulate network latency
      } else {
        setTimeout(() => {
          setError('Incorrect email/username or password. Please try again.');
          setIsLoading(false);
        }, 1000);
      }
    } catch (e) {
      setTimeout(() => {
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }, 1000);
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
        <h1 className="text-3xl font-bold text-center text-brand-primary mb-2">TradePilot AI</h1>
        <p className="text-center text-brand-text-secondary mb-8">Welcome back to the future of trading.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-brand-bg/50 border-2 border-white/10 rounded-lg text-white placeholder-brand-text-secondary transition-all duration-300 glow-input"
          />
          
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-brand-text-secondary">
              <input type="checkbox" className="mr-2 bg-brand-bg border-white/20" defaultChecked/>
              Remember Me
            </label>
            <button type="button" onClick={() => onNavigate('forgot')} className="text-brand-primary hover:underline">
              Forgot Password?
            </button>
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          {settings?.recaptchaEnabled && settings.recaptchaSiteKey && (
            <ReCaptcha
              siteKey={settings.recaptchaSiteKey}
              onVerify={setRecaptchaToken}
              onExpired={() => setRecaptchaToken('')}
            />
          )}
          
          <button
            type="submit"
            disabled={isLoading || (settings?.recaptchaEnabled && !recaptchaToken)}
            className="w-full py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-bg font-bold rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <div className="w-6 h-6 border-2 border-brand-bg border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Login'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-brand-text-secondary">
          Don’t have an account?{' '}
          <button onClick={() => onNavigate('register')} className="font-bold text-brand-primary hover:underline">
            Register now
          </button>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;