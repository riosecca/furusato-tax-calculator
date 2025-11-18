import { formatYen } from '../utils/currency.js';
const DEFAULT_SELECTIONS = {
    family: 'couple-child',
    income: '700',
};
const baseEstimates = {
    150: 12000,
    200: 19000,
    300: 28000,
    400: 42000,
    700: 106000,
    1000: 176000,
    1200: 210000,
};
const familyAdjustments = {
    single: 0,
    couple: -5000,
    'couple-child': -15000,
    extended: -8000,
};
export function initSimpleSimulator() {
    if (typeof document === 'undefined') {
        return;
    }
    const calcButton = document.getElementById('btn-simple-calc');
    const resetButton = document.getElementById('btn-simple-reset');
    const resultValue = document.getElementById('result-value');
    const resultDetail = document.getElementById('result-detail');
    const resultNote = document.getElementById('result-note');
    if (!resultValue || !resultDetail || !resultNote) {
        return;
    }
    const getSelectedInput = (name) => document.querySelector(`input[name="${name}"]:checked`);
    const getSelectedValue = (name) => { var _a, _b; return (_b = (_a = getSelectedInput(name)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null; };
    const getSelectedLabelText = (input) => {
        var _a, _b;
        if (!input) {
            return '';
        }
        const label = input.closest('label');
        return label ? (_b = (_a = label.textContent) === null || _a === void 0 ? void 0 : _a.trim().replace(/\s+/g, ' ')) !== null && _b !== void 0 ? _b : '' : '';
    };
    const updateResultCard = ({ amount, detail }) => {
        resultValue.textContent = amount;
        resultDetail.textContent = detail !== null && detail !== void 0 ? detail : '';
        resultNote.textContent = 'あなたの控除上限額（目安）は';
    };
    const applyDefaultSelections = () => {
        document
            .querySelectorAll('input[type="radio"], input[type="checkbox"]')
            .forEach((element) => {
            const isFamilyDefault = element.name === 'family' && element.value === DEFAULT_SELECTIONS.family;
            const isIncomeDefault = element.name === 'income' && element.value === DEFAULT_SELECTIONS.income;
            if (element.type === 'checkbox') {
                element.checked = false;
            }
            else if (element.type === 'radio') {
                element.checked = isFamilyDefault || isIncomeDefault;
            }
        });
        runSimpleSimulation();
    };
    function runSimpleSimulation() {
        var _a, _b;
        const selectedFamily = getSelectedValue('family');
        const selectedIncome = getSelectedValue('income');
        const hasOneStop = Boolean(document.querySelector('input[name="one-stop"]:checked'));
        const hasLargeDeduction = Boolean(document.querySelector('input[name="large-deduction"]:checked'));
        if (!selectedFamily || !selectedIncome) {
            updateResultCard({
                amount: '−円',
                detail: '条件を選択してください',
            });
            return;
        }
        const incomeBase = (_a = baseEstimates[selectedIncome]) !== null && _a !== void 0 ? _a : 0;
        const adjustment = (_b = familyAdjustments[selectedFamily]) !== null && _b !== void 0 ? _b : 0;
        const deductionHit = hasLargeDeduction ? 8000 : 0;
        const oneStopBonus = hasOneStop ? 2000 : 0;
        const estimated = incomeBase + adjustment - deductionHit + oneStopBonus;
        const incomeLabel = getSelectedLabelText(getSelectedInput('income'));
        const familyLabel = getSelectedLabelText(getSelectedInput('family'));
        updateResultCard({
            amount: formatYen(estimated),
            detail: '',
        });
    }
    calcButton === null || calcButton === void 0 ? void 0 : calcButton.addEventListener('click', runSimpleSimulation);
    document
        .querySelectorAll('input[name="family"], input[name="income"], input[name="one-stop"], input[name="large-deduction"]')
        .forEach((element) => {
        element.addEventListener('change', runSimpleSimulation);
    });
    resetButton === null || resetButton === void 0 ? void 0 : resetButton.addEventListener('click', applyDefaultSelections);
    applyDefaultSelections();
}
