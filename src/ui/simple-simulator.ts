import { formatYen } from '../utils/currency.js';

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
  const resultValue = document.getElementById('result-value');
  const resultDetail = document.getElementById('result-detail');
  const resultNote = document.getElementById('result-note');

  if (!resultValue || !resultDetail || !resultNote) {
    return;
  }

  const getSelectedInput = (name: string) =>
    document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);

  const getSelectedValue = (name: string): string | null =>
    getSelectedInput(name)?.value ?? null;

  const getSelectedLabelText = (input: HTMLInputElement | null): string => {
    if (!input) {
      return '';
    }
    const label = input.closest('label');
    return label ? label.textContent?.trim().replace(/\s+/g, ' ') ?? '' : '';
  };

  const updateResultCard = ({ amount, detail }: ResultCard) => {
    resultValue.textContent = amount;
    resultDetail.textContent = detail ?? '';
    resultNote.textContent = 'あなたの控除上限額（目安）は';
  };

  const applyDefaultSelections = () => {
    document
      .querySelectorAll<HTMLInputElement>(
        'input[type="radio"], input[type="checkbox"]'
      )
      .forEach((element) => {
        const isFamilyDefault =
          element.name === 'family' && element.value === DEFAULT_SELECTIONS.family;
        const isIncomeDefault =
          element.name === 'income' && element.value === DEFAULT_SELECTIONS.income;

        if (element.type === 'checkbox') {
          element.checked = false;
        } else if (element.type === 'radio') {
          element.checked = isFamilyDefault || isIncomeDefault;
        }
      });

    runSimpleSimulation();
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

    const incomeBase = baseEstimates[selectedIncome] ?? 0;
    const adjustment = familyAdjustments[selectedFamily] ?? 0;
    const deductionHit = hasLargeDeduction ? 8_000 : 0;
    const oneStopBonus = hasOneStop ? 2_000 : 0;
    const estimated = incomeBase + adjustment - deductionHit + oneStopBonus;

    const incomeLabel = getSelectedLabelText(getSelectedInput('income'));
    const familyLabel = getSelectedLabelText(getSelectedInput('family'));

    updateResultCard({
      amount: formatYen(estimated),
      detail: '',
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

  resetButton?.addEventListener('click', applyDefaultSelections);

  applyDefaultSelections();
}
