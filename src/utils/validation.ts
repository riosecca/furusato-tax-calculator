import { FurusatoInput } from "../types/input";

function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number.`);
  }
}

export function validateFurusatoInput(input: FurusatoInput): void {
  if (!input || typeof input !== "object") {
    throw new Error("Input is required.");
  }

  const incomeValues = Object.entries(input.income ?? {});
  incomeValues.forEach(([key, value]) => {
    if (value !== undefined) {
      assertNonNegative(value, `income.${key}`);
    }
  });

  const deductionValues = Object.entries(input.deductions ?? {});
  deductionValues.forEach(([key, value]) => {
    if (value !== undefined) {
      assertNonNegative(value, `deductions.${key}`);
    }
  });

  assertNonNegative(input.donatedAlready, "donatedAlready");
  assertNonNegative(input.donateNow, "donateNow");

  if (input.residentTaxIncome !== undefined) {
    assertNonNegative(input.residentTaxIncome, "residentTaxIncome");
  }

  if (typeof input.useOneStop !== "boolean") {
    throw new Error("useOneStop must be a boolean.");
  }
}
