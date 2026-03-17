import React, { useState } from 'react';
import { Hand, RotateCcw } from 'lucide-react';

type Choice = 'Rock' | 'Paper' | 'Scissors';
const CHOICES: Choice[] = ['Rock', 'Paper', 'Scissors'];
const EMOJIS = { Rock: '✊', Paper: '✋', Scissors: '✌️' };

const RockPaperScissors: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [compChoice, setCompChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<string>('Pick your weapon!');
  const [score, setScore] = useState({ player: 0, comp: 0 });

  const play = (choice: Choice) => {
    const computer = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    setPlayerChoice(choice);
    setCompChoice(computer);

    if (choice === computer) {
      setResult("It's a Tie!");
    } else if (
      (choice === 'Rock' && computer === 'Scissors') ||
      (choice === 'Paper' && computer === 'Rock') ||
      (choice === 'Scissors' && computer === 'Paper')
    ) {
      setResult('🎉 You Win!');
      setScore(s => ({ ...s, player: s.player + 1 }));
    } else {
      setResult('🤖 AI Wins!');
      setScore(s => ({ ...s, comp: s.comp + 1 }));
    }
  };

  const reset = () => {
    setPlayerChoice(null);
    setCompChoice(null);
    setResult('Pick your weapon!');
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center w-full max-w-sm mx-auto">
      <h3 className="font-display font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
        <Hand className="text-brand-orange" /> Roshambo
      </h3>
      
      <div className="flex justify-between items-center w-full px-4 mb-6">
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">You</p>
          <p className="text-4xl">{playerChoice ? EMOJIS[playerChoice] : '❓'}</p>
        </div>
        <div className="text-center font-black text-2xl text-gray-200">VS</div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">AI</p>
          <p className="text-4xl">{compChoice ? EMOJIS[compChoice] : '❓'}</p>
        </div>
      </div>

      <p className={`text-sm font-bold mb-6 ${result.includes('Win') ? 'text-green-500' : result.includes('AI') ? 'text-red-500' : 'text-gray-500'}`}>
        {result}
      </p>

      <div className="flex gap-2 mb-4 w-full">
        {CHOICES.map(c => (
          <button key={c} onClick={() => play(c)} className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-2xl transition active:scale-95">
            {EMOJIS[c]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between w-full mt-2 pt-4 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Score: {score.player} - {score.comp}
        </span>
        <button onClick={reset} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
export default RockPaperScissors;