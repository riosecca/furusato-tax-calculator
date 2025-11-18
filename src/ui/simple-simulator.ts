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
  700: 106_000,
  1000: 176_000,
  1200: 210_000,
};

const familyAdjustments: Record<string, number> = {
  single: 0,
  couple: -5_000,
  'couple-child': -15_000,
  extended: -8_000,
};

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
