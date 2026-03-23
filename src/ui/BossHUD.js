export class BossHUD {
    constructor() {
        this.container = document.getElementById('boss-hp-container');
        this.bar = document.getElementById('boss-hp-bar');
        this.nameText = document.getElementById('boss-name-text');
        this.currentHP = document.getElementById('boss-hp-current');
        this.maxHP = document.getElementById('boss-hp-max');
        this.warning = document.getElementById('boss-warning');
        
        this.isVisible = false;
    }

    /**
     * Показать HUD босса
     */
    show(bossName, maxHp) {
        if (!this.container) return;
        
        this.isVisible = true;
        this.container.style.display = 'block';
        
        if (this.nameText) this.nameText.innerText = bossName.toUpperCase();
        if (this.currentHP) this.currentHP.innerText = Math.round(maxHp);
        if (this.maxHP) this.maxHP.innerText = Math.round(maxHp);
        
        this.update(1.0, maxHp, maxHp);
    }

    /**
     * Скрыть HUD босса
     */
    hide() {
        if (!this.container) return;
        
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.warning) this.warning.style.display = 'none';
    }

    /**
     * Обновить полосу здоровья
     */
    update(percent, current, max) {
        if (!this.bar) return;
        
        this.bar.style.width = `${percent * 100}%`;
        
        if (this.currentHP) this.currentHP.innerText = Math.round(current);
        if (this.maxHP) this.maxHP.innerText = Math.round(max);
        
        // Пульсация при низком здоровье (50%)
        if (percent <= 0.5) {
            this.bar.classList.add('pulse');
        } else {
            this.bar.classList.remove('pulse');
        }
    }

    /**
     * Показать предупреждение
     */
    showWarning() {
        if (!this.warning) return;
        
        this.warning.style.display = 'block';
        
        setTimeout(() => {
            this.warning.style.display = 'none';
        }, 3000);
    }
}
