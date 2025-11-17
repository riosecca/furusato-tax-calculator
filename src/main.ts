// src/main.ts

type SimpleInput = {
  income: number;
  bonus: number;
  familyType: 'single' | 'married-deduction' | 'child-1' | 'child-2plus';
  hasHomeLoan: boolean;
  hasBigDeduction: boolean;
};

type AdvancedInput = {
  taxableIncome: number;
  totalDeduction: number;
  residentTaxAmount: number;
  incomeTaxRate: number;
  otherTaxCredits: number;
  currentDonation: number;
};

type CalcResult = {
  maxDonation: number;
  safeLower: number;
  safeUpper: number;
  details: string[];
};

function formatYen(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
}

/**
 * かんたん版のざっくり計算
 * ※ 要件定義済みのロジックがあるなら、この中身を差し替える想定
 */
function calculateSimpleMax(input: SimpleInput): CalcResult {
  if (!input.income && !input.bonus) {
    return {
      maxDonation: 0,
      safeLower: 0,
      safeUpper: 0,
      details: ['年収が未入力のため計算できません。'],
    };
  }

  const totalIncome = input.income + input.bonus;

  // 家族構成でざっくり補正（※仮のロジック：あとで要件定義どおりに差し替え）
  let factor = 0.08;
  switch (input.familyType) {
    case 'single':
      factor = 0.075;
      break;
    case 'married-deduction':
      factor = 0.07;
      break;
    case 'child-1':
      factor = 0.065;
      break;
    case 'child-2plus':
      factor = 0.06;
      break;
  }

  let maxDonation = totalIncome * factor;

  if (input.hasHomeLoan) {
    maxDonation *= 0.8;
  }
  if (input.hasBigDeduction) {
    maxDonation *= 0.85;
  }

  const safeLower = maxDonation * 0.8;
  const safeUpper = maxDonation * 0.95;

  return {
    maxDonation: Math.round(maxDonation),
    safeLower: Math.round(safeLower),
    safeUpper: Math.round(safeUpper),
    details: [
      `目安として年収の ${Math.round(factor * 100)}% を基本に計算しています。`,
      input.hasHomeLoan
        ? '住宅ローン控除の影響を考慮して、20% 減額しています。'
        : '住宅ローン控除なしとして計算しています。',
      input.hasBigDeduction
        ? '医療費控除など大きな控除がある前提で、さらに 15% 減額しています。'
        : 'その他の大きな控除は考慮していません。',
    ],
  };
}

/**
 * 詳細版の計算
 * ※ ONE-STOP特例・住民税所得割の20%ルールをざっくり考慮したサンプル実装
 *   → 正確な要件があるなら、このロジックだけ差し替え
 */
function calculateAdvancedMax(input: AdvancedInput): CalcResult {
  if (!input.residentTaxAmount) {
    return {
      maxDonation: 0,
      safeLower: 0,
      safeUpper: 0,
      details: ['住民税所得割額が未入力のため計算できません。'],
    };
  }

  // 住民税所得割額の 20% が上限（自己負担 2,000 円を含むイメージ）
  const baseLimit = input.residentTaxAmount * 0.2;

  // 他の税額控除分を引く（住宅ローン控除など）
  const adjustedLimit = Math.max(baseLimit - input.otherTaxCredits, 0);

  // すでにふるさと納税している分を引く
  const remaining = Math.max(adjustedLimit - input.currentDonation, 0);

  const safeLower = remaining * 0.85;
  const safeUpper = remaining * 0.98;

  const details: string[] = [];
  details.push(`住民税所得割額の 20% を上限として計算しています（目安）。`);
  if (input.otherTaxCredits > 0) {
    details.push(
      `住宅ローン控除など、その他の税額控除 ${formatYen(
        input.otherTaxCredits
      )} 円分を差し引いています。`
    );
  }
  if (input.currentDonation > 0) {
    details.push(
      `今年すでに行ったふるさと納税 ${formatYen(
        input.currentDonation
      )} 円を差し引いた残りを計算しています。`
    );
  }
  details.push('自己負担 2,000 円を含んだ概算です。');

  return {
    maxDonation: Math.round(remaining),
    safeLower: Math.round(safeLower),
    safeUpper: Math.round(safeUpper),
    details,
  };
}

/**
 * 結果を画面に反映
 */
function renderResult(result: CalcResult) {
  const maxEl = document.getElementById('result-max');
  const rangeEl = document.getElementById('result-range');
  const detailEl = document.getElementById('result-detail');

  if (!maxEl || !rangeEl || !detailEl) return;

  if (!result.maxDonation) {
    maxEl.textContent = '—';
    rangeEl.textContent =
      '必要な項目を入力してから「計算する」を押してください。';
    detailEl.innerHTML =
      '<li>控除される住民税・所得税の合計：— 円</li><li>自己負担額（原則）：2,000 円</li>';
    return;
  }

  maxEl.textContent = formatYen(result.maxDonation);
  rangeEl.textContent = `安全ゾーンの目安：${formatYen(
    result.safeLower
  )} 円 ～ ${formatYen(result.safeUpper)} 円 程度`;

  detailEl.innerHTML = '';
  const totalTaxLi = document.createElement('li');
  totalTaxLi.textContent = `控除される住民税・所得税の合計（概算）：${formatYen(
    result.maxDonation
  )} 円`;
  detailEl.appendChild(totalTaxLi);

  for (const d of result.details) {
    const li = document.createElement('li');
    li.textContent = d;
    detailEl.appendChild(li);
  }

  const ownLi = document.createElement('li');
  ownLi.textContent = '自己負担額（原則）：2,000 円';
  detailEl.appendChild(ownLi);
}

