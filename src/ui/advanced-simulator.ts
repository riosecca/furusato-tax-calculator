import { formatYen } from '../utils/currency.js';
import {
  loadAdvancedSessionState,
  saveAdvancedSessionState,
  type AdvancedSessionState,
} from '../storage/session.js';
import { loadSimpleSessionState, type SimpleSessionState } from '../storage/session.js';
import { defaultSimpleState, MAN_YEN, SOCIAL_INSURANCE_ESTIMATES } from './simple-simulator.js';

const ADV_BASIC_DEDUCTION = 480_000;
const ADV_SPOUSE_DEDUCTION = 380_000;
const ADV_DEPENDENT_DEDUCTION = 380_000;
const ADV_DISABLED_GENERAL = 270_000;
const ADV_DISABLED_SPECIAL = 400_000;

type TaxBracket = {
  min: number;
  max: number;
  rate: number;
  deduction: number;
};

const ADV_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 1_950_000, rate: 0.05, deduction: 0 },
  { min: 1_950_000, max: 3_300_000, rate: 0.1, deduction: 97_500 },
  { min: 3_300_000, max: 6_950_000, rate: 0.2, deduction: 427_500 },
  { min: 6_950_000, max: 9_000_000, rate: 0.23, deduction: 636_000 },
  { min: 9_000_000, max: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { min: 18_000_000, max: 40_000_000, rate: 0.4, deduction: 2_796_000 },
  { min: 40_000_000, max: Infinity, rate: 0.45, deduction: 4_796_000 },
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
] as const;

type AdvancedInputId = (typeof ADVANCED_INPUT_IDS)[number];

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
] as const;

const ADVANCED_MONEY_INPUT_ID_SET = new Set<AdvancedInputId>(ADVANCED_MONEY_INPUT_IDS);

const ADVANCED_DEFAULT_BASE: AdvancedSessionState = {
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

function isAdvancedInput(
  element: Element | null
): element is HTMLInputElement | HTMLSelectElement {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement;
}

type ApplyStateOptions = {
  preferExisting?: boolean;
};

function buildAdvancedDefaults(simpleState: SimpleSessionState | null): AdvancedSessionState {
  const defaults: AdvancedSessionState = { ...ADVANCED_DEFAULT_BASE };

  const incomeSelection = Number(simpleState?.income ?? defaultSimpleState.income);
  const annualIncome = Number.isFinite(incomeSelection)
    ? Math.max(Math.round(incomeSelection * MAN_YEN), 0)
    : Number(defaults['adv-income']);
  defaults['adv-income'] = String(annualIncome);

  const socialBracket =
    SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max) ??
    SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1];
  defaults['adv-social'] = String(Math.max(Math.round(annualIncome * socialBracket.rate), 0));

  const family = simpleState?.family;
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

function buildAdvancedPreset(simpleState: SimpleSessionState | null): AdvancedSessionState {
  if (!simpleState) {
    return {};
  }

  const income = Number(simpleState.income);
  const annualIncome = Number.isFinite(income) ? Math.max(Math.round(income * MAN_YEN), 0) : null;
  const hasSpouse = simpleState.family !== 'single';
  const hasDependents = simpleState.family === 'couple-child' || simpleState.family === 'extended';
  const socialBracket =
    annualIncome !== null
      ? SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max) ??
        SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1]
      : null;
  const estimatedSocial =
    annualIncome !== null && socialBracket
      ? Math.max(Math.round(annualIncome * socialBracket.rate), 0)
      : null;

  return {
    'adv-income': annualIncome !== null ? String(annualIncome) : '',
    'adv-spouse-income': hasSpouse ? '0' : '',
    'adv-has-spouse': hasSpouse ? 'has' : 'none',
    'adv-family-type':
      simpleState.family === 'couple' || simpleState.family === 'couple-child' ? 'couple' : 'none',
    'adv-dependents': hasDependents ? '1' : '0',
    'adv-social': estimatedSocial !== null ? String(estimatedSocial) : '',
  };
}

