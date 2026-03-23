import { BossConfig } from '../config/BossConfig.js';

export class RespawnManager {
    constructor(checkpointManager, bossManager, difficulty, scoreManager) {
        this.checkpointManager = checkpointManager;
        this.bossManager = bossManager;
        this.difficulty = difficulty;
        this.scoreManager = scoreManager;

        /** Смерти за текущую попытку босса (сброс при новом бое) */
        this.bossAttemptDeaths = 0;
    }

    /**
     * Сброс счётчика смертей в текущей схватке с боссом (новый босс)
     */
    resetBossAttemptDeaths() {
        this.bossAttemptDeaths = 0;
    }

    handleDeath() {
        const lastCP = this.checkpointManager.getLast();
        if (!lastCP) return { mode: 'STANDARD_RESPAWN', checkpoint: null };

        const mode = this.determineRespawnMode(lastCP);

        if (mode === 'BOSS_RETRY') {
            this.bossAttemptDeaths++;
        }

        console.log(
            `[RespawnManager] Death: mode=${mode}, cpType=${lastCP.type || 'STANDARD'}, bossAttemptDeaths=${this.bossAttemptDeaths}`
        );

        return { mode, checkpoint: lastCP };
    }

    determineRespawnMode(checkpoint) {
        if (checkpoint.type === 'PRE_BOSS' || checkpoint.type === 'MID_BOSS') {
            return 'BOSS_RETRY';
        }
        return 'STANDARD_RESPAWN';
    }

    /**
     * Easy/Medium: −HP при 3+ попытках; Hard: assist — пули босса медленнее на 10%
     */
    applyBossRetryModifiers(boss) {
        if (!boss || this.bossAttemptDeaths < 3) return;

        if (this.difficulty === 'hard') {
            boss.bulletSpeedMultiplier = 1 - BossConfig.HARD_BULLET_SLOW_ASSIST;
            console.log('[RespawnManager] Hard assist: boss bullets slowed by 10%');
            return;
        }

        const reduction = BossConfig.RESPAWN_ASSIST[this.difficulty] || 0;
        if (reduction > 0) {
            boss.hp *= 1 - reduction;
            boss.maxHp *= 1 - reduction;
            console.log(`[RespawnManager] Adaptive assist: boss HP reduced by ${reduction * 100}%`);
        }
    }

    grantInvulnerability(player, duration = 2000) {
        player.isInvulnerable = true;

        if (player.mesh) {
            const blinkInterval = setInterval(() => {
                player.mesh.visible = !player.mesh.visible;
            }, 100);

            setTimeout(() => {
                clearInterval(blinkInterval);
                player.mesh.visible = true;
                player.isInvulnerable = false;
                console.log('[RespawnManager] Invulnerability ended');
            }, duration);
        }
    }
}
