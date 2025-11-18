import { RESIDENT_TAX_BASIC_RATE, RESIDENT_TAX_SPECIAL_LIMIT_RATE } from "../constants/resident.js";
import { roundToYen } from "../utils/rounding.js";
function createTaxBreakdown(donationTarget, incomeBase, residentBase) {
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
function createOneStopBreakdown(donationTarget, residentBase) {
    const incomeTaxDeduction = 0; // 確定申告をしないため所得税分の控除はない
    const residentBasicDeduction = roundToYen(donationTarget * RESIDENT_TAX_BASIC_RATE);
    // ワンストップ特例時は住民税の基本分(10%)と特例分(90%)で合計100%控除となるのが基本形。
    // 所得税率は控除に影響しないため、余計な計算をせずシンプルに90%分を上限チェックにかける。
    const specialTheoretical = donationTarget * (1 - RESIDENT_TAX_BASIC_RATE);
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
export function calculateFurusatoDeduction(input, incomeBase, residentBase) {
    const totalDonation = input.donatedAlready + input.donateNow;
    const donationTarget = Math.max(totalDonation - 2000, 0);
    if (input.useOneStop) {
        return createOneStopBreakdown(donationTarget, residentBase);
    }
    return createTaxBreakdown(donationTarget, incomeBase, residentBase);
}
