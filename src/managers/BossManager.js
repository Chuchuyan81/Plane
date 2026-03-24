import { BossState } from '../core/GameState.js';
import { Boss } from '../objects/Boss.js';
import { BossConfig } from '../config/BossConfig.js';

export class BossManager {
    constructor(difficulty, scoreManager, checkpointManager, uiManager, physics) {
        this.difficulty = difficulty;
        this.scoreManager = scoreManager;
        this.checkpointManager = checkpointManager;
        this.uiManager = uiManager;
        this.physics = physics;
        /** @type {import('./RespawnManager.js').RespawnManager|null} */
        this._respawnManager = null;

        this.boss = null;
        this.isBossActive = false;

        this.lastBossScore = 0; // Счёт после победы над предыдущим боссом
        this.nextBossThreshold = this._firstThresholdForDifficulty(difficulty);
        this.bonusSpawnTimer = 0;

        this.playerNoDamage = true;
        this._preloadLogged = false;
    }

    /**
     * Связь с RespawnManager (после создания, т.к. циклическая зависимость)
     * @param {import('./RespawnManager.js').RespawnManager} rm
     */
    attachRespawnManager(rm) {
        this._respawnManager = rm;
    }

    _firstThresholdForDifficulty(d) {
        return BossConfig.baseScoreThreshold;
    }

    _thresholdForDifficulty(d) {
        return BossConfig.baseScoreThreshold;
    }

    /**
     * Только проверка порога (спавн вызывает игра)
     */
    shouldSpawnBoss(currentScore) {
        if (this.isBossActive) return false;
        return currentScore >= this.nextBossThreshold;
    }

    /**
     * @param {boolean} fromRetry — повтор после смерти (не сбрасывать счётчик попыток)
     */
    spawnBoss(scene, player, savedBossHp = null, fromRetry = false) {
        this.isBossActive = true;
        this.playerNoDamage = true;

        this.checkpointManager.lockCheckpointCreation();
        this.physics.freezeDistanceProgress();

        if (!fromRetry) {
            this._respawnManager?.resetBossAttemptDeaths();
            this.checkpointManager.forceSave({
                type: 'PRE_BOSS',
                score: this.scoreManager.score,
                combo: this.scoreManager.combo,
                distance: Math.floor(Math.max(0, -player.position.z)),
                activePowerUps: this.checkpointManager.serializeActivePowerUps(player),
                lastBossScore: this.lastBossScore,
                nextBossThreshold: this.nextBossThreshold
            });
            this._preloadLogged = false;
        }

        this.boss = new Boss(scene, this.difficulty, this.scoreManager.bossesKilled, player.position);

        if (savedBossHp !== null && savedBossHp !== undefined) {
            this.boss.hp = savedBossHp;
            this.boss.halfHpSaved = savedBossHp <= this.boss.maxHp * 0.5;
        }

        this.uiManager.setBossWarning(true);
        this._showBossHUD();

        this.bonusSpawnTimer = 0; // Сброс таймера бонусов при начале боя

        this.uiManager.notify('WARNING: BOSS APPROACHING', 'warning', 3000);
        console.log(`[BossManager] Boss spawned at score: ${this.scoreManager.score}, threshold: ${this.nextBossThreshold}`);
    }

    _showBossHUD() {
        if (!this.boss) return;
        this.uiManager.updateHUD({
            bossHp: this.boss.hp / this.boss.maxHp,
            bossCurrentHp: this.boss.hp,
            bossMaxHp: this.boss.maxHp,
            bossName: 'GENERAL ' + (this.scoreManager.bossesKilled + 1),
            bossPhase: this.boss.currentPhase,
            isBossActive: true
        });
    }

    _hideBossHUD() {
        this.uiManager.updateHUD({ bossHp: 0, isBossActive: false });
        this.uiManager.setBossWarning(false);
    }

    /**
     * Прогресс до босса (для UI); при ≥80% — лог прелоада
     */
    getBossProgressForUI(currentScore) {
        const target = this.nextBossThreshold;
        const ratio = target > 0 ? Math.min(1, currentScore / target) : 0;
        
        // Предупреждение (ТЗ Задача 3)
        if (!this.isBossActive && target - currentScore <= (BossConfig.WARNING_THRESHOLD || 500) && target - currentScore > 0) {
            this.uiManager.setBossWarning(true);
        } else if (!this.isBossActive) {
            this.uiManager.setBossWarning(false);
        }

        if (!this._preloadLogged && ratio >= BossConfig.PRELOAD_PROGRESS) {
            this._preloadLogged = true;
            console.log('[BossManager] Boss preload threshold reached (80% progress)');
        }
        
        // Обновляем UI через UIManager
        this.uiManager.updateHUD({
            bossProgress: currentScore,
            bossThreshold: target,
            isBossActive: this.isBossActive
        });

        return { 
            current: currentScore, 
            target, 
            ratio,
            currentRelative: currentScore, // Now using absolute for simplicity if requested
            targetRelative: target
        };
    }

