// src/core/AudioManager.js

class AudioManager {
  constructor() {
    this.enabled = true;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.6;
    this.audioContext = null;
  }

  /**
   * Инициализация контекста (требуется жест пользователя в вебе)
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  play(soundName) {
    if (!this.enabled) return;
    
    // Ленивая инициализация при первом воспроизведении (если не вызван init)
    if (!this.audioContext) {
      this.init();
    }
    
    // Если всё ещё не удалось создать контекст
    if (!this.audioContext) return;

    const sounds = {
      'boss_hit_light': { freq: 200, duration: 0.1, type: 'square' },
      'boss_hit_medium': { freq: 150, duration: 0.15, type: 'sawtooth' },
      'boss_hit_heavy': { freq: 100, duration: 0.2, type: 'sawtooth' },
      'boss_defeated': { freq: 400, duration: 0.5, type: 'sine' },
      'boss_warning': { freq: 300, duration: 0.3, type: 'triangle' },
      'phase_change': { freq: 500, duration: 0.2, type: 'sine' }
    };

    const sound = sounds[soundName];
    if (!sound) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = sound.freq;
    oscillator.type = sound.type;
    gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + sound.duration);
  }

  setSFXVolume(volume) {
    this.sfxVolume = volume;
    localStorage.setItem('skyace3d_sfxVolume', volume);
  }

  setMusicVolume(volume) {
    this.musicVolume = volume;
    localStorage.setItem('skyace3d_musicVolume', volume);
  }
}

// Экспортируем синглтон
const audioManager = new AudioManager();
export default audioManager;