export function initAdvancedSimulator(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const advancedForm = document.getElementById('advanced-form') as HTMLFormElement | null;
  const advancedValue = document.getElementById('advanced-value');
  const advancedDetail = document.getElementById('advanced-detail');
  const advancedNote = document.getElementById('advanced-note');
  const advancedFootnote = document.getElementById('advanced-footnote');
  const advancedSpouseSelect = document.getElementById(
    'adv-has-spouse'
  ) as HTMLSelectElement | null;
  const advancedSpouseIncome = document.getElementById(
    'adv-spouse-income'
  ) as HTMLInputElement | null;
  const familyTypeSelect = document.getElementById(
    'adv-family-type'
  ) as HTMLSelectElement | null;

  if (!advancedValue || !advancedDetail || !advancedNote || !advancedFootnote) {
    return;
  }

  const normalizeNumericString = (value: string): string => value.replace(/[^\d]/g, '');

  const parseMoneyValue = (value: string): number => {
    const normalized = normalizeNumericString(value);
    if (!normalized) {
      return 0;
    }
    const numeric = Number(normalized);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
  };

  const formatShortUnit = (amount: number): string => {
    if (amount >= 100_000_000) {
      const oku = amount / 100_000_000;
      const rounded = oku >= 10 ? Math.round(oku) : Math.round(oku * 10) / 10;
      const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
      return `${text}億円`;
    }
    if (amount >= 10_000) {
      const man = amount / 10_000;
      const rounded = man >= 10 ? Math.round(man) : Math.round(man * 10) / 10;
      const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
      return `${text}万円`;
    }
    return '';
  };

  const formatMoneyInputValue = (input: HTMLInputElement): number => {
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

  const renderMoneyPopover = (input: HTMLInputElement, amount: number, visible: boolean) => {
    const parent = input?.parentElement ?? null;
    if (!parent) {
      return;
    }

    let pop = parent.querySelector<HTMLDivElement>('.input-pop');
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

  const syncMoneyInput = (
    input: HTMLInputElement,
    { showPopover = false }: { showPopover?: boolean } = {}
  ): number => {
    const amount = formatMoneyInputValue(input);
    renderMoneyPopover(input, amount, showPopover);
    return amount;
  };

  const enhanceMoneyInputs = () => {
    ADVANCED_MONEY_INPUT_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.pattern = '\\d{1,3}(,\\d{3})*';
      input.placeholder = input.placeholder ?? '0';

      input.addEventListener('focus', () => syncMoneyInput(input, { showPopover: true }));
      input.addEventListener('input', () => syncMoneyInput(input, { showPopover: true }));
      input.addEventListener('blur', () =>
        renderMoneyPopover(input, parseMoneyValue(input.value), false)
      );
      input.addEventListener('mouseenter', () =>
        renderMoneyPopover(input, parseMoneyValue(input.value), true)
      );
      input.addEventListener('mouseleave', () =>
        renderMoneyPopover(input, parseMoneyValue(input.value), false)
      );

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

  const clearAutofillFlag = (event: Event) => {
    const target = event.target as Element | null;
    if (isAdvancedInput(target)) {
      target.dataset.autofill = 'manual';
    }
  };

  const applyAdvancedState = (
    state: AdvancedSessionState | null,
    { preferExisting = false }: ApplyStateOptions = {}
  ) => {
    if (!state) {
      return;
    }

    ADVANCED_INPUT_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (!isAdvancedInput(element) || typeof state[id] !== 'string') {
        return;
      }

      if (preferExisting && element.value !== '') {
        return;
      }

      element.value = state[id] ?? '';

      if (element instanceof HTMLInputElement && ADVANCED_MONEY_INPUT_ID_SET.has(id)) {
        syncMoneyInput(element);
      }
    });
  };

  const collectAdvancedState = (): AdvancedSessionState => {
    const result: AdvancedSessionState = {};
    ADVANCED_INPUT_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (!isAdvancedInput(element)) {
        return;
      }

      if (element instanceof HTMLInputElement && ADVANCED_MONEY_INPUT_ID_SET.has(id)) {
        result[id] = normalizeNumericString(element.value);
        return;
      }

      result[id] = element.value ?? '';
    });
    return result;
  };

  const persistAdvancedState = () => {
    saveAdvancedSessionState(collectAdvancedState());
  };

  const applySimplePreset = (simpleState: SimpleSessionState | null) => {
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

  const parseAmount = (id: string): number => {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
      return 0;
    }
    return parseMoneyValue(element.value);
  };

  const parseCount = (id: string): number => Math.max(0, Math.floor(parseAmount(id)));

  const getTaxRate = (taxableIncome: number): Pick<TaxBracket, 'rate' | 'deduction'> => {
    const bracket =
      ADV_TAX_BRACKETS.find(
        (candidate) =>
          taxableIncome >= candidate.min && taxableIncome < candidate.max
      ) ?? ADV_TAX_BRACKETS[0];
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

  const getFamilyText = (value: string): string => {
    if (value === 'couple') {
      return '夫婦のみ世帯';
    }
    if (value === 'single-parent') {
      return 'ひとり親世帯';
    }
    return '一般世帯';
  };

  const calculateAdvanced = () => {
    const salaryIncome = parseAmount('adv-income');
    const spouseIncome = parseAmount('adv-spouse-income');
    const listedGain = parseAmount('adv-listed');
    const unlistedGain = parseAmount('adv-unlisted');
    const familyType = familyTypeSelect?.value ?? 'none';
    const hasSpouse = advancedSpouseSelect?.value === 'has';

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
    const spouseDeduction =
      hasSpouse && spouseIncome <= 1_060_000 ? ADV_SPOUSE_DEDUCTION : 0;
    const dependentDeduction = dependents * ADV_DEPENDENT_DEDUCTION;
    const disabledDeduction =
      disabled * ADV_DISABLED_GENERAL +
      (specialSelf + specialOther) * ADV_DISABLED_SPECIAL;

    const totalDeductions =
      ADV_BASIC_DEDUCTION +
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
    const taxableRounded = Math.floor(taxableIncome / 1_000) * 1_000;

    const { rate: incomeTaxRate, deduction: incomeTaxDeductionBase } =
      getTaxRate(taxableRounded);
    const incomeTaxAmount = Math.max(
      Math.round(taxableRounded * incomeTaxRate - incomeTaxDeductionBase),
      0
    );
    const residentTaxAmount = Math.max(Math.round(taxableRounded * 0.1), 0);

    const incomeLimit = totalIncome * 0.4 + 2_000;
    const specialRate = 1 - incomeTaxRate - 0.1;
    const residentLimit =
      specialRate > 0
        ? (residentTaxAmount * 0.2) / specialRate + 2_000
        : Number.POSITIVE_INFINITY;

    const maxDonationRaw = Math.min(incomeLimit, residentLimit);
    const maxDonation = Math.max(
      Math.round(Number.isFinite(maxDonationRaw) ? maxDonationRaw : 0),
      0
    );

    const donationTarget = Math.max(maxDonation - 2_000, 0);
    const incomeTaxDeduction = Math.round(donationTarget * incomeTaxRate);
    const residentBasicDeduction = Math.round(donationTarget * 0.1);
    const residentSpecialDeduction = Math.round(
      Math.min(
        Math.max(donationTarget * (1 - incomeTaxRate - 0.1), 0),
        residentTaxAmount * 0.2
      )
    );
    const totalTaxDeduction =
      incomeTaxDeduction + residentBasicDeduction + residentSpecialDeduction;
    const actualCost = Math.max(maxDonation - totalTaxDeduction, 0);

    advancedValue.textContent = formatYen(maxDonation);
    advancedNote.textContent = 'あなたの控除上限額（目安）';
    advancedDetail.textContent = `${hasSpouse ? '配偶者あり' : '配偶者なし'} / ${dependents}人扶養 / 課税所得${formatYen(
      taxableRounded
    )} をもとに試算しています`;
    advancedFootnote.textContent = `(${getFamilyText(
      familyType
    )}) 概算控除額: 所得税${formatYen(
      incomeTaxDeduction
    )}・住民税(基本) ${formatYen(
      residentBasicDeduction
    )}・住民税(特例) ${formatYen(
      residentSpecialDeduction
    )}。この条件で寄付すると自己負担の目安は ${formatYen(actualCost)} です。`;
  };

  function refreshAdvancedResult({ reportValidity = false }: { reportValidity?: boolean } = {}) {
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

  advancedForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    refreshAdvancedResult({ reportValidity: true });
  });

  const persistOnInteraction = (event: Event) => {
    clearAutofillFlag(event);
    persistAdvancedState();
    refreshAdvancedResult();
  };

  advancedForm?.addEventListener('input', persistOnInteraction);
  advancedForm?.addEventListener('change', persistOnInteraction);

  advancedForm?.addEventListener('reset', () => {
    setTimeout(() => {
      const simpleState = loadSimpleSessionState() ?? defaultSimpleState;
      applyAdvancedState(buildAdvancedDefaults(simpleState));
      applySimplePreset(simpleState);
      refreshMoneyInputs();
    }, 0);
  });

  advancedSpouseSelect?.addEventListener('change', handleSpouseRequirement);

  const simpleInitialState = loadSimpleSessionState() ?? defaultSimpleState;
  const savedAdvancedState = loadAdvancedSessionState();
  const advancedInitialState: AdvancedSessionState = {
    ...buildAdvancedDefaults(simpleInitialState),
  };

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
  advancedTab?.addEventListener('click', () => {
    const simpleState = loadSimpleSessionState();
    applySimplePreset(simpleState);
  });

  document.addEventListener('simple:state-updated', (event) => {
    const simpleState = (event as CustomEvent<SimpleSessionState>).detail;
    applySimplePreset(simpleState ?? null);
  });
}