    updateBoss(dt, player, gameTime, activeBonusCount = 0) {
        if (!this.boss || this.boss.isDead) return;

        this.boss.update(dt, player.position, gameTime);
        
        // Задача 1: Непрерывный спавн бонусов во время боя
        this.bonusSpawnTimer += dt * 1000;
        if (this.bonusSpawnTimer >= BossConfig.BOSS_BONUS_SPAWN_INTERVAL) {
            if (activeBonusCount < BossConfig.MAX_ACTIVE_BOSS_BONUSES) {
                window.dispatchEvent(new CustomEvent('boss-spawn-aid', {
                    detail: { distance: 150 } // Спавним на 150 единиц впереди (было 200)
                }));
                this.bonusSpawnTimer = 0;
            } else {
                // Если бонусов слишком много, откладываем на 1 сек, чтобы проверить позже
                this.bonusSpawnTimer -= 1000;
            }
        }

        this.uiManager.updateHUD({
            bossHp: this.boss.hp / this.boss.maxHp,
            bossCurrentHp: this.boss.hp,
            bossMaxHp: this.boss.maxHp,
            bossName: 'GENERAL ' + (this.scoreManager.bossesKilled + 1),
            bossPhase: this.boss.currentPhase,
            isBossActive: true
        });

        if (this.boss.hp <= this.boss.maxHp * 0.5 && !this.boss.halfHpSaved) {
            this.boss.halfHpSaved = true;
            this.uiManager.notify('BOSS DAMAGED', 'info', 2000);

            if (this.difficulty === 'easy') {
                this.checkpointManager.forceSave({
                    type: 'MID_BOSS',
                    score: this.scoreManager.score,
                    bossHp: this.boss.hp,
                    activePowerUps: this.checkpointManager.serializeActivePowerUps(player),
                    playerShield: player.shield,
                    distance: Math.floor(Math.max(0, -player.position.z)),
                    lastBossScore: this.lastBossScore,
                    nextBossThreshold: this.nextBossThreshold
                });
                
                // Скриптовый спавн бонуса на 50% HP (режим Easy)
                window.dispatchEvent(new CustomEvent('boss-spawn-aid', { 
                    detail: { distance: 150 } 
                }));
                
                console.log('[BossManager] MID_BOSS checkpoint (Easy) with scripted bonus');
            }
        }
    }

    handleBossHit(damage) {
        if (!this.boss || this.boss.isDead) return false;

        this.boss.flashHit();
        window.dispatchEvent(new CustomEvent('boss-hit'));

        const isKilled = this.boss.takeDamage(damage);
        if (isKilled) {
            this.onBossDefeated();
            return true;
        }
        return false;
    }

    onBossDefeated() {
        this.isBossActive = false;

        const dropPosition = this.boss ? this.boss.mesh.position.clone() : null;

        const finalBonus = this.scoreManager.addBossDefeatBonus(
            this.scoreManager.combo,
            this.playerNoDamage
        );
        this.scoreManager.addBossKill();

        this.checkpointManager.forceSave({ 
            type: 'POST_BOSS',
            score: this.scoreManager.score,
            combo: this.scoreManager.combo,
            lastBossScore: this.lastBossScore,
            nextBossThreshold: this.nextBossThreshold
        });
        this.checkpointManager.unlockCheckpointCreation();

        this.physics.resumeDistanceProgress();
        this._hideBossHUD();

        this.uiManager.updateHUD({ score: this.scoreManager.score });
        this.uiManager.notify('BOSS DEFEATED!', 'success', 4000);

        window.dispatchEvent(
            new CustomEvent('boss-defeated', {
                detail: { bonus: finalBonus, dropPosition }
            })
        );
        
        // Скриптовый спавн бонуса после победы (POST_BOSS)
        window.dispatchEvent(new CustomEvent('boss-spawn-aid', { 
            detail: { distance: 150 } 
        }));

        this.lastBossScore = this.scoreManager.score;
        this.nextBossThreshold = this._calculateNextBossThreshold();

        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }

        console.log(`[BossManager] Boss defeated! Next threshold: ${this.nextBossThreshold} (Current: ${this.lastBossScore})`);
    }

    _calculateNextBossThreshold() {
        const bossesKilled = this.scoreManager.bossesKilled;
        return BossConfig.calculateNextThreshold(bossesKilled);
    }

    /**
     * Загрузка из чек-поинта
     */
    loadFromCheckpoint(checkpoint) {
        if (!checkpoint) return;
        this.lastBossScore = checkpoint.lastBossScore !== undefined ? checkpoint.lastBossScore : 0;
        this.nextBossThreshold = checkpoint.nextBossThreshold !== undefined ? checkpoint.nextBossThreshold : this._firstThresholdForDifficulty(this.difficulty);
        this._preloadLogged = false;
        console.log(`[BossManager] Loaded from checkpoint: lastBossScore=${this.lastBossScore}, nextThreshold=${this.nextBossThreshold}`);
    }

    onPlayerDeath() {
        this.playerNoDamage = true;
    }

    /**
     * Смена сложности из настроек
     */
    setDifficulty(level) {
        this.difficulty = level;
        if (!this.isBossActive) {
            const thr = this._firstThresholdForDifficulty(level);
            this.nextBossThreshold = Math.max(this.scoreManager.score, thr);
        }
    }

    /**
     * @param {{ resumePhysics?: boolean }} opts — при респавне перед тем же боссом не снимать заморозку дистанции здесь
     */
    cleanup(opts = {}) {
        const resumePhysics = opts.resumePhysics !== false;
        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }
        this.isBossActive = false;
        if (resumePhysics) {
            this.physics.resumeDistanceProgress();
        }
        this.lastBossScore = 0;
        this.nextBossThreshold = this._firstThresholdForDifficulty(this.difficulty);
        this.bonusSpawnTimer = 0;
        this._preloadLogged = false;
    }
}
