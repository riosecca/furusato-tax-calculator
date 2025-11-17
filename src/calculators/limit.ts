import type { FurusatoInput } from "../types/input.js";
import { RESIDENT_TAX_BASIC_RATE, RESIDENT_TAX_SPECIAL_LIMIT_RATE } from "../constants/resident.js";
import type { LimitResult } from "../types/result.js";
import { IncomeTaxBaseResult, calculateTotalIncome } from "./income-tax.js";
import type { ResidentTaxBaseResult } from "./resident-basic.js";
import { roundToYen } from "../utils/rounding.js";

export function calculateFurusatoLimit(
  input: FurusatoInput,
  incomeBase: IncomeTaxBaseResult,
  residentBase: ResidentTaxBaseResult
): LimitResult {
  const totalIncome = calculateTotalIncome(input.income);

  const incomeLimit = totalIncome * 0.4 + 2000; // 控除対象寄付額の逆算（-2000円を戻す）

  const specialRate = 1 - incomeBase.incomeTaxRate - RESIDENT_TAX_BASIC_RATE;
  const residentTaxIncome = residentBase.residentTaxAmount;
  const residentLimit =
    specialRate > 0
      ? residentTaxIncome * RESIDENT_TAX_SPECIAL_LIMIT_RATE / specialRate + 2000
      : Infinity;

  const maxDonationRaw = Math.min(incomeLimit, residentLimit);
  const maxDonation = roundToYen(maxDonationRaw);

  let limitReason: LimitResult["limitReason"] = "None";
  if (maxDonationRaw <= residentLimit && maxDonationRaw === incomeLimit) {
    limitReason = "Income40";
  } else if (maxDonationRaw < incomeLimit && maxDonationRaw === residentLimit) {
    limitReason = "Resident20";
  }

  const donationRemaining = Math.max(maxDonation - input.donatedAlready, 0);

  return {
    maxDonation,
    alreadyDonated: input.donatedAlready,
    donationRemaining,
    limitReason
  };
}
