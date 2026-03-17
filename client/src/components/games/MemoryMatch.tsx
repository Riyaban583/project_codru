import React, { useState, useEffect } from 'react';
import { RotateCcw, Brain } from 'lucide-react';

const EMOJIS = ['🚀', '🧠', '💻', '🍕', '🎸', '🎮'];
const generateDeck = () => [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);

const MemoryMatch: React.FC = () => {
  const [cards, setCards] = useState<string[]>(generateDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  const handleFlip = (index: number) => {
    if (flipped.length >= 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched(prev => [...prev, newFlipped[0], newFlipped[1]]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const resetGame = () => {
    setCards(generateDeck());
    setFlipped([]);
    setMatched([]);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center w-full max-w-sm mx-auto">
      <h3 className="font-display font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
        <Brain className="text-purple-500" /> Memory Match
      </h3>
      <div className="grid grid-cols-4 gap-2 mb-4 w-full">
        {cards.map((emoji, idx) => {
          const isVisible = flipped.includes(idx) || matched.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleFlip(idx)}
              className={`h-14 flex items-center justify-center text-2xl rounded-xl transition-all duration-300 ${
                isVisible ? 'bg-purple-50 rotate-y-180' : 'bg-brand-blue text-transparent hover:bg-blue-600'
              } ${matched.includes(idx) ? 'opacity-50 grayscale' : ''}`}
            >
              {isVisible ? emoji : '?'}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between w-full mt-2">
        <span className="text-sm font-bold text-gray-500">
          {matched.length === cards.length ? '🎉 You got them all!' : `Pairs found: ${matched.length / 2}/6`}
        </span>
        <button onClick={resetGame} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
export default MemoryMatch;