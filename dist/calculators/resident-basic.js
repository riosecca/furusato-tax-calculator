import { RESIDENT_TAX_BASIC_RATE } from "../constants/resident.js";
import { floorToThousand, roundToYen } from "../utils/rounding.js";
export function calculateResidentTaxBase(input, incomeTaxBase) {
    const taxableIncome = incomeTaxBase.taxableIncome;
    if (input.residentTaxIncome !== undefined) {
        return {
            taxableIncome,
            residentTaxAmount: roundToYen(input.residentTaxIncome)
        };
    }
    const residentTaxAmount = roundToYen(Math.max(floorToThousand(taxableIncome) * RESIDENT_TAX_BASIC_RATE, 0));
    return {
        taxableIncome,
        residentTaxAmount
    };
}
