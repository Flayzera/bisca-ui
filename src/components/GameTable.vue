<template>
  <div class="game-table">
    <div v-if="isMyTurn && gameState.isGameStarted" class="your-turn-alert">
      <h2>🎯 SUA VEZ DE JOGAR!</h2>
    </div>
    <div v-if="trickBanner" class="trick-banner">
      <strong>{{ trickBanner }}</strong>
    </div>

    <div class="game-layout">
      <div class="left-panel">
        <div class="game-info">
          <div class="info-item">
            <span class="label">Rodada:</span>
            <span class="value">{{ gameState.roundNumber }}</span>
          </div>
          <div v-if="gameState.trumpCard" class="info-item">
            <span class="label">Trunfo:</span>
            <span class="trump-value" :class="getSuitColorClass(gameState.trumpCard)">
              {{ getCardDisplay(gameState.trumpCard) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Turno:</span>
            <span class="value" :class="{ 'turn-highlight': isMyTurn }">
              {{ getCurrentPlayerName() }}
            </span>
          </div>
        </div>

        <div class="score-board-compact">
          <h4>Placar</h4>
          <div class="players-list">
            <div 
              v-for="player in gameState.players" 
              :key="player.id" 
              class="player-item"
              :class="{ 
                'player-self': player.id === socketId,
                'player-turn': getPlayerTurnIndex(player.id) === gameState.turn && gameState.isGameStarted
              }"
            >
              <span class="player-name-compact">{{ player.nickname }}</span>
              <span class="player-score-compact">{{ player.score }} pts</span>
              <span class="player-score-compact" v-if="player.chips !== undefined">💠 {{ player.chips }}</span>
              <span v-if="gameState.isGameStarted" class="player-cards-compact">
                {{ player.hand.length }} na mão
              </span>
              <span v-if="player.capturedCards && player.capturedCards.length > 0" class="player-captured">
                🏆 {{ player.capturedCards.length }} capturas
              </span>
            </div>
          </div>
        </div>

        
      </div>

      <div class="right-panel">
        <div class="table-compact">
          <h4>🎯 MESA</h4>
          <div v-if="gameState.table.length > 0" class="table-cards-compact">
            <div 
              v-for="(play, i) in gameState.table" 
              :key="i" 
              class="table-card-compact"
              :class="{ 'table-card-self': play.playerId === socketId }"
            >
              <span class="card-player-compact">{{ play.nickname }}</span>
              <span class="card-symbol-compact" :class="getSuitColorClass(play.card)">
                {{ getCardDisplay(play.card) }}
              </span>
            </div>
          </div>
          <div v-else class="empty-table-compact">
            <p>🃏 Vazio</p>
          </div>
        </div>
        <div v-if="myPlayer && gameState.isGameStarted" class="my-hand-compact">
          <div class="hand-header-compact">
            <h3>Minhas Cartas</h3>
            <span class="card-count-badge">{{ myPlayer.hand.length }}</span>
          </div>
          
          <div v-if="!isMyTurn" class="waiting-notice">
            ⏳ Aguarde sua vez
          </div>
          
          <div class="hand-cards-compact">
            <button
              v-for="card in myPlayer.hand"
              :key="card"
              @click="playCard(card)"
              :disabled="!isMyTurn"
              class="card-button-compact"
              :class="{ 
                'card-disabled': !isMyTurn,
                'card-enabled': isMyTurn
              }"
            >
              <span class="card-value-small" :class="getSuitColorClass(card)">
                {{ getCardDisplay(card) }}
              </span>
              <span class="card-points-small">{{ getCardPoints(card) }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="!gameState.isGameStarted" class="waiting-compact">
          <p>🎮 {{ getWaitingMessage() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState, Player } from '../types';

const props = defineProps<{
  gameState: GameState;
  players: Player[];
  socketId: string;
  trickBanner?: string;
}>();

const emit = defineEmits<{
  (e: 'playCard', card: string): void;
}>();

const myPlayer = computed(() => {
  return props.gameState.players.find(p => p.id === props.socketId);
});

const isMyTurn = computed(() => {
  if (!myPlayer.value) return false;
  const myIndex = props.gameState.players.findIndex(p => p.id === props.socketId);
  return myIndex === props.gameState.turn;
});

function getPlayerTurnIndex(playerId: string): number {
  return props.gameState.players.findIndex(p => p.id === playerId);
}

function getCardDisplay(card: string): string {
  const suitNames: Record<string, string> = {
    'S': '♠',
    'H': '♥',
    'D': '♦',
    'C': '♣'
  };
  
  const suit = card.slice(-1);
  const value = card.slice(0, -1);
  
  return value + suitNames[suit];
}

function getCardSuit(card: string): string {
  return card.slice(-1);
}

function getCardValue(card: string): string {
  return card.slice(0, -1);
}

function getCardPoints(card: string): number {
  const points: Record<string, number> = {
    '7': 11,
    'A': 10,
    'J': 3,
    'Q': 2,
    'K': 4,
  };
  return points[getCardValue(card)] || 0;
}

function getSuitColorClass(card: string): string {
  const suit = getCardSuit(card);
  return (suit === 'H' || suit === 'D') ? 'suit-red' : 'suit-black';
}

function getCurrentPlayerName(): string {
  if (props.gameState.players.length === 0) return '-';
  const currentPlayer = props.gameState.players[props.gameState.turn];
  return currentPlayer ? currentPlayer.nickname : '-';
}

function getWaitingMessage(): string {
  const count = props.gameState.players.length;
  if (count === 1) return 'Precisa de mais jogadores para começar (mínimo 2)';
  if (count === 2) return '🎉 Pronto! O jogo vai começar...';
  if (count === 3) return 'Aguardando 1 jogador ou vamos começar com 2!';
  return 'Sala cheia!';
}

function playCard(card: string) {
  if (isMyTurn.value && myPlayer.value && myPlayer.value.hand.includes(card)) {
    emit('playCard', card);
  }
}
</script>

<style scoped>
.game-table {
  width: 100%;
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.game-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 300px;
  overflow-y: auto;
}

.right-panel {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.your-turn-alert {
  background: linear-gradient(135deg, #facc15, #eab308);
  color: black;
  padding: 18px;
  border-radius: 14px;
  text-align: center;
  animation: pulse 2s infinite;
  border: 4px solid #facc15;
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.55);
}

.trick-banner {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 8px;
  box-shadow: 0 6px 18px rgba(22, 163, 74, 0.45);
}

.your-turn-alert h2 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.02); }
}

