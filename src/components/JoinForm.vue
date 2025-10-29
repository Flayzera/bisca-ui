<template>
  <div class="join-container">
    <div class="icon-emoji">🎴</div>
    <h2 class="title">Bisca Online</h2>
    <p class="description">
      Entre com seu apelido para começar a jogar com seus amigos
    </p>
    
    <div class="form-group">
      <input
        v-model="nickname"
        @keyup.enter="$emit('join', nickname)"
        placeholder="Digite seu apelido"
        class="input-field"
        autofocus
      />
      <button
        @click="$emit('join', nickname)"
        :disabled="!nickname.trim()"
        class="button"
        :class="{ 'button-disabled': !nickname.trim() }"
      >
        🎮 Entrar no Jogo
      </button>
    </div>
    
    <div class="info-text">
      <p>📋 Jogo para 2 ou 4 jogadores</p>
      <p>🎯 Objetivo: Fazer mais pontos</p>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
const nickname = ref('');
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
