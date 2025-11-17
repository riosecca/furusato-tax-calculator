import { FurusatoInput } from "../types/input";
import { TaxBreakdown } from "../types/result";
import { RESIDENT_TAX_BASIC_RATE, RESIDENT_TAX_SPECIAL_LIMIT_RATE } from "../constants/resident";
import { roundToYen } from "../utils/rounding";
import { IncomeTaxBaseResult } from "./income-tax";
import { ResidentTaxBaseResult } from "./resident-basic";

function createTaxBreakdown(
  donationTarget: number,
  incomeBase: IncomeTaxBaseResult,
  residentBase: ResidentTaxBaseResult
): TaxBreakdown {
  const incomeTaxDeduction = roundToYen(donationTarget * incomeBase.incomeTaxRate);
  const residentBasicDeduction = roundToYen(donationTarget * RESIDENT_TAX_BASIC_RATE);

  const specialTheoretical = donationTarget * (1 - incomeBase.incomeTaxRate - RESIDENT_TAX_BASIC_RATE);
  const specialLimit = residentBase.residentTaxAmount * RESIDENT_TAX_SPECIAL_LIMIT_RATE;
  const residentSpecialDeduction = roundToYen(Math.min(Math.max(specialTheoretical, 0), specialLimit));

  const total = incomeTaxDeduction + residentBasicDeduction + residentSpecialDeduction;

  return {
    incomeTax: incomeTaxDeduction,
    residentBasic: residentBasicDeduction,
    residentSpecial: residentSpecialDeduction,
    total
  };
}

function createOneStopBreakdown(
  donationTarget: number,
  incomeBase: IncomeTaxBaseResult,
  residentBase: ResidentTaxBaseResult
): TaxBreakdown {
  const incomeTaxDeduction = 0; // 確定申告をしないため所得税分の控除はない
  const residentBasicDeduction = roundToYen(donationTarget * RESIDENT_TAX_BASIC_RATE);

  const incomeEquivalent = donationTarget * incomeBase.incomeTaxRate;
  const specialTheoretical = donationTarget * (1 - RESIDENT_TAX_BASIC_RATE) - residentBasicDeduction + incomeEquivalent;
  const specialLimit = residentBase.residentTaxAmount * RESIDENT_TAX_SPECIAL_LIMIT_RATE;
  const residentSpecialDeduction = roundToYen(Math.min(Math.max(specialTheoretical, 0), specialLimit));

  const total = incomeTaxDeduction + residentBasicDeduction + residentSpecialDeduction;

  return {
    incomeTax: incomeTaxDeduction,
    residentBasic: residentBasicDeduction,
    residentSpecial: residentSpecialDeduction,
    total
  };
}

export function calculateFurusatoDeduction(
  input: FurusatoInput,
  incomeBase: IncomeTaxBaseResult,
  residentBase: ResidentTaxBaseResult
): TaxBreakdown {
  const totalDonation = input.donatedAlready + input.donateNow;
  const donationTarget = Math.max(totalDonation - 2000, 0);

  if (input.useOneStop) {
    return createOneStopBreakdown(donationTarget, incomeBase, residentBase);
  }

  return createTaxBreakdown(donationTarget, incomeBase, residentBase);
}
