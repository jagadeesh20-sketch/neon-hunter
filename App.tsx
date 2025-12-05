import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { HUD } from './components/HUD';
import { QuestDialog } from './components/QuestDialog';
import { gameEvents } from './services/eventBus';
import { PlayerState, Quest, Notification } from './types';
import { QUESTS, GAME_WIDTH, GAME_HEIGHT } from './constants';

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  // We use a ref for the game instance to avoid stale closure issues in cleanup
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  // State just to trigger re-renders if needed, though strictly not required for Phaser itself
  const [isGameReady, setIsGameReady] = useState(false);
  
  // App State
  const [playerState, setPlayerState] = useState<PlayerState>({
    username: 'u/RookieCop', // Simulated Devvit user
    xp: 0,
    currency: 0,
    completedQuestIds: [],
    activeQuestId: null
  });

  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize Phaser
  useEffect(() => {
    // Prevent double initialization
    if (gameInstanceRef.current || !gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false // Set true to see collision boxes
        }
      },
      scene: [GameScene],
      backgroundColor: '#1a1a1a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;
    setIsGameReady(true);

    // Cleanup function
    return () => {
      // Safe destroy: ensures we don't try to read properties from a half-destroyed instance
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        setIsGameReady(false);
      }
    };
  }, []);

  // Event Listeners
  useEffect(() => {
    const handleOpenQuest = (questId: string) => {
      const quest = QUESTS.find(q => q.id === questId);
      if (quest) {
        setActiveQuest(quest);
        setIsDialogOpen(true);
      }
    };

    gameEvents.on('openQuest', handleOpenQuest);

    // Simulate receiving a shared quest notification randomly after 10 seconds
    const mockShareTimer = setTimeout(() => {
      addNotification('u/ChiefDetectiv shared a case with you!', 'info');
    }, 10000);

    return () => {
      gameEvents.off('openQuest', handleOpenQuest);
      clearTimeout(mockShareTimer);
    };
  }, []);

  // Helper to add notifications
  const addNotification = (message: string, type: Notification['type']) => {
    const newNote: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [...prev, newNote]);
  };

  // Dialog Handlers
  const handleAcceptQuest = () => {
    if (activeQuest) {
      setPlayerState(prev => ({ ...prev, activeQuestId: activeQuest.id }));
      addNotification(`Case accepted: ${activeQuest.title}`, 'info');
    }
  };

  const handleCompleteQuest = (success: boolean) => {
    if (success && activeQuest) {
      const alreadyCompleted = playerState.completedQuestIds.includes(activeQuest.id);
      
      if (!alreadyCompleted) {
        setPlayerState(prev => ({
          ...prev,
          xp: prev.xp + activeQuest.rewards.xp,
          currency: prev.currency + activeQuest.rewards.currency,
          completedQuestIds: [...prev.completedQuestIds, activeQuest.id],
          activeQuestId: null
        }));
        addNotification(`Case Solved! +${activeQuest.rewards.xp} XP`, 'success');
      }
    }
  };

  const handleShareQuest = (targetUsername: string) => {
    // Simulate API call to Devvit Realtime
    console.log(`Sharing quest ${activeQuest?.id} with ${targetUsername}`);
    addNotification(`Case sent to u/${targetUsername}`, 'success');
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
      
      {/* Game Container */}
      <div ref={gameRef} className="rounded-lg shadow-2xl overflow-hidden border border-slate-800" />

      {/* Overlays */}
      <HUD playerState={playerState} notifications={notifications} />
      
      {activeQuest && (
        <QuestDialog 
          quest={activeQuest}
          isOpen={isDialogOpen}
          isCompleted={playerState.completedQuestIds.includes(activeQuest.id)}
          onClose={() => setIsDialogOpen(false)}
          onAccept={handleAcceptQuest}
          onComplete={handleCompleteQuest}
          onShare={handleShareQuest}
        />
      )}
    </div>
  );
};

export default App;