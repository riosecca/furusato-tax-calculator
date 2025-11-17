function assertNonNegative(value, field) {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${field} must be a non-negative finite number.`);
    }
}
export function validateFurusatoInput(input) {
    var _a, _b;
    if (!input || typeof input !== "object") {
        throw new Error("Input is required.");
    }
    const incomeValues = Object.entries((_a = input.income) !== null && _a !== void 0 ? _a : {});
    incomeValues.forEach(([key, value]) => {
        if (value !== undefined) {
            assertNonNegative(value, `income.${key}`);
        }
    });
    const deductionValues = Object.entries((_b = input.deductions) !== null && _b !== void 0 ? _b : {});
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
