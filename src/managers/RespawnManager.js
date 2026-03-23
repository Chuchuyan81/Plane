import { GameState } from '../core/GameState.js';

export class RespawnManager {
    constructor(checkpointManager, bossManager, difficulty, scoreManager) {
        this.checkpointManager = checkpointManager;
        this.bossManager = bossManager;
        this.difficulty = difficulty;
        this.scoreManager = scoreManager;
        
        this.deathCount = 0; // Для адаптивной помощи
    }

    /**
     * Основная логика смерти
     */
    handleDeath() {
        this.deathCount++;
        
        const lastCP = this.checkpointManager.getLast();
        if (!lastCP) return { mode: 'STANDARD_RESPAWN', checkpoint: null };
        
        const mode = this.determineRespawnMode(lastCP);
        
        console.log(`[RespawnManager] Death handled! Mode: ${mode}, Last Checkpoint type: ${lastCP.type || 'STANDARD'}`);
        
        return { mode, checkpoint: lastCP };
    }

    /**
     * Определение режима
     */
    determineRespawnMode(checkpoint) {
        if (checkpoint.type === 'PRE_BOSS' || checkpoint.type === 'MID_BOSS') {
            return 'BOSS_RETRY';
        }
        return 'STANDARD_RESPAWN';
    }

    /**
     * Модификаторы для повторной попытки (Адаптивная помощь)
     */
    applyBossRetryModifiers(boss) {
        if (this.deathCount < 3) return;

        // Помощь при повторных попытках (≥3)
        const helpMap = {
            easy: 0.25, // -25% HP
            medium: 0.15, // -15% HP
            hard: 0 // Нет помощи по HP
        };

        const reduction = helpMap[this.difficulty] || 0;
        if (reduction > 0) {
            boss.hp *= (1 - reduction);
            boss.maxHp *= (1 - reduction);
            console.log(`[RespawnManager] Adaptive assistance! Reduced Boss HP by ${reduction * 100}%`);
        }
    }

    /**
     * Временная неуязвимость
     */
    grantInvulnerability(player, duration = 2000) {
        player.isInvulnerable = true;
        
        // Визуально мигаем самолетом или ставим щит
        if (player.mesh) {
            const originalVisible = player.mesh.visible;
            const blinkInterval = setInterval(() => {
                player.mesh.visible = !player.mesh.visible;
            }, 100);
            
            setTimeout(() => {
                clearInterval(blinkInterval);
                player.mesh.visible = true; // originalVisible;
                player.isInvulnerable = false;
                console.log("[RespawnManager] Invulnerability ended");
            }, duration);
        }
    }
}
