export const INCOME_TAX_BRACKETS = [
    { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
    { min: 1950000, max: 3300000, rate: 0.1, deduction: 97500 },
    { min: 3300000, max: 6950000, rate: 0.2, deduction: 427500 },
    { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
    { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
    { min: 18000000, max: 40000000, rate: 0.4, deduction: 2796000 },
    { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 }
];
export function getIncomeTaxRateAndDeduction(taxableIncome) {
    const bracket = INCOME_TAX_BRACKETS.find((b) => taxableIncome >= b.min && taxableIncome < b.max);
    if (!bracket) {
        return { rate: 0, deduction: 0 };
    }
    return { rate: bracket.rate, deduction: bracket.deduction };
}
