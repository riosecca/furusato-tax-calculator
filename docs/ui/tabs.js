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
            const eventDetail = { id: targetId !== null && targetId !== void 0 ? targetId : null };
            document.dispatchEvent(new CustomEvent('tab:changed', { detail: eventDetail }));
        });
    });
}
export function activateTab(targetId, buttonSelector = '.tab-button') {
    const button = document.querySelector(`${buttonSelector}[data-target="${targetId}"]`);
    button === null || button === void 0 ? void 0 : button.click();
}
