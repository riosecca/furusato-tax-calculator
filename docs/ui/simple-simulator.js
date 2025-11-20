import { formatYen } from '../utils/currency.js';
import { loadSimpleSessionState, saveSimpleSessionState, } from '../storage/session.js';
const DEFAULT_SELECTIONS = {
    family: 'couple-child',
    income: '700',
};
const baseEstimates = {
    150: 12000,
    200: 19000,
    300: 28000,
    400: 42000,
    500: 61000,
    600: 77000,
    700: 106000,
    800: 133000,
    900: 150000,
    1000: 176000,
    1200: 210000,
    1500: 300000,
    2000: 420000,
    3000: 620000,
    5000: 1050000,
    10000: 2100000,
    20000: 4200000,
    30000: 6300000,
};
const familyAdjustments = {
    single: 0,
    couple: -5000,
    'couple-child': -15000,
    extended: -8000,
};
const MAN_YEN = 10000;
const BASIC_DEDUCTION = 480000;
const SPOUSE_DEDUCTION = 380000;
const DEPENDENT_DEDUCTION = 380000;
const NON_TAXABLE_THRESHOLD = 10000;
const SOCIAL_INSURANCE_ESTIMATES = [
    { max: 2000000, rate: 0.24 },
    { max: 4000000, rate: 0.2 },
    { max: 7000000, rate: 0.18 },
    { max: Number.POSITIVE_INFINITY, rate: 0.16 },
];
const defaultSimpleState = {
    family: DEFAULT_SELECTIONS.family,
    income: DEFAULT_SELECTIONS.income,
    oneStop: false,
    largeDeduction: false,
};
export function initSimpleSimulator() {
    var _a;
    if (typeof document === 'undefined') {
        return;
    }
    const calcButton = document.getElementById('btn-simple-calc');
    const resetButton = document.getElementById('btn-simple-reset');
    const resultValueTargets = document.querySelectorAll('[data-simple-result="value"]');
    const resultDetailTargets = document.querySelectorAll('[data-simple-result="detail"]');
    const resultNoteTargets = document.querySelectorAll('[data-simple-result="note"]');
    if (!resultValueTargets.length || !resultNoteTargets.length) {
        return;
    }
    const getSelectedInput = (name) => document.querySelector(`input[name="${name}"]:checked`);
    const getSelectedValue = (name) => { var _a, _b; return (_b = (_a = getSelectedInput(name)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null; };
    const setRadioValue = (name, value) => {
        const target = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (target) {
            target.checked = true;
        }
    };
    const setCheckboxValue = (name, checked) => {
        const target = document.querySelector(`input[name="${name}"]`);
        if (target) {
            target.checked = checked;
        }
    };
    const updateResultCard = ({ amount, detail }) => {
        resultValueTargets.forEach((target) => {
            target.textContent = amount;
        });
        resultDetailTargets.forEach((target) => {
            target.textContent = detail !== null && detail !== void 0 ? detail : '';
            target.toggleAttribute('data-empty', !detail);
        });
        resultNoteTargets.forEach((target) => {
            target.textContent = 'あなたの控除上限額（目安）は';
        });
    };
    const applyStateToInputs = (state) => {
        setRadioValue('family', state.family);
        setRadioValue('income', state.income);
        setCheckboxValue('one-stop', state.oneStop);
        setCheckboxValue('large-deduction', state.largeDeduction);
    };
    const hasSpouseDeduction = (family) => family === 'couple' || family === 'couple-child';
    const hasDependentDeduction = (family) => family === 'couple-child';
    const toAnnualIncome = (selection) => {
        const numericValue = Number(selection);
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            return 0;
        }
        return numericValue * MAN_YEN;
    };
    const getSalaryDeduction = (annualIncome) => {
        if (annualIncome <= 0) {
            return 0;
        }
        if (annualIncome <= 1625000) {
            return 550000;
        }
        if (annualIncome <= 1800000) {
            return annualIncome * 0.4 - 100000;
        }
        if (annualIncome <= 3600000) {
            return annualIncome * 0.3 + 80000;
        }
        if (annualIncome <= 6600000) {
            return annualIncome * 0.2 + 440000;
        }
        if (annualIncome <= 8500000) {
            return annualIncome * 0.1 + 1100000;
        }
        return 1950000;
    };
    const calculateSalaryIncome = (annualIncome) => {
        const deduction = getSalaryDeduction(annualIncome);
        return Math.max(annualIncome - deduction, 0);
    };
    const estimateSocialInsurance = (annualIncome) => {
        var _a;
        const bracket = (_a = SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max)) !== null && _a !== void 0 ? _a : SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1];
        return Math.max(Math.round(annualIncome * bracket.rate), 0);
    };
    const calculateResidentTaxableIncome = (family, annualIncome) => {
        const salaryIncome = calculateSalaryIncome(annualIncome);
        const socialInsurance = estimateSocialInsurance(annualIncome);
        const deductions = BASIC_DEDUCTION +
            socialInsurance +
            (hasSpouseDeduction(family) ? SPOUSE_DEDUCTION : 0) +
            (hasDependentDeduction(family) ? DEPENDENT_DEDUCTION : 0);
        return salaryIncome - deductions;
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
        const stateToSave = {
            family: selectedFamily,
            income: selectedIncome,
            oneStop: hasOneStop,
            largeDeduction: hasLargeDeduction,
        };
        saveSimpleSessionState(stateToSave);
        const annualIncome = toAnnualIncome(selectedIncome);
        const taxableIncome = calculateResidentTaxableIncome(selectedFamily, annualIncome);
        if (taxableIncome <= NON_TAXABLE_THRESHOLD) {
            updateResultCard({
                amount: formatYen(0),
                detail: '住民税が非課税ラインのため、上限額は0円です。',
            });
            return;
        }
        const incomeBase = (_a = baseEstimates[selectedIncome]) !== null && _a !== void 0 ? _a : 0;
        const adjustment = (_b = familyAdjustments[selectedFamily]) !== null && _b !== void 0 ? _b : 0;
        const deductionHit = hasLargeDeduction ? 8000 : 0;
        const oneStopBonus = hasOneStop ? 2000 : 0;
        const estimated = incomeBase + adjustment - deductionHit + oneStopBonus;
        updateResultCard({
            amount: formatYen(estimated),
        });
    }
    calcButton === null || calcButton === void 0 ? void 0 : calcButton.addEventListener('click', runSimpleSimulation);
    document
        .querySelectorAll('input[name="family"], input[name="income"], input[name="one-stop"], input[name="large-deduction"]')
        .forEach((element) => {
        element.addEventListener('change', runSimpleSimulation);
    });
    resetButton === null || resetButton === void 0 ? void 0 : resetButton.addEventListener('click', () => {
        applyStateToInputs(defaultSimpleState);
        runSimpleSimulation();
    });
    const savedState = (_a = loadSimpleSessionState()) !== null && _a !== void 0 ? _a : defaultSimpleState;
    applyStateToInputs(savedState);
    runSimpleSimulation();
}
