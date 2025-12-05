export interface Position {
  x: number;
  y: number;
}

export enum QuestType {
  PUZZLE = 'PUZZLE',
  FETCH = 'FETCH',
  MATH = 'MATH',
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  puzzlePrompt: string;
  options?: string[]; // For multiple choice
  correctAnswer: string; // Plain text answer
  rewards: {
    xp: number;
    currency: number;
  };
  location: Position;
  type: QuestType;
}

export interface PlayerState {
  xp: number;
  currency: number;
  completedQuestIds: string[];
  activeQuestId: string | null;
  username: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}
