import { FurusatoInput } from "../types/input";
import { RESIDENT_TAX_BASIC_RATE } from "../constants/resident";
import { IncomeTaxBaseResult } from "./income-tax";
import { floorToThousand, roundToYen } from "../utils/rounding";

export interface ResidentTaxBaseResult {
  taxableIncome: number; // 住民税の課税所得
  residentTaxAmount: number; // ふるさと納税控除前の住民税（所得割）の金額
}

export function calculateResidentTaxBase(
  input: FurusatoInput,
  incomeTaxBase: IncomeTaxBaseResult
): ResidentTaxBaseResult {
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
