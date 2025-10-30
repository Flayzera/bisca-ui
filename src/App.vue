<template>
  <div class="app-container">
    <h1 class="main-title">Bisca Online 🎴</h1>

    <JoinForm v-if="!joined" @createRoom="createRoom" @joinRoom="joinRoom" />

    <div v-else class="game-container">
      <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <div>Room: <strong>{{ roomId || 'lobby' }}</strong> (cap: {{ roomCapacity || 4 }})</div>
        <div v-if="totalRounds">Rodadas: <strong>{{ totalRounds }}</strong></div>
        <div v-if="isOwner" style="display: inline-flex; gap: 8px; align-items: center;">
          <button @click="startRoom" style="padding: 6px 10px;">Iniciar jogo</button>
        </div>
      </div>
      <GameTable 
        :gameState="gameState" 
        :players="players"
        :socketId="socketId"
        :trickBanner="trickBanner"
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

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);
const serverUrl = isLocal ? 'http://localhost:3000' : (import.meta.env.VITE_SERVER_URL || '');
console.log('[FRONTEND] Inicializando socket com URL:', serverUrl);

const socket = ref<Socket>(io(serverUrl, {
  extraHeaders: { 'bypass-tunnel-reminder': '1' },
  transportOptions: {
    polling: { extraHeaders: { 'bypass-tunnel-reminder': '1' } }
  },
  path: '/bisca-socket',
  transports: ['polling'],
  upgrade: false,
  timeout: 10000, // Reduzido de 30s para 10s para detectar problemas mais rápido
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 20,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  autoConnect: true,
  forceNew: false,
}));

console.log('[FRONTEND] Socket criado, estado inicial:', socket.value.connected ? 'conectado' : 'desconectado');

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
const totalRounds = ref<number | null>(null);
const trickBanner = ref<string>('');
const isOwner = computed(() => ownerId.value && ownerId.value === socketId.value);

onMounted(() => {
  console.log('[FRONTEND] onMounted - Socket estado:', socket.value.connected ? 'conectado' : 'desconectado');
  
  socket.value.on('connect', () => {
    socketId.value = socket.value.id || '';
    console.log('[FRONTEND] Socket conectado:', socketId.value);
  });
  
  socket.value.on('connecting', () => {
    console.log('[FRONTEND] Socket conectando...');
    console.log('[FRONTEND] Configuração:', {
      url: serverUrl,
      path: '/bisca-socket',
      transports: ['polling']
    });
  });
  
  socket.value.on('disconnect', (reason) => {
    console.log('[FRONTEND] Socket desconectado, motivo:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, reconnect manually
      socket.value.connect();
    }
  });
  
  socket.value.on('connect_error', (error: Error & { type?: string; description?: string }) => {
    console.error('[FRONTEND] Erro de conexão:', error.message);
    if (error.type) console.error('[FRONTEND] Tipo do erro:', error.type);
    if (error.description) console.error('[FRONTEND] Descrição:', error.description);
    console.error('[FRONTEND] Erro completo:', error);
    
    // Tentar verificar se a URL está acessível
    fetch(`${serverUrl}/health`)
      .then(res => res.json())
      .then(data => {
        console.log('[FRONTEND] Health check OK:', data);
      })
      .catch(err => {
        console.error('[FRONTEND] Health check FALHOU:', err);
        console.error('[FRONTEND] Isso indica que o backend não está acessível na URL:', serverUrl);
      });
  });
  
  socket.value.on('reconnect', (attemptNumber) => {
    console.log('[FRONTEND] Reconectado após', attemptNumber, 'tentativas');
    socketId.value = socket.value.id || '';
  });
  
  socket.value.on('reconnect_attempt', (attemptNumber) => {
    console.log('[FRONTEND] Tentativa de reconexão:', attemptNumber);
  });
  
  socket.value.on('reconnect_error', (error) => {
    console.error('[FRONTEND] Erro na reconexão:', error.message);
  });
  
  socket.value.on('reconnect_failed', () => {
    console.error('[FRONTEND] Falha na reconexão após todas as tentativas');
  });
  
  socketId.value = socket.value.id || '';
  
  // Forçar tentativa de conexão se não estiver conectado
  if (!socket.value.connected) {
    console.log('[FRONTEND] Socket não conectado, tentando conectar...');
    socket.value.connect();
    
    // Timeout de segurança: se não conectar em 15s, mostrar erro
    setTimeout(() => {
      if (!socket.value.connected) {
        console.error('[FRONTEND] TIMEOUT: Socket não conectou após 15 segundos');
        console.error('[FRONTEND] Estado do socket:', {
          connected: socket.value.connected,
          disconnected: socket.value.disconnected,
          id: socket.value.id
        });
        alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando e se a URL está correta.');
      }
    }, 15000);
  }
  
  socket.value.on('gameState', (state: GameState) => {
    gameState.value = state;
    if (!state.isGameStarted && state.players.length === 0) {
      joined.value = false;
    }
  });
  
  socket.value.on('playersUpdate', (list: Player[]) => {
    players.value = list;
    console.log('[FRONTEND] playersUpdate:', list.map(p => p.nickname).join(', '));
    const isInList = list.some(p => p.id === socketId.value);
    if (isInList && !joined.value) {
      console.log('[FRONTEND] Jogador confirmado na lista, marcando como joined');
      joined.value = true;
    }
    if (!isInList && joined.value) {
      console.log('[FRONTEND] Jogador não está mais na lista');
      joined.value = false;
    }
  });
  
  socket.value.on('roomFull', () => {
    alert('A sala já está cheia');
    joined.value = false;
  });
  
  socket.value.on('roomError', (msg: string) => {
    console.error('[FRONTEND] roomError:', msg);
    alert(msg);
    joined.value = false;
  });
  
  socket.value.on('gameStarted', () => {
    console.log('[FRONTEND] Jogo iniciado');
  });
  
  socket.value.on('roomCreated', (payload: { roomId: string; capacity: number; totalRounds?: number }) => {
    roomId.value = payload.roomId;
    roomCapacity.value = payload.capacity;
    ownerId.value = socketId.value;
    totalRounds.value = payload.totalRounds ?? null;
    console.log('[FRONTEND] Sala criada:', payload.roomId);
    // Não marcar joined aqui, esperar playersUpdate
  });
  
  socket.value.on('roomJoined', (payload: { roomId: string; capacity: number; ownerId: string }) => {
    roomId.value = payload.roomId;
    roomCapacity.value = payload.capacity;
    ownerId.value = payload.ownerId;
    console.log('[FRONTEND] Entrou na sala:', payload.roomId);
    // Não marcar joined aqui, esperar playersUpdate
  });
  
  socket.value.on('gameFinished', () => {
    alert('Jogo finalizado!');
    joined.value = false;
  });

  socket.value.on('trickWon', (payload: { winnerId: string; winnerNickname: string; cards: any[]; roundNumber: number }) => {
    console.log('[FRONTEND] Vaza vencida por', payload.winnerNickname, 'na rodada', payload.roundNumber);
    trickBanner.value = `Vaza ${payload.roundNumber}: ${payload.winnerNickname} venceu!`;
    setTimeout(() => { trickBanner.value = ''; }, 2000);
  });

  socket.value.on('roundFinished', (payload: { scores: { id: string; nickname: string; score: number }[]; chipsAwarded: { playerId: string; delta: number }[]; totalChips: { id: string; nickname: string; chips: number }[]; trumpCard: string }) => {
    const winners = payload.scores.sort((a,b)=>b.score-a.score);
    const top = winners[0];
    const chipsMsg = payload.chipsAwarded.map(c => {
      const p = payload.totalChips.find(t => t.id === c.playerId);
      return `${p?.nickname || ''}: +${c.delta} (total ${p?.chips ?? 0})`;
    }).join('\n');
    alert(`Rodada finalizada!\nMaior pontuação: ${top.nickname} (${top.score})\n\nFichas:\n${chipsMsg || '—'}`);
  });

  socket.value.on('matchFinished', (payload: { winners: { id: string; nickname: string; chips: number }[]; standings: { id: string; nickname: string; chips: number }[] }) => {
    const winnerNames = payload.winners.map(w => `${w.nickname} (${w.chips})`).join(', ');
    alert(`Partida encerrada! Vencedor(es): ${winnerNames}`);
  });
});

