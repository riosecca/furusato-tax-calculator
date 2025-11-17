import { FurusatoInput, IncomeBreakdown, DeductionBreakdown } from "../types/input";
import { getIncomeTaxRateAndDeduction } from "../constants/tax-rates";
import { floorToThousand, roundToYen } from "../utils/rounding";

const BASIC_DEDUCTION_DEFAULT = 480000;

export function calculateTotalIncome(breakdown: IncomeBreakdown): number {
  const {
    salaryAfterDeduction,
    salaryIncome,
    businessIncome,
    realEstateIncome,
    miscellaneousIncome,
    dividendIncome,
    capitalGain
  } = breakdown;

  const salaryPortion = salaryAfterDeduction ?? salaryIncome ?? 0;
  const incomes = [
    salaryPortion,
    businessIncome,
    realEstateIncome,
    miscellaneousIncome,
    dividendIncome,
    capitalGain
  ];

  return incomes.reduce((sum, value = 0) => sum + value, 0);
}

export function calculateTotalDeductions(deductions: DeductionBreakdown): number {
  const {
    socialInsurance,
    lifeInsurance,
    earthquakeInsurance,
    smallEnterpriseMutualAid,
    medicalExpense,
    donationOther,
    dependentDeduction,
    spouseDeduction,
    specialSpouseDeduction,
    basic
  } = deductions;

  const deductionValues = [
    socialInsurance,
    lifeInsurance,
    earthquakeInsurance,
    smallEnterpriseMutualAid,
    medicalExpense,
    donationOther,
    dependentDeduction,
    spouseDeduction,
    specialSpouseDeduction,
    basic ?? BASIC_DEDUCTION_DEFAULT
  ];

  return deductionValues.reduce((sum, value = 0) => sum + value, 0);
}

export interface IncomeTaxBaseResult {
  taxableIncome: number; // 所得税の課税所得
  incomeTaxAmount: number; // ふるさと納税控除前の所得税額
  incomeTaxRate: number; // 適用された税率（0.05〜0.45）
}

export function calculateIncomeTaxBase(input: FurusatoInput): IncomeTaxBaseResult {
  const totalIncome = calculateTotalIncome(input.income);
  const totalDeductions = calculateTotalDeductions(input.deductions);

  const taxableIncomeRaw = Math.max(totalIncome - totalDeductions, 0);
  const taxableIncome = floorToThousand(taxableIncomeRaw);

  const { rate, deduction } = getIncomeTaxRateAndDeduction(taxableIncome);
  const incomeTaxAmount = roundToYen(Math.max(taxableIncome * rate - deduction, 0));

  return { taxableIncome, incomeTaxAmount, incomeTaxRate: rate };
}
