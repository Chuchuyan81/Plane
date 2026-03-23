import { GameState, BossState } from '../core/GameState.js';
import { Boss } from '../objects/Boss.js';

export class BossManager {
    constructor(difficulty, scoreManager, checkpointManager, uiManager) {
        this.difficulty = difficulty;
        this.scoreManager = scoreManager;
        this.checkpointManager = checkpointManager;
        this.uiManager = uiManager;

        this.boss = null;
        this.isBossActive = false;
        
        // Пороги спавна
        this.spawnThresholds = {
            easy: 10000,
            medium: 15000,
            hard: 20000
        };

        this.nextBossThreshold = this.spawnThresholds[difficulty] || 15000;
        
        this.playerNoDamage = true; // For no damage bonus
    }

    /**
     * Проверка порога спавна босса
     */
    checkBossSpawn(currentScore) {
        if (this.isBossActive || currentScore < this.nextBossThreshold) return false;
        
        this.spawnBoss();
        return true;
    }

    /**
     * Создание босса
     */
    spawnBoss(scene, playerPos, savedBossHp = null) {
        this.isBossActive = true;
        this.playerNoDamage = true; // Сброс флага получения урона для нового босса

        // 1. Остановить спавн обычных врагов (handled in gameLoop)
        // 2. Заблокировать создание новых чек-поинтов
        this.checkpointManager.lockCheckpointCreation();
        
        // 3. Сохранить состояние игры (PRE_BOSS чек-поинт)
        if (!savedBossHp) {
            this.checkpointManager.forceSave({ 
                type: 'PRE_BOSS',
                score: this.scoreManager.score,
                combo: this.scoreManager.combo,
                distance: Math.round(playerPos.z)
            });
        }

        // 4. Заморозить прогресс дистанции (handled in gameLoop)
        // 5. Показать полосу здоровья босса
        this.boss = new Boss(scene, this.difficulty, this.scoreManager.bossesKilled, playerPos);
        
        if (savedBossHp !== null) {
            this.boss.hp = savedBossHp;
            this.boss.halfHpSaved = savedBossHp <= this.boss.maxHp * 0.5;
        }

        this.uiManager.setBossWarning(true);
        this.uiManager.updateHUD({ 
            bossHp: this.boss.hp / this.boss.maxHp, 
            bossCurrentHp: this.boss.hp, 
            bossMaxHp: this.boss.maxHp,
            bossName: "GENERAL " + (this.scoreManager.bossesKilled + 1)
        });
        
        // 6. Переключить GameState в BOSS_FIGHT (handled in gameLoop)
        
        // Уведомление
        this.uiManager.notify("WARNING: BOSS APPROACHING", "warning", 3000);
        
        console.log(`[BossManager] Boss spawned at score: ${this.scoreManager.score}`);
    }

    /**
     * Обновление логики босса
     */
    updateBoss(dt, player, gameTime) {
        if (!this.boss || this.boss.isDead) return;

        this.boss.update(dt, player.position, gameTime);
        
        // Update UI health bar
        this.uiManager.updateHUD({ 
            bossHp: this.boss.hp / this.boss.maxHp,
            bossCurrentHp: this.boss.hp,
            bossMaxHp: this.boss.maxHp,
            bossName: "GENERAL " + (this.scoreManager.bossesKilled + 1)
        });
        
        // Check for 50% HP threshold (Easy/Medium)
        if (this.boss.hp <= this.boss.maxHp * 0.5 && !this.boss.halfHpSaved) {
            this.boss.halfHpSaved = true;
            this.uiManager.notify("BOSS DAMAGED", "info", 2000);
            
            if (this.difficulty === 'easy' || this.difficulty === 'medium') {
                this.checkpointManager.forceSave({
                    type: 'MID_BOSS',
                    score: this.scoreManager.score,
                    bossHp: this.boss.hp,
                    playerShield: player.shield
                });
            }
        }
    }

    /**
     * Обработка попадания по боссу
     */
    handleBossHit(damage) {
        if (!this.boss || this.boss.isDead) return false;

        const isKilled = this.boss.takeDamage(damage);
        if (isKilled) {
            this.onBossDefeated();
            return true;
        }
        return false;
    }

    /**
     * Обработка смерти босса
     */
    onBossDefeated() {
        this.isBossActive = false;
        
        // Расчёт бонусных очков
        const baseScore = 5000;
        const comboMultiplier = this.scoreManager.combo * 100;
        const noDamageBonus = this.playerNoDamage ? 1.5 : 1.0;
        
        const finalBonus = Math.floor((baseScore + comboMultiplier) * noDamageBonus);
        
        this.scoreManager.addScore(finalBonus);
        this.scoreManager.addBossKill();

        // 2. Создать POST_BOSS чек-поинт
        this.checkpointManager.forceSave({ type: 'POST_BOSS' });
        
        // 3. Разблокировать спавн врагов
        // 4. Разблокировать чек-поинты
        this.checkpointManager.unlockCheckpointCreation();
        
        // 5. Возобновить прогресс дистанции
        // 6. Скрыть полосу здоровья босса
        this.uiManager.updateHUD({ bossHp: 0 });
        this.uiManager.setBossWarning(false);
        
        // 7. Вернуть GameState в PLAYING (handled in gameLoop)
        
        // 8. Показать уведомление о победе
        this.uiManager.notify("BOSS DEFEATED!", "success", 4000);
        
        // Trigger visual effects (handled in game loop via a callback or event)
        const event = new CustomEvent('boss-defeated', { detail: { bonus: finalBonus } });
        window.dispatchEvent(event);
        
        this.nextBossThreshold += this.spawnThresholds[this.difficulty] || 15000;
        
        console.log(`[BossManager] Boss defeated! Bonus points: ${finalBonus}`);
    }

    /**
     * Вызывается при смерти игрока
     */
    onPlayerDeath() {
        // Handled by RespawnManager, but we can reset flag
        this.playerNoDamage = true;
    }

    /**
     * Очистка при перезапуске
     */
    cleanup() {
        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }
        this.isBossActive = false;
        this.nextBossThreshold = this.spawnThresholds[this.difficulty] || 15000;
    }
}
