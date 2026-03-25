import { campaignStorage } from '../utils/campaignStorage.js';
import {
    UpgradeTree,
    getCostForLevel,
    tryPurchase,
    clampUpgradesInData
} from '../managers/UpgradeManager.js';

const ORDER = ['hull', 'weapons', 'engine', 'systems'];

/**
 * Панель дерева улучшений в ангаре (кампания).
 */
export class UpgradeUI {
    /**
     * @param {string|HTMLElement|null} root id элемента или узел
     * @param {{ onRefreshed?: () => void }} [options]
     */
    constructor(root, options = {}) {
        this.root =
            typeof root === 'string'
                ? document.getElementById(root)
                : root;
        this.onRefreshed = typeof options.onRefreshed === 'function' ? options.onRefreshed : null;
    }

    refresh() {
        if (!this.root) return;

        const data = campaignStorage.load();
        clampUpgradesInData(data);

        this.root.innerHTML = '';
        this.root.className = 'upgrade-tree';

        const title = document.createElement('h3');
        title.className = 'upgrade-tree-title';
        title.textContent = 'Улучшения';
        this.root.appendChild(title);

        const list = document.createElement('div');
        list.className = 'upgrade-tree-list';
        this.root.appendChild(list);

        for (const branchId of ORDER) {
            const node = UpgradeTree[branchId];
            if (!node) continue;

            const level = data.upgrades[branchId] || 0;
            const atMax = level >= node.maxLevel;
            const cost = atMax ? null : getCostForLevel(branchId, level);
            const canBuy = !atMax && data.totalCredits >= cost;

            const row = document.createElement('div');
            row.className = 'upgrade-row';

            const left = document.createElement('div');
            left.className = 'upgrade-row-main';
            const nameEl = document.createElement('span');
            nameEl.className = 'upgrade-branch-name';
            nameEl.textContent = node.name;
            const lvlEl = document.createElement('span');
            lvlEl.className = 'upgrade-branch-level';
            lvlEl.textContent = `${level} / ${node.maxLevel}`;
            left.appendChild(nameEl);
            left.appendChild(lvlEl);
            if (node.description) {
                const descEl = document.createElement('p');
                descEl.className = 'upgrade-branch-desc';
                descEl.textContent = node.description;
                left.appendChild(descEl);
            }

            const costEl = document.createElement('span');
            costEl.className = 'upgrade-branch-cost';
            costEl.textContent = atMax ? 'МАКС' : `${cost.toLocaleString('ru-RU')} ¤`;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'game-btn upgrade-buy-btn';
            btn.textContent = 'Купить';
            btn.disabled = !canBuy;
            btn.addEventListener('click', () => this._buy(branchId));

            row.appendChild(left);
            row.appendChild(costEl);
            row.appendChild(btn);
            list.appendChild(row);
        }
    }

    /**
     * @param {string} branchId
     */
    _buy(branchId) {
        tryPurchase(branchId);
        if (this.onRefreshed) this.onRefreshed();
    }
}
