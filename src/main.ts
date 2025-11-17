import { calculateIncomeTaxBase } from "./calculators/income-tax.js";
import { calculateResidentTaxBase } from "./calculators/resident-basic.js";
import { calculateFurusatoLimit } from "./calculators/limit.js";
import { calculateFurusatoTax } from "./index.js";
import type { FurusatoInput } from "./types/input.js";
import type { DeductionBreakdown } from "./types/input.js";

const SPOUSE_DEDUCTION = 380_000;
const DEPENDENT_DEDUCTION = 380_000;

function getNumberFromInput(element: HTMLInputElement | null, label: string): number {
  if (!element) {
    throw new Error(`${label}の入力欄が見つかりませんでした`);
  }

  const value = Number(element.value);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}には0以上の数値を入力してください`);
  }

  return value;
}

function buildDeductions(hasSpouse: boolean, dependents: number): DeductionBreakdown {
  const spouseDeduction = hasSpouse ? SPOUSE_DEDUCTION : 0;
  const dependentDeduction = dependents * DEPENDENT_DEDUCTION;

  return {
    spouseDeduction,
    dependentDeduction
  };
}

function renderResult(target: HTMLElement, message: string): void {
  target.textContent = message;
}

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString()}円`;
}

function setupCalculatorForm(): void {
  const form = document.getElementById("calc-form");
  const incomeInput = document.getElementById("income") as HTMLInputElement | null;
  const spouseSelect = document.getElementById("hasSpouse") as HTMLSelectElement | null;
  const dependentsInput = document.getElementById("dependents") as HTMLInputElement | null;
  const resultElement = document.getElementById("result");

  if (!(form instanceof HTMLFormElement) || !resultElement) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const salaryIncome = getNumberFromInput(incomeInput, "年収（給与収入）");
      const dependentsRaw = getNumberFromInput(dependentsInput, "扶養家族の人数");
      const dependents = Math.floor(dependentsRaw);
      const hasSpouse = (spouseSelect?.value ?? "no") === "yes";

      const deductions = buildDeductions(hasSpouse, dependents);

      const baseInput: FurusatoInput = {
        income: { salaryIncome },
        deductions,
        donatedAlready: 0,
        donateNow: 0,
        useOneStop: true
      };

      const incomeBase = calculateIncomeTaxBase(baseInput);
      const residentBase = calculateResidentTaxBase(baseInput, incomeBase);
      const limit = calculateFurusatoLimit(baseInput, incomeBase, residentBase);

      const inputForLimitDonation: FurusatoInput = {
        ...baseInput,
        donateNow: limit.maxDonation
      };

      const { tax, actualCost } = calculateFurusatoTax(inputForLimitDonation);

      const messages = [
        `控除上限の目安: ${formatCurrency(limit.maxDonation)}`,
        `既寄付分を差し引いた残り寄付可能額: ${formatCurrency(limit.donationRemaining)}`,
        `この上限まで寄付した場合の自己負担目安: ${formatCurrency(actualCost)}`,
        `控除内訳 (所得税 / 住民税 基本 / 住民税 特例): ${[
          formatCurrency(tax.incomeTax),
          formatCurrency(tax.residentBasic),
          formatCurrency(tax.residentSpecial)
        ].join(" / ")}`,
        `試算に使った前提: 年収 ${formatCurrency(salaryIncome)}, 配偶者${
          hasSpouse ? "あり" : "なし"
        } / 扶養家族 ${dependents}人`
      ];

      renderResult(resultElement, messages.join("\n"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "計算中に予期せぬエラーが発生しました";
      renderResult(resultElement, message);
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCalculatorForm);
  } else {
    setupCalculatorForm();
  }
}
