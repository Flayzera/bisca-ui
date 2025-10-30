export interface Player {
  id: string;
  nickname: string;
  hand: string[];
  score: number;
  capturedCards: string[];
  chips?: number;
}

export interface TablePlay {
  playerId: string;
  nickname: string;
  card: string;
}

export interface GameState {
  players: Player[];
  table: TablePlay[];
  turn: number;
  trumpCard: string;
  deck: string[];
  roundNumber: number;
  isGameStarted: boolean;
  lastTrickWinnerId?: string;
  lastTrickCards?: TablePlay[];
}
