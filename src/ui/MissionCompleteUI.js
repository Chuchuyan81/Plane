/**
 * Экран завершения миссии кампании (статистика и возврат в ангар).
 */
export class MissionCompleteUI {
    /**
     * @param {object} ids id элементов разметки
     */
    constructor(ids = {}) {
        this.root = typeof ids.root === 'string' ? document.getElementById(ids.root) : ids.root;
        this.elTitle = this._el(ids.title, 'missionCompleteTitle');
        this.elStars = this._el(ids.stars, 'missionCompleteStars');
        this.elScore = this._el(ids.score, 'missionCompleteScore');
        this.elKills = this._el(ids.kills, 'missionCompleteKills');
        this.elCombo = this._el(ids.combo, 'missionCompleteCombo');
        this.elBaseCredits = this._el(ids.baseCredits, 'missionCompleteBaseCredits');
        this.elComboBonus = this._el(ids.comboBonus, 'missionCompleteComboBonus');
        this.elCredits = this._el(ids.credits, 'missionCompleteCredits');
        this.elTotalCredits = this._el(ids.totalCredits, 'missionCompleteTotalCredits');
        this.btnHangar = this._el(ids.btnHangar, 'btnMissionCompleteHangar');
        this._hangarHandler = null;
        if (this.btnHangar) {
            this.btnHangar.addEventListener('click', () => {
                if (typeof this._hangarHandler === 'function') this._hangarHandler();
            });
        }
    }

    _el(ref, fallbackId) {
        if (ref && typeof ref === 'string') return document.getElementById(ref);
        if (ref && ref.nodeType === 1) return ref;
        return document.getElementById(fallbackId);
    }

    /**
     * @param {( ) => void} fn
     */
    onHangar(fn) {
        this._hangarHandler = fn;
    }

    /**
     * @param {object} data
     */
    show(data) {
        if (this.root) this.root.style.display = 'flex';
        if (this.elTitle) this.elTitle.textContent = data.title || 'Миссия';
        const stars = Math.min(3, Math.max(1, Number(data.stars) || 1));
        if (this.elStars) this.elStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        if (this.elScore) this.elScore.textContent = Number(data.score || 0).toLocaleString('ru-RU');
        if (this.elKills) this.elKills.textContent = Number(data.kills ?? 0).toLocaleString('ru-RU');
        if (this.elCombo) {
            const c = data.combo != null ? Number(data.combo).toFixed(1) : '—';
            this.elCombo.textContent = c;
        }
        if (this.elBaseCredits) {
            this.elBaseCredits.textContent = Number(data.baseCredits ?? 0).toLocaleString('ru-RU');
        }
        if (this.elComboBonus) {
            this.elComboBonus.textContent = Number(data.comboBonus ?? 0).toLocaleString('ru-RU');
        }
        if (this.elCredits) {
            this.elCredits.textContent = Number(data.creditsEarned ?? 0).toLocaleString('ru-RU');
        }
        if (this.elTotalCredits) {
            this.elTotalCredits.textContent = Number(data.totalCredits ?? 0).toLocaleString('ru-RU');
        }
    }

    hide() {
        if (this.root) this.root.style.display = 'none';
    }
}
