import React, { useState, useEffect } from 'react';
import { Quest } from '../types';

interface QuestDialogProps {
  quest: Quest;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onComplete: (success: boolean) => void;
  onShare: (username: string) => void;
  isCompleted: boolean;
}

export const QuestDialog: React.FC<QuestDialogProps> = ({
  quest,
  isOpen,
  onClose,
  onAccept,
  onComplete,
  onShare,
  isCompleted
}) => {
  const [step, setStep] = useState<'intro' | 'puzzle' | 'result' | 'share'>('intro');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [shareUsername, setShareUsername] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  // Reset state when quest changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(isCompleted ? 'result' : 'intro');
      setResultMessage(isCompleted ? 'You have already solved this case.' : '');
    }
  }, [isOpen, isCompleted, quest]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const answer = quest.options ? selectedOption : textAnswer;
    const isCorrect = answer?.toLowerCase() === quest.correctAnswer.toLowerCase();

    if (isCorrect) {
      setResultMessage('Correct! You cracked the case.');
      onComplete(true);
      setStep('result');
    } else {
      setResultMessage('Incorrect. Try again, detective.');
      setStep('result');
    }
  };

  const handleShare = () => {
    if (shareUsername.trim()) {
      onShare(shareUsername);
      setShareUsername('');
      // In a real app we'd wait for success, here we just close or show feedback
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-lg shadow-2xl shadow-cyan-500/20 text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">
            {quest.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-2xl">🕵️</div>
                <p className="text-slate-300 leading-relaxed text-sm">{quest.description}</p>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Rewards</p>
                <div className="flex gap-4 text-sm font-mono">
                  <span className="text-yellow-400">XP: +{quest.rewards.xp}</span>
                  <span className="text-green-400">CREDITS: {quest.rewards.currency}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { onAccept(); setStep('puzzle'); }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Accept Case
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {step === 'puzzle' && (
            <div className="space-y-4">
               <p className="text-cyan-100 font-medium italic border-l-2 border-cyan-500 pl-3">
                "{quest.puzzlePrompt}"
               </p>

               {quest.options ? (
                 <div className="grid grid-cols-2 gap-2 mt-4">
                   {quest.options.map(opt => (
                     <button
                        key={opt}
                        onClick={() => setSelectedOption(opt)}
                        className={`p-3 rounded border ${selectedOption === opt ? 'bg-cyan-900/50 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               ) : (
                 <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Enter solution..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500 focus:outline-none"
                 />
               )}

               <button
                  onClick={handleSubmit}
                  disabled={!selectedOption && !textAnswer}
                  className="w-full mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2 rounded"
               >
                 Submit Evidence
               </button>
            </div>
          )}

          {step === 'result' && (
            <div className="text-center space-y-4">
              <div className={`text-4xl mb-2 ${resultMessage.includes('Correct') ? 'text-green-500' : 'text-red-500'}`}>
                {resultMessage.includes('Correct') ? '✅' : '❌'}
              </div>
              <h3 className="text-lg font-bold text-white">{resultMessage}</h3>
              
              <div className="flex flex-col gap-2 mt-4">
                {resultMessage.includes('Correct') || isCompleted ? (
                   <button 
                     onClick={() => setStep('share')}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-semibold"
                   >
                     Share with Partner
                   </button>
                ) : (
                  <button 
                    onClick={() => setStep('puzzle')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded"
                  >
                    Try Again
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-full text-slate-400 hover:text-white text-sm py-2"
                >
                  Close Case File
                </button>
              </div>
            </div>
          )}

          {step === 'share' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">Need backup? Share this case with another detective.</p>
              <input
                type="text"
                value={shareUsername}
                onChange={(e) => setShareUsername(e.target.value)}
                placeholder="Reddit Username (e.g. spez)"
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                 onClick={handleShare}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold"
              >
                Send Case File
              </button>
              <button onClick={() => setStep('result')} className="text-slate-400 text-sm w-full text-center mt-2">Back</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
