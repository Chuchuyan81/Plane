import { campaignStorage } from '../utils/campaignStorage.js';

/** @typedef {'hull'|'weapons'|'engine'|'systems'} UpgradeBranchId */

export const UpgradeTree = {
    hull: {
        name: 'Броня',
        baseCost: 100,
        costMultiplier: 1.5,
        maxLevel: 5,
        effect: (level) => ({ maxHP: 100 + level * 20 })
    },
    weapons: {
        name: 'Орудия',
        baseCost: 150,
        costMultiplier: 1.6,
        maxLevel: 5,
        effect: (level) => ({ damage: 10 + level * 5 })
    },
    engine: {
        name: 'Двигатель',
        baseCost: 120,
        costMultiplier: 1.5,
        maxLevel: 5,
        effect: (level) => ({ dashCooldown: 5 - level * 0.5 })
    },
    systems: {
        name: 'Системы',
        baseCost: 100,
        costMultiplier: 1.4,
        maxLevel: 5,
        effect: (level) => ({ pickupRadius: 1 + level * 0.3 })
    }
};

const BRANCH_IDS = /** @type {UpgradeBranchId[]} */ (Object.keys(UpgradeTree));

/**
 * @param {UpgradeBranchId} branchId
 * @param {number} currentLevel уровень до покупки (0..maxLevel)
 * @returns {number}
 */
export function getCostForLevel(branchId, currentLevel) {
    const node = UpgradeTree[branchId];
    if (!node) return Infinity;
    const L = Math.max(0, Math.floor(currentLevel));
    return Math.round(node.baseCost * Math.pow(node.costMultiplier, L));
}

/**
 * @param {Record<string, number>} upgrades
 * @returns {{ maxHP?: number, damage?: number, dashCooldown?: number, pickupRadius?: number }}
 */
export function getStatsForUpgrades(upgrades) {
    const out = {};
    for (const id of BRANCH_IDS) {
        const node = UpgradeTree[id];
        const raw = upgrades && typeof upgrades[id] === 'number' ? upgrades[id] : 0;
        const level = Math.max(0, Math.min(node.maxLevel, Math.floor(raw)));
        Object.assign(out, node.effect(level));
    }
    return out;
}

/**
 * @param {import('../utils/campaignStorage.js').CampaignData} data
 */
export function clampUpgradesInData(data) {
    if (!data.upgrades || typeof data.upgrades !== 'object') return;
    for (const id of BRANCH_IDS) {
        const max = UpgradeTree[id].maxLevel;
        const v = Math.floor(Number(data.upgrades[id]) || 0);
        data.upgrades[id] = Math.max(0, Math.min(max, v));
    }
}

/**
 * @param {UpgradeBranchId} branchId
 * @returns {{ ok: true, totalCredits: number, upgrades: object } | { ok: false, reason: 'max'|'funds'|'unknown' }}
 */
export function tryPurchase(branchId) {
    const node = UpgradeTree[branchId];
    if (!node) return { ok: false, reason: 'unknown' };

    const data = campaignStorage.load();
    clampUpgradesInData(data);

    const key = branchId;
    const level = data.upgrades[key] || 0;
    if (level >= node.maxLevel) {
        return { ok: false, reason: 'max' };
    }

    const cost = getCostForLevel(branchId, level);
    if (data.totalCredits < cost) {
        return { ok: false, reason: 'funds' };
    }

    data.totalCredits = Math.max(0, Math.floor(data.totalCredits - cost));
    data.upgrades[key] = level + 1;
    campaignStorage.save(data);

    return { ok: true, totalCredits: data.totalCredits, upgrades: { ...data.upgrades } };
}
