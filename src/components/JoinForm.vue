<template>
  <div class="join-container">
    <div class="icon-emoji">🎴</div>
    <h2 class="title">Bisca Online</h2>
    <p class="description">Escolha criar ou entrar em uma sala</p>

    <div class="form-group">
      <input
        v-model="nickname"
        placeholder="Seu apelido"
        class="input-field"
        autofocus
      />
      <div class="button-row">
        <button class="button" :class="{ 'button-disabled': !canContinue }" :disabled="!canContinue" @click="mode='join'">Entrar na sala</button>
        <button class="button" :class="{ 'button-disabled': !canContinue }" :disabled="!canContinue" @click="mode='create'">Criar sala</button>
      </div>
    </div>

    <div v-if="mode==='join'" class="form-group">
      <input v-model="roomId" placeholder="ID da sala" class="input-field" />
      <button class="button" :class="{ 'button-disabled': !canJoin }" :disabled="!canJoin" @click="emitJoin">➡️ Entrar</button>
    </div>

    <div v-if="mode==='create'" class="form-group">
      <div class="select-row">
        <label>Capacidade:</label>
        <select v-model.number="capacity" class="select-field">
          <option :value="2">2 jogadores</option>
          <option :value="3">3 jogadores</option>
          <option :value="4">4 jogadores</option>
        </select>
      </div>
      <div class="select-row">
        <label>Rodadas:</label>
        <select v-model.number="rounds" class="select-field">
          <option :value="1">1</option>
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="7">7</option>
        </select>
      </div>
      <button class="button" @click="emitCreate">🆕 Criar sala</button>
      <p class="hint">O dono pode iniciar com 2+ jogadores, mesmo se a capacidade for maior.</p>
    </div>

    <div class="info-text">
      <p>📋 Jogo suporta 2 até 4 jogadores</p>
      <p>👑 O dono inicia o jogo quando quiser (mínimo 2 jogadores)</p>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue';
const emit = defineEmits<{
  (e: 'joinRoom', payload: { nickname: string; roomId: string }): void
  (e: 'createRoom', payload: { nickname: string; capacity: number; totalRounds?: number }): void
}>()

const nickname = ref('');
const mode = ref<'join' | 'create' | ''>('');
const roomId = ref('');
const capacity = ref(4);
const rounds = ref(3);
const canContinue = computed(() => nickname.value.trim().length > 0);
const canJoin = computed(() => canContinue.value && roomId.value.trim().length > 0);

function emitJoin() {
  emit('joinRoom', { nickname: nickname.value.trim(), roomId: roomId.value.trim() });
}
function emitCreate() {
  let cap = Math.max(2, Math.min(4, Math.floor(capacity.value)));
  const totalRounds = Math.max(1, Math.min(20, Math.floor(rounds.value)));
  emit('createRoom', { nickname: nickname.value.trim(), capacity: cap, totalRounds });
}
</script>

<style scoped>
.join-container {
  background-color: rgba(22, 163, 74, 0.8);
  padding: 40px;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.icon-emoji {
  font-size: 60px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.description {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-field {
  width: 100%;
  border: 2px solid rgb(22, 163, 74);
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  background-color: white;
  color: black;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #facc15;
}

.button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 18px;
  background-color: rgb(22, 163, 74);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.button:hover:not(.button-disabled) {
  background-color: rgb(21, 128, 61);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.button-disabled {
  background-color: #64748b;
  color: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
}

.select-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.select-field {
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid rgb(22, 163, 74);
  background-color: white;
}

.hint {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.85);
}

.info-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-text p {
  margin: 0;
}
</style>
