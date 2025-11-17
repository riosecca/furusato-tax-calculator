import { getIncomeTaxRateAndDeduction } from "../constants/tax-rates.js";
import { floorToThousand, roundToYen } from "../utils/rounding.js";
const BASIC_DEDUCTION_DEFAULT = 480000;
export function calculateTotalIncome(breakdown) {
    var _a;
    const { salaryAfterDeduction, salaryIncome, businessIncome, realEstateIncome, miscellaneousIncome, dividendIncome, capitalGain } = breakdown;
    const salaryPortion = (_a = salaryAfterDeduction !== null && salaryAfterDeduction !== void 0 ? salaryAfterDeduction : salaryIncome) !== null && _a !== void 0 ? _a : 0;
    const incomes = [
        salaryPortion,
        businessIncome,
        realEstateIncome,
        miscellaneousIncome,
        dividendIncome,
        capitalGain
    ];
    return incomes.reduce((sum, value) => sum + (value !== null && value !== void 0 ? value : 0), 0);
}
export function calculateTotalDeductions(deductions) {
    const { socialInsurance, lifeInsurance, earthquakeInsurance, smallEnterpriseMutualAid, medicalExpense, donationOther, dependentDeduction, spouseDeduction, specialSpouseDeduction, basic } = deductions;
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
        basic !== null && basic !== void 0 ? basic : BASIC_DEDUCTION_DEFAULT
    ];
    return deductionValues.reduce((sum, value) => sum + (value !== null && value !== void 0 ? value : 0), 0);
}
export function calculateIncomeTaxBase(input) {
    const totalIncome = calculateTotalIncome(input.income);
    const totalDeductions = calculateTotalDeductions(input.deductions);
    const taxableIncomeRaw = Math.max(totalIncome - totalDeductions, 0);
    const taxableIncome = floorToThousand(taxableIncomeRaw);
    const { rate, deduction } = getIncomeTaxRateAndDeduction(taxableIncome);
    const incomeTaxAmount = roundToYen(Math.max(taxableIncome * rate - deduction, 0));
    return { taxableIncome, incomeTaxAmount, incomeTaxRate: rate };
}
