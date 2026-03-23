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

        this.nextBossThreshold = this._thresholdForDifficulty(difficulty);

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

    _thresholdForDifficulty(d) {
        return BossConfig.SCORE_THRESHOLD[d] ?? BossConfig.SCORE_THRESHOLD.medium;
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
                activePowerUps: this.checkpointManager.serializeActivePowerUps(player)
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

        this.uiManager.notify('WARNING: BOSS APPROACHING', 'warning', 3000);
        console.log(`[BossManager] Boss spawned at score: ${this.scoreManager.score}, threshold: ${this.nextBossThreshold}`);
    }

    _showBossHUD() {
        if (!this.boss) return;
        this.uiManager.updateHUD({
            bossHp: this.boss.hp / this.boss.maxHp,
            bossCurrentHp: this.boss.hp,
            bossMaxHp: this.boss.maxHp,
            bossName: 'GENERAL ' + (this.scoreManager.bossesKilled + 1)
        });
    }

    _hideBossHUD() {
        this.uiManager.updateHUD({ bossHp: 0 });
        this.uiManager.setBossWarning(false);
    }

    /**
     * Прогресс до босса (для UI); при ≥80% — лог прелоада
     */
    getBossProgressForUI(currentScore) {
        const target = this.nextBossThreshold;
        const ratio = target > 0 ? Math.min(1, currentScore / target) : 0;
        if (!this._preloadLogged && ratio >= BossConfig.PRELOAD_PROGRESS) {
            this._preloadLogged = true;
            console.log('[BossManager] Boss preload threshold reached (80% progress)');
        }
        return { current: currentScore, target, ratio };
    }

    updateBoss(dt, player, gameTime) {
        if (!this.boss || this.boss.isDead) return;

        this.boss.update(dt, player.position, gameTime);

        this.uiManager.updateHUD({
            bossHp: this.boss.hp / this.boss.maxHp,
            bossCurrentHp: this.boss.hp,
            bossMaxHp: this.boss.maxHp,
            bossName: 'GENERAL ' + (this.scoreManager.bossesKilled + 1)
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
                    distance: Math.floor(Math.max(0, -player.position.z))
                });
                console.log('[BossManager] MID_BOSS checkpoint (Easy)');
            }
        }
    }

    handleBossHit(damage) {
        if (!this.boss || this.boss.isDead) return false;

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

        this.checkpointManager.forceSave({ type: 'POST_BOSS' });
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

        this.nextBossThreshold += this._thresholdForDifficulty(this.difficulty);

        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }

        console.log(`[BossManager] Boss defeated! Bonus points: ${finalBonus}`);
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
            const thr = this._thresholdForDifficulty(level);
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
        this.nextBossThreshold = this._thresholdForDifficulty(this.difficulty);
        this._preloadLogged = false;
    }
}
