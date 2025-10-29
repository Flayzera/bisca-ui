<template>
  <div class="app-container">
    <h1 class="main-title">Bisca Online 🎴</h1>

    <JoinForm v-if="!joined" @join="joinGame" />

    <div v-else class="game-container">
      <GameTable 
        :gameState="gameState" 
        :players="players"
        :socketId="socketId"
        @playCard="playCard" 
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import GameTable from './components/GameTable.vue';
import JoinForm from './components/JoinForm.vue';
import type { GameState, Player } from './types';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const socket = ref<Socket>(io(serverUrl));
const socketId = ref<string>('');
const gameState = ref<GameState>({ 
  players: [], 
  table: [], 
  turn: 0, 
  trumpCard: '',
  deck: [],
  roundNumber: 0,
  isGameStarted: false
});
const players = ref<Player[]>([]);
const joined = ref(false);

onMounted(() => {
  socketId.value = socket.value.id || '';
  
  socket.value.on('connect', () => {
    socketId.value = socket.value.id || '';
  });
  
  socket.value.on('gameState', (state: GameState) => {
    gameState.value = state;
  });
  socket.value.on('playersUpdate', (list: Player[]) => (players.value = list));
  socket.value.on('roomFull', () => alert('A sala já está cheia (máximo de 4 jogadores)'));
  socket.value.on('gameStarted', () => console.log('Jogo iniciado!'));
  socket.value.on('gameFinished', () => alert('Jogo finalizado!'));
});

function joinGame(nickname: string) {
  if (!nickname) return alert('Digite um apelido!');
  socket.value.emit('joinGame', nickname);
  joined.value = true;
}

function playCard(card: string) {
  socket.value.emit('playCard', card);
}
</script>

<style scoped>
.app-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.main-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.game-container {
  width: 100%;
}
</style>
