import React, { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
    recaptchaOnLoad?: () => void;
  }
}

interface ReCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpired?: () => void;
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({ siteKey, onVerify, onExpired }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const renderRecaptcha = useCallback(() => {
    if (!containerRef.current || !window.grecaptcha || !window.grecaptcha.render) {
      console.log('ReCAPTCHA: Waiting for grecaptcha to load...');
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      console.log('ReCAPTCHA: Rendering widget with siteKey:', siteKey?.substring(0, 10) + '...');
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          console.log('ReCAPTCHA: Verification successful');
          onVerify(token);
        },
        'expired-callback': () => {
          console.log('ReCAPTCHA: Token expired');
          if (onExpired) onExpired();
        },
        theme: 'dark',
      });
      setIsLoading(false);
      setError(null);
      console.log('ReCAPTCHA: Widget rendered successfully, ID:', widgetIdRef.current);
    } catch (error) {
      console.error('ReCAPTCHA: Render error:', error);
      setError('Failed to load reCAPTCHA. Please refresh the page.');
      setIsLoading(false);
    }
  }, [siteKey, onVerify, onExpired]);

  useEffect(() => {
    if (!siteKey) {
      console.log('ReCAPTCHA: No site key provided');
      setError('reCAPTCHA site key is missing');
      setIsLoading(false);
      return;
    }

    console.log('ReCAPTCHA: Initializing with site key:', siteKey?.substring(0, 10) + '...');
    
    if (!window.grecaptcha) {
      console.log('ReCAPTCHA: Loading script...');
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=recaptchaOnLoad&render=explicit';
      script.async = true;
      script.defer = true;
      
      window.recaptchaOnLoad = () => {
        console.log('ReCAPTCHA: Script loaded, rendering widget...');
        setTimeout(() => renderRecaptcha(), 100);
      };
      
      script.onerror = () => {
        console.error('ReCAPTCHA: Failed to load script');
        setError('Failed to load reCAPTCHA script');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    } else if (window.grecaptcha?.render) {
      console.log('ReCAPTCHA: Script already loaded, rendering widget...');
      setTimeout(() => renderRecaptcha(), 100);
    } else {
      console.log('ReCAPTCHA: grecaptcha exists but render not ready, waiting...');
      const checkInterval = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(checkInterval);
          renderRecaptcha();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.grecaptcha?.render) {
          setError('reCAPTCHA failed to initialize');
          setIsLoading(false);
        }
      }, 10000);
    }

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          console.log('ReCAPTCHA: Widget reset on unmount');
        } catch (e) {
          console.log('ReCAPTCHA: Cleanup error (safe to ignore)');
        }
      }
    };
  }, [siteKey, renderRecaptcha]);

  return (
    <div className="flex flex-col items-center justify-center my-4 min-h-[78px]">
      {isLoading && !error && (
        <div className="text-brand-text-secondary text-sm">
          Loading reCAPTCHA...
        </div>
      )}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 px-4 py-2 rounded">
          {error}
        </div>
      )}
      <div ref={containerRef} className={error ? 'hidden' : ''}></div>
    </div>
  );
};

export default ReCaptcha;
