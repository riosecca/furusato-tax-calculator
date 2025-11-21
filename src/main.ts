import { activateTab, initTabs } from './ui/tabs.js';
import { initSimpleSimulator } from './ui/simple-simulator.js';
import { initAdvancedSimulator } from './ui/advanced-simulator.js';

function initResultBarActions(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const calcAction = document.getElementById(
    'result-bar-calc'
  ) as HTMLButtonElement | null;
  const resetAction = document.getElementById(
    'result-bar-reset'
  ) as HTMLButtonElement | null;
  const simpleCalc = document.getElementById(
    'btn-simple-calc'
  ) as HTMLButtonElement | null;
  const simpleReset = document.getElementById(
    'btn-simple-reset'
  ) as HTMLButtonElement | null;
  const advancedForm = document.getElementById(
    'advanced-form'
  ) as HTMLFormElement | null;
  const simplePanelId = 'panel-simple';
  const advancedPanelId = 'panel-advanced';

  if (!calcAction || !resetAction) {
    return;
  }

  const updateLabels = (activePanelId: string | null) => {
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
      advancedForm?.requestSubmit();
    } else {
      simpleCalc?.click();
    }
    calcAction.blur();
  });

  resetAction.addEventListener('click', () => {
    if (resetAction.dataset.mode === 'advanced') {
      advancedForm?.reset();
    } else {
      simpleReset?.click();
    }
    resetAction.blur();
  });

  document.addEventListener('tab:changed', (event) => {
    const detail = (event as CustomEvent<{ id: string | null }>).detail;
    updateLabels(detail?.id ?? null);
  });

  const initialActive = document.querySelector<HTMLButtonElement>('.tab-button.tab-active');
  updateLabels(initialActive?.dataset.target ?? simplePanelId);
}

function initTabToggleCta(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const cta = document.querySelector<HTMLAnchorElement>(
    '[data-role="tab-toggle-cta"]'
  );
  const simplePanelId = 'panel-simple';
  const advancedPanelId = 'panel-advanced';

  if (!cta) {
    return;
  }

  const updateCta = (activePanelId: string | null) => {
    const onAdvanced = activePanelId === advancedPanelId;
    cta.textContent = onAdvanced ? '簡易シミュレーションに進む' : '詳細シミュレーションに進む';
    cta.dataset.nextTab = onAdvanced ? simplePanelId : advancedPanelId;
  };

  cta.addEventListener('click', (event) => {
    event.preventDefault();
    const targetId = cta.dataset.nextTab ?? advancedPanelId;
    activateTab(targetId);
    cta.blur();
  });

  document.addEventListener('tab:changed', (event) => {
    const detail = (event as CustomEvent<{ id: string | null }>).detail;
    updateCta(detail?.id ?? null);
  });

  const initialActive = document.querySelector<HTMLButtonElement>('.tab-button.tab-active');
  updateCta(initialActive?.dataset.target ?? null);
}

function bootstrap(): void {
  initTabs();
  initSimpleSimulator();
  initAdvancedSimulator();
  initTabToggleCta();
  initResultBarActions();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
