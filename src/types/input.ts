export interface IncomeBreakdown {
  salaryIncome?: number; // 給与収入（支払金額）
  salaryAfterDeduction?: number; // 給与所得控除後の金額
  businessIncome?: number; // 事業所得
  realEstateIncome?: number; // 不動産所得
  miscellaneousIncome?: number; // 雑所得（副業・年金など）
  dividendIncome?: number; // 配当所得（総合課税分）
  capitalGain?: number; // 譲渡所得（必要なら）
}

export interface DeductionBreakdown {
  socialInsurance?: number; // 社会保険料控除
  lifeInsurance?: number; // 生命保険料控除
  earthquakeInsurance?: number; // 地震保険料控除
  smallEnterpriseMutualAid?: number; // 小規模企業共済等（iDeCoなど）
  medicalExpense?: number; // 医療費控除
  donationOther?: number; // ふるさと納税以外の寄附金控除
  dependentDeduction?: number; // 扶養控除
  spouseDeduction?: number; // 配偶者控除
  specialSpouseDeduction?: number; // 配偶者特別控除
  basic?: number; // 基礎控除（通常48万円）
}

export interface FurusatoInput {
  income: IncomeBreakdown; // 所得の内訳
  deductions: DeductionBreakdown; // 所得控除の内訳

  residentTaxIncome?: number; // 住民税所得割額（既知なら指定、なければ計算から推定してよい）

  donatedAlready: number; // すでに寄付済みの金額（その年の累計）
  donateNow: number; // 今回追加で寄付する金額
  useOneStop: boolean; // ワンストップ特例を使うかどうか
}
