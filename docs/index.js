import { validateFurusatoInput } from "./utils/validation.js";
import { calculateIncomeTaxBase } from "./calculators/income-tax.js";
import { calculateResidentTaxBase } from "./calculators/resident-basic.js";
import { calculateFurusatoDeduction } from "./calculators/resident-special.js";
import { calculateFurusatoLimit } from "./calculators/limit.js";
export function calculateFurusatoTax(input) {
    validateFurusatoInput(input);
    const incomeBase = calculateIncomeTaxBase(input);
    const residentBase = calculateResidentTaxBase(input, incomeBase);
    const tax = calculateFurusatoDeduction(input, incomeBase, residentBase);
    const limit = calculateFurusatoLimit(input, incomeBase, residentBase);
    const totalDonation = input.donatedAlready + input.donateNow;
    const actualCost = totalDonation - tax.total;
    return {
        totalDonation,
        actualCost,
        tax,
        oneStopTax: input.useOneStop ? tax : undefined,
        limit
    };
}
