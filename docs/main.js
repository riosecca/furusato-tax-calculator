import { activateTab, initTabs } from './ui/tabs.js';
import { initSimpleSimulator } from './ui/simple-simulator.js';
import { initAdvancedSimulator } from './ui/advanced-simulator.js';
function initResultBarActions() {
    var _a;
    if (typeof document === 'undefined') {
        return;
    }
    const calcAction = document.getElementById('result-bar-calc');
    const resetAction = document.getElementById('result-bar-reset');
    const simpleCalc = document.getElementById('btn-simple-calc');
    const simpleReset = document.getElementById('btn-simple-reset');
    const advancedForm = document.getElementById('advanced-form');
    const simplePanelId = 'panel-simple';
    const advancedPanelId = 'panel-advanced';
    if (!calcAction || !resetAction) {
        return;
    }
    const updateLabels = (activePanelId) => {
        const onAdvanced = activePanelId === advancedPanelId;
        calcAction.dataset.mode = onAdvanced ? 'advanced' : 'simple';
        resetAction.dataset.mode = onAdvanced ? 'advanced' : 'simple';
        calcAction.textContent = onAdvanced
            ? '詳細シミュレーションを計算する'
            : 'かんたんシミュレーションを計算する';
        resetAction.textContent = onAdvanced
            ? '詳細シミュレーションをリセット'
            : 'かんたんシミュレーションをリセット';
    };
    calcAction.addEventListener('click', () => {
        if (calcAction.dataset.mode === 'advanced') {
            advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.requestSubmit();
        }
        else {
            simpleCalc === null || simpleCalc === void 0 ? void 0 : simpleCalc.click();
        }
        calcAction.blur();
    });
    resetAction.addEventListener('click', () => {
        if (resetAction.dataset.mode === 'advanced') {
            advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.reset();
        }
        else {
            simpleReset === null || simpleReset === void 0 ? void 0 : simpleReset.click();
        }
        resetAction.blur();
    });
    document.addEventListener('tab:changed', (event) => {
        var _a;
        const detail = event.detail;
        updateLabels((_a = detail === null || detail === void 0 ? void 0 : detail.id) !== null && _a !== void 0 ? _a : null);
    });
    const initialActive = document.querySelector('.tab-button.tab-active');
    updateLabels((_a = initialActive === null || initialActive === void 0 ? void 0 : initialActive.dataset.target) !== null && _a !== void 0 ? _a : simplePanelId);
}
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
    initResultBarActions();
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    }
    else {
        bootstrap();
    }
}
