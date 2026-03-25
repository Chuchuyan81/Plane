import { campaignStorage } from '../utils/campaignStorage.js';
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

        /** Базовый счёт после последней победы над боссом (начало интервала до следующего) */
        this.lastBossScore = 0;
        /** Абсолютный счёт, при достижении которого появляется следующий босс */
        this.nextBossThreshold = this._firstThresholdForDifficulty(difficulty);
        this.bonusSpawnTimer = 0;

        this.playerNoDamage = true;
        this._preloadLogged = false;

        /** @type {import('../config/MissionConfig.js').MissionDefinition|null} */
        this.campaignMissionConfig = null;

        /** Между смертельным попаданием и onBossDefeated (взрыв) — не показывать полосу «до босса» */
        this._bossVictoryPending = false;

        /** id миссии кампании на момент смертельного попадания (колбэк взрыва позже) */
        this._victoryCampaignMissionId = null;
    }

    /**
     * Связь с RespawnManager (после создания, т.к. циклическая зависимость)
     * @param {import('./RespawnManager.js').RespawnManager} rm
     */
    attachRespawnManager(rm) {
        this._respawnManager = rm;
    }

    /**
     * Режим кампании: один босс на миссию, порог очков из конфига.
     * @param {import('../config/MissionConfig.js').MissionDefinition} mission
     */
    setCampaignMission(mission) {
        this.campaignMissionConfig = mission;
        this.lastBossScore = 0;
        this.nextBossThreshold = mission.bossScoreThreshold;
        this._preloadLogged = false;
    }

    clearCampaignMission() {
        this.campaignMissionConfig = null;
        this.nextBossThreshold = this._firstThresholdForDifficulty(this.difficulty);
        this.lastBossScore = 0;
        this._preloadLogged = false;
        this._victoryCampaignMissionId = null;
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

    /** Доля прогресса в текущем интервале между боссами (0..1) */
    _bossProgressRatio(currentScore) {
        const span = this.nextBossThreshold - this.lastBossScore;
        if (span <= 0) return 1;
        const t = (currentScore - this.lastBossScore) / span;
        return Math.max(0, Math.min(1, t));
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

        const bossKillIndex = this.campaignMissionConfig ? 0 : this.scoreManager.bossesKilled;
        const missionHpMult = this.campaignMissionConfig
            ? this.campaignMissionConfig.bossHPMultiplier
            : 1;
        this.boss = new Boss(scene, this.difficulty, bossKillIndex, player.position, {
            missionHpMultiplier: missionHpMult,
            useCampaignBossHp: !!this.campaignMissionConfig
        });

        if (savedBossHp !== null && savedBossHp !== undefined) {
            this.boss.hp = savedBossHp;
            this.boss.halfHpSaved = savedBossHp <= this.boss.maxHp * 0.5;
        }

        this.uiManager.setBossWarning(true);
        this._showBossHUD();

        this.bonusSpawnTimer = 0; // Сброс таймера бонусов при начале боя

        this.uiManager.notify('Босс!', 'warning', 2800);
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
        if (this._bossVictoryPending) {
            const target = this.nextBossThreshold;
            const baseline = this.lastBossScore;
            this.uiManager.setBossWarning(false);
            this.uiManager.updateHUD({
                bossProgress: currentScore,
                bossThreshold: target,
                bossProgressBaseline: baseline,
                isBossActive: false,
                showBossProgressBar: false,
                bossHp: 0
            });
            return {
                current: currentScore,
                target,
                ratio: 0,
                currentRelative: currentScore,
                targetRelative: target
            };
        }

        const target = this.nextBossThreshold;
        const baseline = this.lastBossScore;
        const span = Math.max(1, target - baseline);
        const gained = Math.max(0, currentScore - baseline);
        const ratioInInterval = gained / span;

        const warnDist = BossConfig.WARNING_THRESHOLD || 500;
        const progressFrom = BossConfig.BOSS_PROGRESS_BAR_FROM ?? 0.78;

        if (!this.isBossActive) {
            const inApproachZone =
                currentScore > baseline &&
                currentScore < target &&
                target - currentScore <= warnDist &&
                ratioInInterval >= progressFrom;
            if (inApproachZone) {
                this.uiManager.setBossWarning(true);
            } else {
                this.uiManager.setBossWarning(false);
            }
        }

        if (
            !this._preloadLogged &&
            !this.isBossActive &&
            ratioInInterval >= BossConfig.PRELOAD_PROGRESS &&
            currentScore < target
        ) {
            this._preloadLogged = true;
            console.log('[BossManager] Boss preload threshold reached (80% progress)');
        }

        const showBossProgressBar =
            !this.isBossActive &&
            currentScore > baseline &&
            currentScore < target &&
            ratioInInterval >= progressFrom;

        const payload = {
            bossProgress: currentScore,
            bossThreshold: target,
            bossProgressBaseline: baseline,
            isBossActive: this.isBossActive,
            showBossProgressBar
        };
        if (!this.isBossActive) {
            payload.bossHp = 0;
        }
        this.uiManager.updateHUD(payload);

        const ratio = target > 0 ? Math.min(1, currentScore / target) : 0;
        return {
            current: currentScore,
            target,
            ratio,
            currentRelative: currentScore,
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

        const isKilled = this.boss.takeDamage(damage);
        window.dispatchEvent(new CustomEvent('boss-hit'));

        if (isKilled) {
            this._victoryCampaignMissionId = this.campaignMissionConfig ? this.campaignMissionConfig.id : null;
            this._bossVictoryPending = true;
            this.isBossActive = false;
            this._hideBossHUD();
            window.dispatchEvent(new CustomEvent('skyace-combat-mute', { detail: { muted: true } }));
            this.boss.playDestructionExplosion(() => {
                this.onBossDefeated();
            });
            return true;
        }
        return false;
    }

    onBossDefeated() {
        const missionId =
            this._victoryCampaignMissionId != null
                ? this._victoryCampaignMissionId
                : this.campaignMissionConfig?.id ?? null;
        this._victoryCampaignMissionId = null;

        if (missionId != null) {
            this._onCampaignBossDefeated(missionId);
            return;
        }
        this._onEndlessBossDefeated();
    }

    /**
     * @param {number} missionId
     */
    _onCampaignBossDefeated(missionId) {
        const dropPosition = this.boss ? this.boss.mesh.position.clone() : null;

        const finalBonus = this.scoreManager.addBossDefeatBonus(
            this.scoreManager.combo,
            this.playerNoDamage
        );
        this.scoreManager.addBossKill();

        const endMissionResult = this.scoreManager.endMission(
            missionId,
            this.scoreManager.score,
            this.scoreManager.combo,
            this.scoreManager.kills
        );
        const persist = campaignStorage.recordMissionComplete(missionId, {
            stars: endMissionResult.stars,
            score: endMissionResult.score,
            creditsAwarded: endMissionResult.credits
        });

        this.checkpointManager.forceSave({
            type: 'POST_BOSS',
            score: this.scoreManager.score,
            combo: this.scoreManager.combo,
            lastBossScore: this.lastBossScore,
            nextBossThreshold: this.nextBossThreshold
        });
        this.checkpointManager.unlockCheckpointCreation();

        this.physics.resumeDistanceProgress();

        this.uiManager.updateHUD({ score: this.scoreManager.score });
        this.uiManager.notify('Миссия выполнена!', 'success', 4000);
        window.dispatchEvent(new CustomEvent('skyace-boss-victory-sfx', { detail: { campaign: true } }));

        window.dispatchEvent(
            new CustomEvent('boss-defeated', {
                detail: { bonus: finalBonus, dropPosition }
            })
        );

        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }

        window.dispatchEvent(
            new CustomEvent('campaign-boss-defeated', {
                detail: {
                    missionId,
                    score: this.scoreManager.score,
                    playerNoDamage: this.playerNoDamage,
                    maxCombo: this.scoreManager.maxCombo,
                    combo: this.scoreManager.combo,
                    kills: this.scoreManager.kills,
                    creditsEarned: persist.creditsEarned,
                    totalCredits: persist.totalCredits,
                    endMission: endMissionResult
                }
            })
        );

        console.log(`[BossManager] Campaign boss defeated, mission ${missionId}`);
        this._bossVictoryPending = false;
    }

    _onEndlessBossDefeated() {
        const dropPosition = this.boss ? this.boss.mesh.position.clone() : null;

        const finalBonus = this.scoreManager.addBossDefeatBonus(
            this.scoreManager.combo,
            this.playerNoDamage
        );
        this.scoreManager.addBossKill();

        // Интервал до следующего босса считается от счёта ПОСЛЕ бонуса; порог — абсолютный
        this.lastBossScore = this.scoreManager.score;
        const interval = BossConfig.calculateNextThreshold(this.scoreManager.bossesKilled);
        this.nextBossThreshold = this.lastBossScore + interval;
        this._preloadLogged = false;

        this.checkpointManager.forceSave({
            type: 'POST_BOSS',
            score: this.scoreManager.score,
            combo: this.scoreManager.combo,
            lastBossScore: this.lastBossScore,
            nextBossThreshold: this.nextBossThreshold
        });
        this.checkpointManager.unlockCheckpointCreation();

        this.physics.resumeDistanceProgress();

        this.uiManager.updateHUD({ score: this.scoreManager.score });
        this.uiManager.notify('Победа над боссом!', 'success', 4000);
        window.dispatchEvent(new CustomEvent('skyace-boss-victory-sfx', { detail: { campaign: false } }));

        window.dispatchEvent(
            new CustomEvent('boss-defeated', {
                detail: { bonus: finalBonus, dropPosition }
            })
        );

        window.dispatchEvent(new CustomEvent('boss-spawn-aid', {
            detail: { distance: 150 }
        }));

        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }

        console.log(`[BossManager] Boss defeated! Next boss at score: ${this.nextBossThreshold} (+${interval} from ${this.lastBossScore})`);
        this._bossVictoryPending = false;
    }

    /**
     * Загрузка из чек-поинта
     */
    loadFromCheckpoint(checkpoint) {
        if (!checkpoint) return;
        this.lastBossScore = checkpoint.lastBossScore !== undefined ? checkpoint.lastBossScore : 0;
        this.nextBossThreshold = checkpoint.nextBossThreshold !== undefined ? checkpoint.nextBossThreshold : this._firstThresholdForDifficulty(this.difficulty);
        this._preloadLogged = false;

        if (this.campaignMissionConfig) {
            console.log(`[BossManager] Campaign checkpoint restore: lastBossScore=${this.lastBossScore}, nextThreshold=${this.nextBossThreshold}`);
            return;
        }

        // Старые сохранения: порог был «накопительным» (5000, 7500…), счёт уже выше — выровнять интервал
        if (this.scoreManager.score >= this.nextBossThreshold) {
            const interval = BossConfig.calculateNextThreshold(this.scoreManager.bossesKilled);
            this.lastBossScore = this.scoreManager.score;
            this.nextBossThreshold = this.lastBossScore + interval;
        }

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
            const interval = BossConfig.calculateNextThreshold(this.scoreManager.bossesKilled);
            this.nextBossThreshold = this.lastBossScore + interval;
            if (this.scoreManager.score >= this.nextBossThreshold) {
                this.nextBossThreshold = this.scoreManager.score + interval;
            }
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
        this._bossVictoryPending = false;
        this._victoryCampaignMissionId = null;
    }
}