// Helper para garantir que o socket esteja conectado antes de emitir
async function ensureConnected(): Promise<boolean> {
  if (socket.value.connected) {
    console.log('[FRONTEND] ensureConnected: Já conectado');
    return true;
  }
  
  console.log('[FRONTEND] ensureConnected: Aguardando conexão...');
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error('[FRONTEND] ensureConnected: Timeout aguardando conexão após 10s');
      resolve(false);
    }, 10000);
    
    socket.value.once('connect', () => {
      clearTimeout(timeout);
      console.log('[FRONTEND] ensureConnected: Conexão estabelecida após espera');
      resolve(true);
    });
    
    // Se já está conectando, também esperar
    if (socket.value.disconnected) {
      console.log('[FRONTEND] ensureConnected: Forçando tentativa de conexão');
      socket.value.connect();
    }
  });
}

function createRoom(payload: { nickname: string; capacity: number; totalRounds?: number }) {
  if (!payload.nickname) {
    alert('Digite um apelido!');
    return;
  }
  console.log('[FRONTEND] Criando sala... conectado:', socket.value.connected);
  
  ensureConnected().then((connected) => {
    if (connected) {
      socket.value.emit('createRoom', { capacity: payload.capacity, nickname: payload.nickname, totalRounds: payload.totalRounds });
      console.log('[FRONTEND] Evento createRoom emitido');
    } else {
      alert('Não foi possível conectar ao servidor. Tente novamente.');
    }
  });
}

function joinRoom(payload: { nickname: string; roomId: string }) {
  if (!payload.nickname) {
    alert('Digite um apelido!');
    return;
  }
  if (!payload.roomId) {
    alert('Informe o ID da sala!');
    return;
  }
  console.log('[FRONTEND] Entrando na sala... conectado:', socket.value.connected);
  
  ensureConnected().then((connected) => {
    if (connected) {
      socket.value.emit('joinRoom', { roomId: payload.roomId, nickname: payload.nickname });
      console.log('[FRONTEND] Evento joinRoom emitido');
    } else {
      alert('Não foi possível conectar ao servidor. Tente novamente.');
    }
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
