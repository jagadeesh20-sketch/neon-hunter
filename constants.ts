import { Quest, QuestType } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TILE_SIZE = 32;

// Mock Quests
export const QUESTS: Quest[] = [
  {
    id: 'q_rooftop_heist',
    title: 'The Rooftop Heist',
    description: 'A thief left a note about a gold stash. They used a 50m ramp to slide the gold down from a 50m height.',
    puzzlePrompt: 'According to the note: tan(θ) = 50m / 50m. What is the angle θ of the ramp?',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: '45°',
    rewards: { xp: 100, currency: 50 },
    location: { x: 200, y: 150 },
    type: QuestType.MATH,
  },
  {
    id: 'q_neon_sign',
    title: 'Broken Neon Sign',
    description: 'The "CyberBar" sign is flickering in a pattern: Short, Short, Long, Short.',
    puzzlePrompt: 'Decode the Morse code pattern (..-. ) to find the missing letter.',
    options: ['A', 'F', 'L', 'X'],
    correctAnswer: 'F',
    rewards: { xp: 75, currency: 30 },
    location: { x: 600, y: 450 },
    type: QuestType.PUZZLE,
  },
  {
    id: 'q_dock_delivery',
    title: 'Midnight Delivery',
    description: 'A crate at the docks has a keypad. The code is the square root of 144.',
    puzzlePrompt: 'Enter the 2-digit code.',
    correctAnswer: '12',
    rewards: { xp: 50, currency: 100 },
    location: { x: 100, y: 500 },
    type: QuestType.MATH,
  }
];
