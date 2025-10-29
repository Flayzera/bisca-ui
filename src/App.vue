<template>
  <div class="app-container">
    <h1 class="main-title">Bisca Online 🎴</h1>

    <JoinForm v-if="!joined" @createRoom="createRoom" @joinRoom="joinRoom" />

    <div v-else class="game-container">
      <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <div>Room: <strong>{{ roomId || 'lobby' }}</strong> (cap: {{ roomCapacity || 4 }})</div>
        <div v-if="isOwner" style="display: inline-flex; gap: 8px; align-items: center;">
          <button @click="startRoom" style="padding: 6px 10px;">Iniciar jogo</button>
        </div>
      </div>
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
import { ref, onMounted, computed } from 'vue';
import { io, Socket } from 'socket.io-client';
import GameTable from './components/GameTable.vue';
import JoinForm from './components/JoinForm.vue';
import type { GameState, Player } from './types';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const socket = ref<Socket>(io(serverUrl, {
  extraHeaders: { 'bypass-tunnel-reminder': '1' },
  transportOptions: {
    polling: { extraHeaders: { 'bypass-tunnel-reminder': '1' } }
  },
  path: '/bisca-socket',
  // Forçar HTTP polling primeiro (mais estável no LocalTunnel) e desabilitar upgrade
  transports: ['polling'],
  upgrade: false,
  // Timeouts e reconexão mais tolerantes
  timeout: 30000,
  reconnection: true,
  reconnectionDelay: 1500,
  reconnectionAttempts: 20,
}));
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
const roomId = ref<string>('');
const roomCapacity = ref<number>(4);
const ownerId = ref<string>('');
const isOwner = computed(() => ownerId.value && ownerId.value === socketId.value);

const socketConnected = ref(false);

onMounted(() => {
  socket.value.on('connect', () => {
    socketId.value = socket.value.id || '';
    socketConnected.value = true;
    console.log('[FRONTEND] Socket conectado! ID:', socketId.value);
  });
  
  socket.value.on('disconnect', () => {
    socketConnected.value = false;
    console.log('[FRONTEND] Socket desconectado!');
  });
  
  socket.value.on('connect_error', (error) => {
    console.error('[FRONTEND] Erro de conexão:', error);
    socketConnected.value = false;
  });
  
  socketId.value = socket.value.id || '';
  socketConnected.value = socket.value.connected;
  
  socket.value.on('gameState', (state: GameState) => {
    gameState.value = state;
    // Se o jogo foi resetado e não há jogadores, volta para a tela de join
    if (!state.isGameStarted && state.players.length === 0) {
      joined.value = false;
    }
  });
  socket.value.on('playersUpdate', (list: Player[]) => {
    players.value = list;
    console.log('[FRONTEND] playersUpdate recebido:', list.map(p => p.nickname));
    // Se este jogador está na lista, marcar como joined
    if (!joined.value && list.some(p => p.id === socketId.value)) {
      console.log('[FRONTEND] Confirmação: jogador entrou no jogo!');
      joined.value = true;
    }
    // Verificar se este jogador ainda está na lista
    if (joined.value && !list.some(p => p.id === socketId.value)) {
      console.log('[FRONTEND] Jogador removido da lista!');
      joined.value = false;
    }
  });
  socket.value.on('roomFull', () => {
    alert('A sala já está cheia (máximo de 4 jogadores)');
    joined.value = false;
  });
  socket.value.on('gameStarted', () => {
    console.log('Jogo iniciado!');
  });
  socket.value.on('roomCreated', (payload: { roomId: string; capacity: number }) => {
    roomId.value = payload.roomId;
    roomCapacity.value = payload.capacity;
    ownerId.value = socketId.value;
    console.log('[FRONTEND] Sala criada:', payload);
    // joined fica true quando playersUpdate incluir este socket
  });
  socket.value.on('roomJoined', (payload: { roomId: string; capacity: number; ownerId: string }) => {
    roomId.value = payload.roomId;
    roomCapacity.value = payload.capacity;
    ownerId.value = payload.ownerId;
    console.log('[FRONTEND] Entrou na sala:', payload);
    // joined fica true quando playersUpdate incluir este socket
  });
  socket.value.on('gameFinished', () => {
    alert('Jogo finalizado!');
    joined.value = false;
  });
});

function createRoom(payload: { nickname: string; capacity: number }) {
  if (!payload.nickname) return alert('Digite um apelido!');
  const tryEmit = (fn: () => void) => {
    if (socket.value.connected) return fn();
    socket.value.once('connect', fn);
  };
  tryEmit(() => {
    socketId.value = socket.value.id || '';
    socket.value.emit('createRoom', { capacity: payload.capacity, nickname: payload.nickname });
  });
}

function joinRoom(payload: { nickname: string; roomId: string }) {
  if (!payload.nickname) return alert('Digite um apelido!');
  if (!payload.roomId) return alert('Informe o ID da sala!');
  const tryEmit = (fn: () => void) => {
    if (socket.value.connected) return fn();
    socket.value.once('connect', fn);
  };
  tryEmit(() => {
    socketId.value = socket.value.id || '';
    socket.value.emit('joinRoom', { roomId: payload.roomId, nickname: payload.nickname });
  });
}

function playCard(card: string) {
  socket.value.emit('playCard', card);
}

function startRoom() {
  if (!roomId.value) return;
  socket.value.emit('startRoom', { roomId: roomId.value });
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
