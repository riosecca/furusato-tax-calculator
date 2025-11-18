import { initTabs } from './ui/tabs.js';
import { initSimpleSimulator } from './ui/simple-simulator.js';
import { initAdvancedSimulator } from './ui/advanced-simulator.js';

function bootstrap(): void {
  initTabs();
  initSimpleSimulator();
  initAdvancedSimulator();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
