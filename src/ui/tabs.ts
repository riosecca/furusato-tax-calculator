export function initTabs(
  buttonSelector = '.tab-button',
  panelSelector = '.panel'
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const tabButtons = document.querySelectorAll<HTMLButtonElement>(buttonSelector);
  const panels = document.querySelectorAll<HTMLElement>(panelSelector);

  if (!tabButtons.length || !panels.length) {
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;

      tabButtons.forEach((btn) => btn.classList.remove('tab-active'));
      button.classList.add('tab-active');

      if (!targetId) {
        return;
      }

      panels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', 'true');
        }
      });

      const eventDetail = { id: targetId ?? null };
      document.dispatchEvent(new CustomEvent('tab:changed', { detail: eventDetail }));
    });
  });
}

export function activateTab(
  targetId: string,
  buttonSelector = '.tab-button'
): void {
  const button = document.querySelector<HTMLButtonElement>(
    `${buttonSelector}[data-target="${targetId}"]`
  );
  button?.click();
}
