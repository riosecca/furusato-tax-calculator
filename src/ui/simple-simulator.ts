import { formatYen } from '../utils/currency.js';
import {
  loadSimpleSessionState,
  saveSimpleSessionState,
  type SimpleSessionState,
} from '../storage/session.js';

const DEFAULT_SELECTIONS = {
  family: 'couple-child',
  income: '700',
} as const;

const baseEstimates: Record<string, number> = {
  150: 12_000,
  200: 19_000,
  300: 28_000,
  400: 42_000,
  500: 61_000,
  600: 77_000,
  700: 106_000,
  800: 133_000,
  900: 150_000,
  1000: 176_000,
  1200: 210_000,
  1500: 300_000,
  2000: 420_000,
  3000: 620_000,
  5000: 1_050_000,
  10000: 2_100_000,
  20000: 4_200_000,
  30000: 6_300_000,
};

const familyAdjustments: Record<string, number> = {
  single: 0,
  couple: -5_000,
  'couple-child': -15_000,
  extended: -8_000,
};

const MAN_YEN = 10_000;
const BASIC_DEDUCTION = 480_000;
const SPOUSE_DEDUCTION = 380_000;
const DEPENDENT_DEDUCTION = 380_000;
const NON_TAXABLE_THRESHOLD = 10_000;
const SOCIAL_INSURANCE_ESTIMATES = [
  { max: 2_000_000, rate: 0.24 },
  { max: 4_000_000, rate: 0.2 },
  { max: 7_000_000, rate: 0.18 },
  { max: Number.POSITIVE_INFINITY, rate: 0.16 },
] as const;

type ResultCard = {
  amount: string;
  detail?: string;
};

const defaultSimpleState: SimpleSessionState = {
  family: DEFAULT_SELECTIONS.family,
  income: DEFAULT_SELECTIONS.income,
  oneStop: false,
  largeDeduction: false,
};

