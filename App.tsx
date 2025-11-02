

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, PublicSystemSettings } from './types';
import { getPublicSystemSettings } from './services/userDataService';
import { DashboardView } from './components/Dashboard';

// Lazy load components for better initial load time
const HomePage = React.lazy(() => import('./components/HomePage'));
const LoginPage = React.lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./components/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./components/auth/ForgotPasswordPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const WelcomePage = React.lazy(() => import('./components/WelcomePage'));
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));
const AdminLoginModal = React.lazy(() => import('./components/admin/AdminLoginModal'));
const Chatbot = React.lazy(() => import('./components/chatbot/Chatbot'));
const TestimonialsPage = React.lazy(() => import('./components/TestimonialsPage'));

type View = 'homepage' | 'login' | 'register' | 'forgot' | 'dashboard' | 'welcome' | 'admin' | 'testimonials';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('homepage');
  const [isLoading, setIsLoading] = useState(true);
  const [initialDashboardView, setInitialDashboardView] = useState<DashboardView>('overview');
  const [settings, setSettings] = useState<PublicSystemSettings | null>(null);

  // Admin state
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const clickTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        const appSettings = await getPublicSystemSettings();
        setSettings(appSettings);
        try {
          const storedUser = localStorage.getItem('tradePilotUser');
          if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.hasSeenWelcome) {
                setView('dashboard');
            } else {
                setView('welcome');
            }
          }
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem('tradePilotUser');
        }
        setIsLoading(false);
    }
    loadInitialData();
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('tradePilotUser', JSON.stringify(loggedInUser));
    if (loggedInUser.hasSeenWelcome) {
        setView('dashboard');
    } else {
        setView('welcome');
    }
  }, []);

  const handleRegisterSuccess = useCallback((registeredUser: User) => {
    const { password, ...sessionUser } = registeredUser;
    
    setUser(sessionUser);
    localStorage.setItem('tradePilotUser', JSON.stringify(sessionUser));
    setView('welcome');
  }, []);
  
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('tradePilotUser');
    setView('homepage');
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setView('homepage');
  }, []);

  const handleWelcomeNavigation = useCallback((destination: DashboardView) => {
    if (user) {
      const updatedUser = { ...user, hasSeenWelcome: true };
      setUser(updatedUser);
      localStorage.setItem('tradePilotUser', JSON.stringify(updatedUser));
    }
    setInitialDashboardView(destination);
    setView('dashboard');
  }, [user]);

  const handleLogoClick = useCallback(() => {
    if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
    }

    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount >= 5) {
        setIsAdminLoginOpen(true);
        setLogoClickCount(0);
    } else {
        clickTimeout.current = setTimeout(() => {
            setLogoClickCount(0);
        }, 2000);
    }
  }, [logoClickCount]);

  const handleAdminLogin = (password: string): boolean => {
    // Simple hardcoded password for demo purposes
    if (password === 'joshbond') {
      setIsAdmin(true);
      setView('admin');
      setIsAdminLoginOpen(false);
      return true;
    }
    return false;
  };

  const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg">
      <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderView = () => {
    switch(view) {
      case 'homepage':
        return <HomePage key="homepage" onNavigate={setView} onLogoClick={handleLogoClick} />;
      case 'login':
        return <LoginPage key="login" onNavigate={setView} onLoginSuccess={handleLoginSuccess} settings={settings} />;
      case 'register':
        return <RegisterPage key="register" onNavigate={setView} onRegisterSuccess={handleRegisterSuccess} settings={settings} />;
      case 'forgot':
        return <ForgotPasswordPage key="forgot" onNavigate={setView} />;
      case 'dashboard':
        return user ? <Dashboard user={user} onLogout={handleLogout} initialView={initialDashboardView} /> : <LoginPage key="login-fallback" onNavigate={setView} onLoginSuccess={handleLoginSuccess} settings={settings} />;
      case 'welcome':
        return <WelcomePage onNavigate={handleWelcomeNavigation} />;
      case 'admin':
        return isAdmin ? <AdminPanel onLogout={handleAdminLogout} /> : <HomePage key="homepage-fallback" onNavigate={setView} onLogoClick={handleLogoClick} />;
      case 'testimonials':
        return <TestimonialsPage key="testimonials" onNavigate={setView} />;
      default:
        return <HomePage key="default" onNavigate={setView} onLogoClick={handleLogoClick} />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
        <React.Suspense fallback={<LoadingSpinner />}>
            <AnimatePresence mode="wait">
                {renderView()}
            </AnimatePresence>
            <AdminLoginModal 
              isOpen={isAdminLoginOpen} 
              onClose={() => setIsAdminLoginOpen(false)} 
              onLogin={handleAdminLogin}
            />
            {/* Render Chatbot globally but only when on dashboard */}
            {view === 'dashboard' && user && <Chatbot user={user} />}
        </React.Suspense>
    </div>
  );
};

export default App;