.game-info {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(16, 125, 57, 0.9));
  padding: 16px;
  border-radius: 14px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
}

.info-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.label {
  font-size: 1rem;
  opacity: 0.9;
}

.value, .trump-value {
  font-weight: bold;
}

.trump-value {
  font-size: 2rem;
}

.score-board-compact, .captured-cards-section, .my-hand-compact {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(16, 125, 57, 0.9));
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.table-compact {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.95), rgba(16, 125, 57, 0.95));
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.45);
  border: 4px solid #facc15;
}

.score-board-compact h4, .captured-cards-section h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.table-compact h4 {
  margin: 0 0 12px 0;
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  background: linear-gradient(135deg, #facc15, #eab308);
  color: black;
  padding: 10px;
  border-radius: 10px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.15);
  transition: all 0.3s;
  flex-wrap: wrap;
}

.player-item:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
}

.player-self {
  background: linear-gradient(90deg, rgba(202, 138, 4, 0.9), rgba(161, 98, 7, 0.9)) !important;
}

.player-turn {
  box-shadow: 0 0 0 3px #facc15 !important;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 3px #facc15; }
  50% { box-shadow: 0 0 0 5px #facc15, 0 0 15px rgba(250, 204, 21, 0.5); }
}

.player-name-compact, .player-score-compact, .player-name-compact {
  font-size: 1rem;
}

.player-score-compact {
  font-weight: bold;
  color: #facc15;
}

.player-captured {
  font-size: 0.8rem;
  color: #facc15;
  font-weight: bold;
}

.captured-players {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.captured-player {
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.captured-player:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.captured-player strong {
  color: #facc15;
  display: block;
  margin-bottom: 4px;
}

.captured-self {
  border: 2px solid #facc15;
  background-color: rgba(250, 204, 21, 0.2) !important;
}

.captured-cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.captured-card-mini {
  background: white;
  color: black;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  border: 1px solid #333;
}

.no-captures {
  opacity: 0.5;
  font-style: italic;
}

.table-cards-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
}

.table-card-compact {
  background: white;
  color: black;
  padding: 18px 22px;
  border-radius: 12px;
  border: 4px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.28);
  transition: all 0.3s;
  min-width: 140px;
}

.table-card-compact:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.table-card-self {
  border-color: #facc15 !important;
  box-shadow: 0 0 0 3px #ca8a04, 0 4px 10px rgba(250, 204, 21, 0.3) !important;
}

.card-player-compact {
  font-size: 0.75rem;
  opacity: 0.7;
}

.card-symbol-compact {
  font-weight: bold;
  font-size: 1.6rem;
}

.empty-table-compact {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 16px;
}

.hand-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hand-header-compact h3 {
  margin: 0;
  font-size: 1.125rem;
}

.card-count-badge {
  background: linear-gradient(135deg, #ca8a04, #a16207);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.waiting-notice {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  padding: 12px;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.8), rgba(20, 40, 120, 0.8));
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.hand-cards-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.card-button-compact {
  background: linear-gradient(135deg, #ffffff, #f5f5f5);
  color: black;
  border: 4px solid #333;
  padding: 18px 22px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  min-width: 100px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.28);
}

.card-enabled:hover {
  transform: translateY(-6px) scale(1.08);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
  border-color: #facc15;
}

.card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-value-small {
  font-size: 2.1rem;
  font-weight: bold;
}

.card-points-small {
  font-size: 0.9rem;
  opacity: 0.85;
  font-weight: bold;
}

.waiting-compact {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  font-size: 1.25rem;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.8), rgba(20, 40, 120, 0.8));
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.turn-highlight {
  color: #facc15;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.6);
  letter-spacing: 0.3px;
}

.suit-red {
  color: #dc2626;
}

.suit-black {
  color: black;
}
</style>