export function initSimpleSimulator(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const calcButton = document.getElementById(
    'btn-simple-calc'
  ) as HTMLButtonElement | null;
  const resetButton = document.getElementById(
    'btn-simple-reset'
  ) as HTMLButtonElement | null;
  const resultValueTargets = document.querySelectorAll<HTMLElement>(
    '[data-simple-result="value"]'
  );
  const resultDetailTargets = document.querySelectorAll<HTMLElement>(
    '[data-simple-result="detail"]'
  );
  const resultNoteTargets = document.querySelectorAll<HTMLElement>(
    '[data-simple-result="note"]'
  );

  if (!resultValueTargets.length || !resultNoteTargets.length) {
    return;
  }

  const getSelectedInput = (name: string) =>
    document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);

  const getSelectedValue = (name: string): string | null =>
    getSelectedInput(name)?.value ?? null;

  const setRadioValue = (name: string, value: string) => {
    const target = document.querySelector<HTMLInputElement>(
      `input[name="${name}"][value="${value}"]`
    );
    if (target) {
      target.checked = true;
    }
  };

  const setCheckboxValue = (name: string, checked: boolean) => {
    const target = document.querySelector<HTMLInputElement>(
      `input[name="${name}"]`
    );
    if (target) {
      target.checked = checked;
    }
  };

  const updateResultCard = ({ amount, detail }: ResultCard) => {
    resultValueTargets.forEach((target) => {
      target.textContent = amount;
    });
    resultDetailTargets.forEach((target) => {
      target.textContent = detail ?? '';
      target.toggleAttribute('data-empty', !detail);
    });
    resultNoteTargets.forEach((target) => {
      target.textContent = 'あなたの控除上限額（目安）は';
    });
  };

  const applyStateToInputs = (state: SimpleSessionState) => {
    setRadioValue('family', state.family);
    setRadioValue('income', state.income);
    setCheckboxValue('one-stop', state.oneStop);
    setCheckboxValue('large-deduction', state.largeDeduction);
  };

  const hasSpouseDeduction = (family: string): boolean =>
    family === 'couple' || family === 'couple-child';

  const hasDependentDeduction = (family: string): boolean =>
    family === 'couple-child';

  const toAnnualIncome = (selection: string): number => {
    const numericValue = Number(selection);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 0;
    }
    return numericValue * MAN_YEN;
  };

  const getSalaryDeduction = (annualIncome: number): number => {
    if (annualIncome <= 0) {
      return 0;
    }
    if (annualIncome <= 1_625_000) {
      return 550_000;
    }
    if (annualIncome <= 1_800_000) {
      return annualIncome * 0.4 - 100_000;
    }
    if (annualIncome <= 3_600_000) {
      return annualIncome * 0.3 + 80_000;
    }
    if (annualIncome <= 6_600_000) {
      return annualIncome * 0.2 + 440_000;
    }
    if (annualIncome <= 8_500_000) {
      return annualIncome * 0.1 + 1_100_000;
    }
    return 1_950_000;
  };

  const calculateSalaryIncome = (annualIncome: number): number => {
    const deduction = getSalaryDeduction(annualIncome);
    return Math.max(annualIncome - deduction, 0);
  };

  const estimateSocialInsurance = (annualIncome: number): number => {
    const bracket =
      SOCIAL_INSURANCE_ESTIMATES.find(({ max }) => annualIncome <= max) ??
      SOCIAL_INSURANCE_ESTIMATES[SOCIAL_INSURANCE_ESTIMATES.length - 1];
    return Math.max(Math.round(annualIncome * bracket.rate), 0);
  };

  const calculateResidentTaxableIncome = (
    family: string,
    annualIncome: number
  ): number => {
    const salaryIncome = calculateSalaryIncome(annualIncome);
    const socialInsurance = estimateSocialInsurance(annualIncome);
    const deductions =
      BASIC_DEDUCTION +
      socialInsurance +
      (hasSpouseDeduction(family) ? SPOUSE_DEDUCTION : 0) +
      (hasDependentDeduction(family) ? DEPENDENT_DEDUCTION : 0);
    return salaryIncome - deductions;
  };

  function runSimpleSimulation(): void {
    const selectedFamily = getSelectedValue('family');
    const selectedIncome = getSelectedValue('income');
    const hasOneStop = Boolean(
      document.querySelector('input[name="one-stop"]:checked')
    );
    const hasLargeDeduction = Boolean(
      document.querySelector('input[name="large-deduction"]:checked')
    );

    if (!selectedFamily || !selectedIncome) {
      updateResultCard({
        amount: '−円',
        detail: '条件を選択してください',
      });
      return;
    }

    const stateToSave: SimpleSessionState = {
      family: selectedFamily,
      income: selectedIncome,
      oneStop: hasOneStop,
      largeDeduction: hasLargeDeduction,
    };
    saveSimpleSessionState(stateToSave);

    const annualIncome = toAnnualIncome(selectedIncome);
    const taxableIncome = calculateResidentTaxableIncome(
      selectedFamily,
      annualIncome
    );

    if (taxableIncome <= NON_TAXABLE_THRESHOLD) {
      updateResultCard({
        amount: formatYen(0),
        detail: '住民税が非課税ラインのため、上限額は0円です。',
      });
      return;
    }

    const incomeBase = baseEstimates[selectedIncome] ?? 0;
    const adjustment = familyAdjustments[selectedFamily] ?? 0;
    const deductionHit = hasLargeDeduction ? 8_000 : 0;
    const oneStopBonus = hasOneStop ? 2_000 : 0;
    const estimated = incomeBase + adjustment - deductionHit + oneStopBonus;

    updateResultCard({
      amount: formatYen(estimated),
    });
  }

  calcButton?.addEventListener('click', runSimpleSimulation);

  document
    .querySelectorAll<HTMLInputElement>(
      'input[name="family"], input[name="income"], input[name="one-stop"], input[name="large-deduction"]'
    )
    .forEach((element) => {
      element.addEventListener('change', runSimpleSimulation);
    });

  resetButton?.addEventListener('click', () => {
    applyStateToInputs(defaultSimpleState);
    runSimpleSimulation();
  });

  const savedState = loadSimpleSessionState() ?? defaultSimpleState;
  applyStateToInputs(savedState);
  runSimpleSimulation();
}
