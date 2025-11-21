import { formatYen } from '../utils/currency.js';
import { loadAdvancedSessionState, saveAdvancedSessionState, } from '../storage/session.js';
import { loadSimpleSessionState } from '../storage/session.js';
import { defaultSimpleState, MAN_YEN, SOCIAL_INSURANCE_ESTIMATES } from './simple-simulator.js';
const ADV_BASIC_DEDUCTION = 480000;
const ADV_SPOUSE_DEDUCTION = 380000;
const ADV_DEPENDENT_DEDUCTION = 380000;
const ADV_DISABLED_GENERAL = 270000;
const ADV_DISABLED_SPECIAL = 400000;
const ADV_TAX_BRACKETS = [
    { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
    { min: 1950000, max: 3300000, rate: 0.1, deduction: 97500 },
    { min: 3300000, max: 6950000, rate: 0.2, deduction: 427500 },
    { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
    { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
    { min: 18000000, max: 40000000, rate: 0.4, deduction: 2796000 },
    { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 },
];
const ADVANCED_INPUT_IDS = [
    'adv-income',
    'adv-spouse-income',
    'adv-listed',
    'adv-unlisted',
    'adv-has-spouse',
    'adv-family-type',
    'adv-dependents',
    'adv-disabled',
    'adv-special-self',
    'adv-special-other',
    'adv-social',
    'adv-small-enterprise',
    'adv-life',
    'adv-earthquake',
    'adv-medical',
    'adv-housing',
];
const ADVANCED_MONEY_INPUT_IDS = [
    'adv-income',
    'adv-spouse-income',
    'adv-listed',
    'adv-unlisted',
    'adv-social',
    'adv-small-enterprise',
    'adv-life',
    'adv-earthquake',
    'adv-medical',
    'adv-housing',
];
const ADVANCED_MONEY_INPUT_ID_SET = new Set(ADVANCED_MONEY_INPUT_IDS);
const ADVANCED_DEFAULT_BASE = {
    'adv-income': '7000000',
    'adv-spouse-income': '0',
    'adv-listed': '0',
    'adv-unlisted': '0',
    'adv-has-spouse': 'has',
    'adv-family-type': 'couple',
    'adv-dependents': '1',
    'adv-disabled': '0',
    'adv-special-self': '0',
    'adv-special-other': '0',
    'adv-social': '1260000',
    'adv-small-enterprise': '0',
    'adv-life': '0',
    'adv-earthquake': '0',
    'adv-medical': '0',
    'adv-housing': '0',
};
function isAdvancedInput(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLSelectElement;
}
function buildAdvancedDefaults(simpleState) {
    var _a, _b;
    const defaults = Object.assign({}, ADVANCED_DEFAULT_BASE);
    const incomeSelection = Number((_a = simpleState === null || simpleState === void 0 ? void 0 : simpleState.income) !== null && _a !== void 0 ? _a : defaultSimpleState.income);
    const annualIncome = Number.isFinite(incomeSelection)
        ? Math.max(Math.round(incomeSelection * MAN_YEN), 0)
        : Number(defaults['adv-income']);
    defaults['adv-income'] = String(annualIncome);
    const socialBracket = (_b = SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max)) !== null && _b !== void 0 ? _b : SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1];
    defaults['adv-social'] = String(Math.max(Math.round(annualIncome * socialBracket.rate), 0));
    const family = simpleState === null || simpleState === void 0 ? void 0 : simpleState.family;
    if (family) {
        const hasSpouse = family !== 'single';
        const hasDependents = family === 'couple-child' || family === 'extended';
        defaults['adv-has-spouse'] = hasSpouse ? 'has' : 'none';
        defaults['adv-spouse-income'] = hasSpouse ? '0' : '';
        defaults['adv-family-type'] =
            family === 'couple' || family === 'couple-child' ? 'couple' : 'none';
        defaults['adv-dependents'] = hasDependents ? '1' : '0';
    }
    return defaults;
}
function buildAdvancedPreset(simpleState) {
    var _a;
    if (!simpleState) {
        return {};
    }
    const income = Number(simpleState.income);
    const annualIncome = Number.isFinite(income) ? Math.max(Math.round(income * MAN_YEN), 0) : null;
    const hasSpouse = simpleState.family !== 'single';
    const hasDependents = simpleState.family === 'couple-child' || simpleState.family === 'extended';
    const socialBracket = annualIncome !== null
        ? (_a = SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max)) !== null && _a !== void 0 ? _a : SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1]
        : null;
    const estimatedSocial = annualIncome !== null && socialBracket
        ? Math.max(Math.round(annualIncome * socialBracket.rate), 0)
        : null;
    return {
        'adv-income': annualIncome !== null ? String(annualIncome) : '',
        'adv-spouse-income': hasSpouse ? '0' : '',
        'adv-has-spouse': hasSpouse ? 'has' : 'none',
        'adv-family-type': simpleState.family === 'couple' || simpleState.family === 'couple-child' ? 'couple' : 'none',
        'adv-dependents': hasDependents ? '1' : '0',
        'adv-social': estimatedSocial !== null ? String(estimatedSocial) : '',
    };
}
export function initAdvancedSimulator() {
    var _a;
    if (typeof document === 'undefined') {
        return;
    }
    const advancedForm = document.getElementById('advanced-form');
    const advancedValue = document.getElementById('advanced-value');
    const advancedDetail = document.getElementById('advanced-detail');
    const advancedNote = document.getElementById('advanced-note');
    const advancedFootnote = document.getElementById('advanced-footnote');
    const advancedSpouseSelect = document.getElementById('adv-has-spouse');
    const advancedSpouseIncome = document.getElementById('adv-spouse-income');
    const familyTypeSelect = document.getElementById('adv-family-type');
    if (!advancedValue || !advancedDetail || !advancedNote || !advancedFootnote) {
        return;
    }
    const normalizeNumericString = (value) => value.replace(/[^\d]/g, '');
    const parseMoneyValue = (value) => {
        const normalized = normalizeNumericString(value);
        if (!normalized) {
            return 0;
        }
        const numeric = Number(normalized);
        return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    };
    const formatShortUnit = (amount) => {
        if (amount >= 100000000) {
            const oku = amount / 100000000;
            const rounded = oku >= 10 ? Math.round(oku) : Math.round(oku * 10) / 10;
            const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
            return `${text}億円`;
        }
        if (amount >= 10000) {
            const man = amount / 10000;
            const rounded = man >= 10 ? Math.round(man) : Math.round(man * 10) / 10;
            const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
            return `${text}万円`;
        }
        return '';
    };
    const formatMoneyInputValue = (input) => {
        const caret = input.selectionStart;
        const prevLength = input.value.length;
        const normalized = normalizeNumericString(input.value);
        const amount = parseMoneyValue(normalized);
        input.value = normalized ? amount.toLocaleString('ja-JP') : '';
        if (document.activeElement === input && caret !== null) {
            const diff = input.value.length - prevLength;
            const nextPos = Math.max(caret + diff, 0);
            input.setSelectionRange(nextPos, nextPos);
        }
        return amount;
    };
    const renderMoneyPopover = (input, amount, visible) => {
        var _a;
        const parent = (_a = input === null || input === void 0 ? void 0 : input.parentElement) !== null && _a !== void 0 ? _a : null;
        if (!parent) {
            return;
        }
        let pop = parent.querySelector('.input-pop');
        if (!pop) {
            pop = document.createElement('div');
            pop.className = 'input-pop';
            parent.appendChild(pop);
        }
        if (!visible || amount <= 0) {
            pop.removeAttribute('data-visible');
            pop.textContent = '';
            return;
        }
        const unit = formatShortUnit(amount);
        const text = unit ? `${formatYen(amount)} / ${unit}` : formatYen(amount);
        pop.textContent = text;
        pop.dataset.visible = 'true';
    };
    const syncMoneyInput = (input, { showPopover = false } = {}) => {
        const amount = formatMoneyInputValue(input);
        renderMoneyPopover(input, amount, showPopover);
        return amount;
    };
    const enhanceMoneyInputs = () => {
        ADVANCED_MONEY_INPUT_IDS.forEach((id) => {
            var _a;
            const input = document.getElementById(id);
            if (!(input instanceof HTMLInputElement)) {
                return;
            }
            input.type = 'text';
            input.inputMode = 'numeric';
            input.autocomplete = 'off';
            input.pattern = '\\d{1,3}(,\\d{3})*';
            input.placeholder = (_a = input.placeholder) !== null && _a !== void 0 ? _a : '0';
            input.addEventListener('focus', () => syncMoneyInput(input, { showPopover: true }));
            input.addEventListener('input', () => syncMoneyInput(input, { showPopover: true }));
            input.addEventListener('blur', () => renderMoneyPopover(input, parseMoneyValue(input.value), false));
            input.addEventListener('mouseenter', () => renderMoneyPopover(input, parseMoneyValue(input.value), true));
            input.addEventListener('mouseleave', () => renderMoneyPopover(input, parseMoneyValue(input.value), false));
            syncMoneyInput(input);
        });
    };
    const refreshMoneyInputs = () => {
        ADVANCED_MONEY_INPUT_IDS.forEach((id) => {
            const input = document.getElementById(id);
            if (input instanceof HTMLInputElement) {
                syncMoneyInput(input);
            }
        });
    };
    const clearAutofillFlag = (event) => {
        const target = event.target;
        if (isAdvancedInput(target)) {
            target.dataset.autofill = 'manual';
        }
    };
    const applyAdvancedState = (state, { preferExisting = false } = {}) => {
        if (!state) {
            return;
        }
        ADVANCED_INPUT_IDS.forEach((id) => {
            var _a;
            const element = document.getElementById(id);
            if (!isAdvancedInput(element) || typeof state[id] !== 'string') {
                return;
            }
            if (preferExisting && element.value !== '') {
                return;
            }
            element.value = (_a = state[id]) !== null && _a !== void 0 ? _a : '';
            if (element instanceof HTMLInputElement && ADVANCED_MONEY_INPUT_ID_SET.has(id)) {
                syncMoneyInput(element);
            }
        });
    };
    const collectAdvancedState = () => {
        const result = {};
        ADVANCED_INPUT_IDS.forEach((id) => {
            var _a;
            const element = document.getElementById(id);
            if (!isAdvancedInput(element)) {
                return;
            }
            if (element instanceof HTMLInputElement && ADVANCED_MONEY_INPUT_ID_SET.has(id)) {
                result[id] = normalizeNumericString(element.value);
                return;
            }
            result[id] = (_a = element.value) !== null && _a !== void 0 ? _a : '';
        });
        return result;
    };
    const persistAdvancedState = () => {
        saveAdvancedSessionState(collectAdvancedState());
    };
    const applySimplePreset = (simpleState) => {
        if (!simpleState) {
            return;
        }
        const preset = buildAdvancedPreset(simpleState);
        ADVANCED_INPUT_IDS.forEach((id) => {
            const element = document.getElementById(id);
            if (!isAdvancedInput(element)) {
                return;
            }
            const nextValue = preset[id];
            if (typeof nextValue !== 'string') {
                return;
            }
            const canOverride = element.dataset.autofill !== 'manual';
            if (!canOverride) {
                return;
            }
            element.value = nextValue;
            element.dataset.autofill = 'simple';
            if (element instanceof HTMLInputElement && ADVANCED_MONEY_INPUT_ID_SET.has(id)) {
                syncMoneyInput(element);
            }
        });
        handleSpouseRequirement();
        persistAdvancedState();
    };
    const parseAmount = (id) => {
        const element = document.getElementById(id);
        if (!(element instanceof HTMLInputElement)) {
            return 0;
        }
        return parseMoneyValue(element.value);
    };
    const parseCount = (id) => Math.max(0, Math.floor(parseAmount(id)));
    const getTaxRate = (taxableIncome) => {
        var _a;
        const bracket = (_a = ADV_TAX_BRACKETS.find((candidate) => taxableIncome >= candidate.min && taxableIncome < candidate.max)) !== null && _a !== void 0 ? _a : ADV_TAX_BRACKETS[0];
        return { rate: bracket.rate, deduction: bracket.deduction };
    };
    const resetAdvancedResult = () => {
        advancedValue.textContent = '−円';
        advancedNote.textContent = '入力すると控除上限額（目安）を計算します';
        advancedDetail.textContent = '年収と控除の金額を入力してください';
        advancedFootnote.textContent =
            '基礎控除や扶養控除を加味した目安額です。実際の金額はお手元の証憑でご確認ください。';
    };
    const handleSpouseRequirement = () => {
        if (!advancedSpouseSelect || !advancedSpouseIncome) {
            return;
        }
        const needsSpouseIncome = advancedSpouseSelect.value === 'has';
        advancedSpouseIncome.required = needsSpouseIncome;
        advancedSpouseIncome.disabled = !needsSpouseIncome;
        advancedSpouseIncome.placeholder = needsSpouseIncome ? '0' : '配偶者なし';
        if (!needsSpouseIncome) {
            advancedSpouseIncome.value = '';
        }
        syncMoneyInput(advancedSpouseIncome);
        if (!needsSpouseIncome) {
            renderMoneyPopover(advancedSpouseIncome, 0, false);
        }
        persistAdvancedState();
        refreshAdvancedResult();
    };
    const getFamilyText = (value) => {
        if (value === 'couple') {
            return '夫婦のみ世帯';
        }
        if (value === 'single-parent') {
            return 'ひとり親世帯';
        }
        return '一般世帯';
    };
    const calculateAdvanced = () => {
        var _a;
        const salaryIncome = parseAmount('adv-income');
        const spouseIncome = parseAmount('adv-spouse-income');
        const listedGain = parseAmount('adv-listed');
        const unlistedGain = parseAmount('adv-unlisted');
        const familyType = (_a = familyTypeSelect === null || familyTypeSelect === void 0 ? void 0 : familyTypeSelect.value) !== null && _a !== void 0 ? _a : 'none';
        const hasSpouse = (advancedSpouseSelect === null || advancedSpouseSelect === void 0 ? void 0 : advancedSpouseSelect.value) === 'has';
        const dependents = parseCount('adv-dependents');
        const disabled = parseCount('adv-disabled');
        const specialSelf = parseCount('adv-special-self');
        const specialOther = parseCount('adv-special-other');
        const socialInsurance = parseAmount('adv-social');
        const smallEnterprise = parseAmount('adv-small-enterprise');
        const lifeInsurance = parseAmount('adv-life');
        const earthquakeInsurance = parseAmount('adv-earthquake');
        const medicalDeduction = parseAmount('adv-medical');
        const housingDeduction = parseAmount('adv-housing');
        const totalIncome = salaryIncome + listedGain + unlistedGain;
        const spouseDeduction = hasSpouse && spouseIncome <= 1060000 ? ADV_SPOUSE_DEDUCTION : 0;
        const dependentDeduction = dependents * ADV_DEPENDENT_DEDUCTION;
        const disabledDeduction = disabled * ADV_DISABLED_GENERAL +
            (specialSelf + specialOther) * ADV_DISABLED_SPECIAL;
        const totalDeductions = ADV_BASIC_DEDUCTION +
            spouseDeduction +
            dependentDeduction +
            disabledDeduction +
            socialInsurance +
            smallEnterprise +
            lifeInsurance +
            earthquakeInsurance +
            medicalDeduction +
            housingDeduction;
        const taxableIncome = Math.max(totalIncome - totalDeductions, 0);
        const taxableRounded = Math.floor(taxableIncome / 1000) * 1000;
        const { rate: incomeTaxRate, deduction: incomeTaxDeductionBase } = getTaxRate(taxableRounded);
        const incomeTaxAmount = Math.max(Math.round(taxableRounded * incomeTaxRate - incomeTaxDeductionBase), 0);
        const residentTaxAmount = Math.max(Math.round(taxableRounded * 0.1), 0);
        const incomeLimit = totalIncome * 0.4 + 2000;
        const specialRate = 1 - incomeTaxRate - 0.1;
        const residentLimit = specialRate > 0
            ? (residentTaxAmount * 0.2) / specialRate + 2000
            : Number.POSITIVE_INFINITY;
        const maxDonationRaw = Math.min(incomeLimit, residentLimit);
        const maxDonation = Math.max(Math.round(Number.isFinite(maxDonationRaw) ? maxDonationRaw : 0), 0);
        const donationTarget = Math.max(maxDonation - 2000, 0);
        const incomeTaxDeduction = Math.round(donationTarget * incomeTaxRate);
        const residentBasicDeduction = Math.round(donationTarget * 0.1);
        const residentSpecialDeduction = Math.round(Math.min(Math.max(donationTarget * (1 - incomeTaxRate - 0.1), 0), residentTaxAmount * 0.2));
        const totalTaxDeduction = incomeTaxDeduction + residentBasicDeduction + residentSpecialDeduction;
        const actualCost = Math.max(maxDonation - totalTaxDeduction, 0);
        advancedValue.textContent = formatYen(maxDonation);
        advancedNote.textContent = 'あなたの控除上限額（目安）';
        advancedDetail.textContent = `${hasSpouse ? '配偶者あり' : '配偶者なし'} / ${dependents}人扶養 / 課税所得${formatYen(taxableRounded)} をもとに試算しています`;
        advancedFootnote.textContent = `(${getFamilyText(familyType)}) 概算控除額: 所得税${formatYen(incomeTaxDeduction)}・住民税(基本) ${formatYen(residentBasicDeduction)}・住民税(特例) ${formatYen(residentSpecialDeduction)}。この条件で寄付すると自己負担の目安は ${formatYen(actualCost)} です。`;
    };
    function refreshAdvancedResult({ reportValidity = false } = {}) {
        if (!(advancedForm instanceof HTMLFormElement)) {
            return;
        }
        const isValid = advancedForm.checkValidity();
        if (!isValid) {
            if (reportValidity) {
                advancedForm.reportValidity();
            }
            resetAdvancedResult();
            return;
        }
        calculateAdvanced();
    }
    advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.addEventListener('submit', (event) => {
        event.preventDefault();
        refreshAdvancedResult({ reportValidity: true });
    });
    const persistOnInteraction = (event) => {
        clearAutofillFlag(event);
        persistAdvancedState();
        refreshAdvancedResult();
    };
    advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.addEventListener('input', persistOnInteraction);
    advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.addEventListener('change', persistOnInteraction);
    advancedForm === null || advancedForm === void 0 ? void 0 : advancedForm.addEventListener('reset', () => {
        setTimeout(() => {
            var _a;
            const simpleState = (_a = loadSimpleSessionState()) !== null && _a !== void 0 ? _a : defaultSimpleState;
            applyAdvancedState(buildAdvancedDefaults(simpleState));
            applySimplePreset(simpleState);
            refreshMoneyInputs();
        }, 0);
    });
    advancedSpouseSelect === null || advancedSpouseSelect === void 0 ? void 0 : advancedSpouseSelect.addEventListener('change', handleSpouseRequirement);
    const simpleInitialState = (_a = loadSimpleSessionState()) !== null && _a !== void 0 ? _a : defaultSimpleState;
    const savedAdvancedState = loadAdvancedSessionState();
    const advancedInitialState = Object.assign({}, buildAdvancedDefaults(simpleInitialState));
    if (savedAdvancedState) {
        Object.entries(savedAdvancedState).forEach(([key, value]) => {
            if (typeof value === 'string' && value !== '') {
                advancedInitialState[key] = value;
            }
        });
    }
    enhanceMoneyInputs();
    applyAdvancedState(advancedInitialState);
    applySimplePreset(simpleInitialState);
    handleSpouseRequirement();
    refreshMoneyInputs();
    refreshAdvancedResult();
    persistAdvancedState();
    const advancedTab = document.getElementById('tab-advanced');
    advancedTab === null || advancedTab === void 0 ? void 0 : advancedTab.addEventListener('click', () => {
        const simpleState = loadSimpleSessionState();
        applySimplePreset(simpleState);
    });
    document.addEventListener('simple:state-updated', (event) => {
        const simpleState = event.detail;
        applySimplePreset(simpleState !== null && simpleState !== void 0 ? simpleState : null);
    });
}
