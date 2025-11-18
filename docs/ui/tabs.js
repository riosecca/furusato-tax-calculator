export function initTabs(buttonSelector = '.tab-button', panelSelector = '.panel') {
    if (typeof document === 'undefined') {
        return;
    }
    const tabButtons = document.querySelectorAll(buttonSelector);
    const panels = document.querySelectorAll(panelSelector);
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
                }
                else {
                    panel.setAttribute('hidden', 'true');
                }
            });
        });
    });
}
