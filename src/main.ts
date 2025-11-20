import { activateTab, initTabs } from './ui/tabs.js';
import { initSimpleSimulator } from './ui/simple-simulator.js';
import { initAdvancedSimulator } from './ui/advanced-simulator.js';

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
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
