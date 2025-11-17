import { validateFurusatoInput } from "./utils/validation";
import { calculateIncomeTaxBase } from "./calculators/income-tax";
import { calculateResidentTaxBase } from "./calculators/resident-basic";
import { calculateFurusatoDeduction } from "./calculators/resident-special";
import { calculateFurusatoLimit } from "./calculators/limit";
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
