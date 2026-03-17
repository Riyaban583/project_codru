import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Ghost, WifiOff } from 'lucide-react';

import TicTacToe from './games/TicTacToe';
import MemoryMatch from './games/MemoryMatch';
import RockPaperScissors from './games/RockPaperScissors';

// 🚨 NEW: Accept a mode prop to change the text dynamically
interface NotFoundProps {
  mode?: '404' | 'offline';
}

const NotFound: React.FC<NotFoundProps> = ({ mode = '404' }) => {
  const navigate = useNavigate();
  const games = [TicTacToe, MemoryMatch, RockPaperScissors];
  const [selectedGames, setSelectedGames] = useState<React.FC[]>([]);

  useEffect(() => {
    const shuffled = [...games].sort(() => 0.5 - Math.random());
    setSelectedGames(shuffled.slice(0, 2));
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col items-center mb-10">
        {/* 🚨 Swap icon and text based on the mode */}
        {mode === 'offline' ? (
          <>
            <WifiOff size={56} className="text-brand-orange mb-4 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-display font-black text-brand-orange mb-3">No Internet!</h1>
            <p className="text-gray-500 max-w-md font-medium">
              Your connection dropped. While we wait for the Wi-Fi to come back, play a quick game!
            </p>
          </>
        ) : (
          <>
            <Ghost size={56} className="text-gray-300 mb-4 animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-display font-black text-brand-blue mb-3">404 - Off the Map!</h1>
            <p className="text-gray-500 max-w-md font-medium">
              The page you are looking for doesn't exist. But hey, take a break! Pick your poison below.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        {selectedGames.map((GameComponent, index) => (
          <GameComponent key={index} />
        ))}
      </div>

      {mode === '404' && (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-8 py-4 bg-brand-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition active:scale-95 shadow-lg shadow-orange-500/20 text-lg"
        >
          <Home size={20} /> Take Me Home
        </button>
      )}
    </div>
  );
};

export default NotFound;