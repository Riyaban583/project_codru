import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if it's already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return; // Hide if already installed!

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      // Optional: Add a small delay so it doesn't instantly bombard the user
      setTimeout(() => setShowPrompt(true), 3000); 
    }

    // 3. Detect Android/Chrome "Installable" state
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Stop Chrome's default mini-infobar
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const closePrompt = () => {
    setShowPrompt(false);
    // Optional: Save to localStorage here to not show it again for X days
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-md animate-in slide-in-from-bottom-full duration-500">
      <div className="bg-brand-blue text-white rounded-t-2xl md:rounded-2xl p-4 shadow-2xl border-t md:border border-white/10 flex items-center justify-between gap-4">
        
        {/* Left Side: Icon & Text */}
        <div className="flex items-center gap-3">
          <img src="/logo192.png" alt="CuTe Logo" className="w-12 h-12 rounded-xl shadow-md bg-white p-1" />
          <div>
            <h4 className="font-bold text-sm tracking-wide">CuTe Learning App</h4>
            
            {/* Conditional Subtitle based on device */}
            {isIOS ? (
              <p className="text-xs text-blue-200 mt-0.5 leading-relaxed">
                Tap <Share className="inline w-3 h-3 mx-1" /> then <br/>
                <span className="font-semibold text-white">Add to Home Screen</span>
              </p>
            ) : (
              <p className="text-xs text-blue-200 mt-0.5">Install for a faster experience.</p>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="bg-brand-orange text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:bg-orange-600 transition transform hover:scale-105"
            >
              Install
            </button>
          )}
          <button onClick={closePrompt} className="text-white/50 hover:text-white p-2 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}