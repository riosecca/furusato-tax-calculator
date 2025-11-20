import { activateTab, initTabs } from './ui/tabs.js';
import { initSimpleSimulator } from './ui/simple-simulator.js';
import { initAdvancedSimulator } from './ui/advanced-simulator.js';
function initTabToggleCta() {
    var _a;
    if (typeof document === 'undefined') {
        return;
    }
    const cta = document.querySelector('[data-role="tab-toggle-cta"]');
    const simplePanelId = 'panel-simple';
    const advancedPanelId = 'panel-advanced';
    if (!cta) {
        return;
    }
    const updateCta = (activePanelId) => {
        const onAdvanced = activePanelId === advancedPanelId;
        cta.textContent = onAdvanced ? '簡易シミュレーションに進む' : '詳細シミュレーションに進む';
        cta.dataset.nextTab = onAdvanced ? simplePanelId : advancedPanelId;
    };
    cta.addEventListener('click', (event) => {
        var _a;
        event.preventDefault();
        const targetId = (_a = cta.dataset.nextTab) !== null && _a !== void 0 ? _a : advancedPanelId;
        activateTab(targetId);
        cta.blur();
    });
    document.addEventListener('tab:changed', (event) => {
        var _a;
        const detail = event.detail;
        updateCta((_a = detail === null || detail === void 0 ? void 0 : detail.id) !== null && _a !== void 0 ? _a : null);
    });
    const initialActive = document.querySelector('.tab-button.tab-active');
    updateCta((_a = initialActive === null || initialActive === void 0 ? void 0 : initialActive.dataset.target) !== null && _a !== void 0 ? _a : null);
}
function bootstrap() {
    initTabs();
    initSimpleSimulator();
    initAdvancedSimulator();
    initTabToggleCta();
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    }
    else {
        bootstrap();
    }
}