/**
 * タブ切り替えのセットアップ
 */
function setupTabs() {
  const tabButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.tab-button')
  );
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;

      tabButtons.forEach((b) => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');

      panels.forEach((p) => {
        p.classList.toggle('panel-active', p.id === targetId);
      });
    });
  });
}

/**
 * ボタンのイベント（かんたん版）
 */
function setupSimpleForm() {
  const calcBtn = document.getElementById(
    'btn-simple-calc'
  ) as HTMLButtonElement | null;
  const resetBtn = document.getElementById(
    'btn-simple-reset'
  ) as HTMLButtonElement | null;

  if (!calcBtn || !resetBtn) return;

  calcBtn.addEventListener('click', () => {
    const income = Number(
      (document.getElementById('simple-income') as HTMLInputElement | null)
        ?.value || 0
    );
    const bonus = Number(
      (document.getElementById('simple-bonus') as HTMLInputElement | null)
        ?.value || 0
    );
    const familyType = (
      document.getElementById('simple-family') as HTMLSelectElement | null
    )?.value as SimpleInput['familyType'];
    const hasHomeLoan = !!(
      document.getElementById('simple-homeloan') as HTMLInputElement | null
    )?.checked;
    const hasBigDeduction = !!(
      document.getElementById(
        'simple-special-deduction'
      ) as HTMLInputElement | null
    )?.checked;

    const result = calculateSimpleMax({
      income,
      bonus,
      familyType: familyType || 'single',
      hasHomeLoan,
      hasBigDeduction,
    });

    renderResult(result);
  });

  resetBtn.addEventListener('click', () => {
    (
      document.getElementById('simple-income') as HTMLInputElement | null
    )?.value = '';
    (
      document.getElementById('simple-bonus') as HTMLInputElement | null
    )?.value = '';
    (
      document.getElementById('simple-family') as HTMLSelectElement | null
    ).value = 'single';
    (
      document.getElementById('simple-homeloan') as HTMLInputElement | null
    ).checked = false;
    (
      document.getElementById(
        'simple-special-deduction'
      ) as HTMLInputElement | null
    ).checked = false;

    renderResult({
      maxDonation: 0,
      safeLower: 0,
      safeUpper: 0,
      details: [],
    });
  });
}

/**
 * ボタンのイベント（詳細版）
 */
function setupAdvancedForm() {
  const calcBtn = document.getElementById(
    'btn-adv-calc'
  ) as HTMLButtonElement | null;
  const resetBtn = document.getElementById(
    'btn-adv-reset'
  ) as HTMLButtonElement | null;

  if (!calcBtn || !resetBtn) return;

  calcBtn.addEventListener('click', () => {
    const taxableIncome = Number(
      (document.getElementById('adv-taxable-income') as HTMLInputElement | null)
        ?.value || 0
    );
    const totalDeduction = Number(
      (
        document.getElementById(
          'adv-total-deduction'
        ) as HTMLInputElement | null
      )?.value || 0
    );
    const residentTaxAmount = Number(
      (document.getElementById('adv-resident-tax') as HTMLInputElement | null)
        ?.value || 0
    );
    const incomeTaxRate = Number(
      (
        document.getElementById(
          'adv-income-tax-rate'
        ) as HTMLSelectElement | null
      )?.value || 0.1
    );
    const otherTaxCredits = Number(
      (
        document.getElementById(
          'adv-other-deduction'
        ) as HTMLInputElement | null
      )?.value || 0
    );
    const currentDonation = Number(
      (
        document.getElementById(
          'adv-current-donation'
        ) as HTMLInputElement | null
      )?.value || 0
    );

    const result = calculateAdvancedMax({
      taxableIncome,
      totalDeduction,
      residentTaxAmount,
      incomeTaxRate,
      otherTaxCredits,
      currentDonation,
    });

    renderResult(result);
  });

  resetBtn.addEventListener('click', () => {
    const ids = [
      'adv-taxable-income',
      'adv-total-deduction',
      'adv-resident-tax',
      'adv-other-deduction',
      'adv-current-donation',
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = '';
    });
    const rateSel = document.getElementById(
      'adv-income-tax-rate'
    ) as HTMLSelectElement | null;
    if (rateSel) rateSel.value = '0.1';

    renderResult({
      maxDonation: 0,
      safeLower: 0,
      safeUpper: 0,
      details: [],
    });
  });
}

// DOM 準備完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupSimpleForm();
  setupAdvancedForm();
  // 初期状態では結果をクリア
  renderResult({ maxDonation: 0, safeLower: 0, safeUpper: 0, details: [] });
});
