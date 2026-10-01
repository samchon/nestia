import { TestValidator } from "@nestia/e2e";
import { runInNewContext } from "node:vm";

/**
 * Verifies JSON comparison preserves record and array meaning across prototypes
 * and JavaScript realms.
 *
 * 1. Compare ordinary and null-prototype records and actual foreign-realm
 *    records/arrays against literal counterparts, including nested values.
 * 2. Distinguish changed leaves, array lengths and array/record mismatches in both
 *    operand directions.
 * 3. Preserve additional actual record keys and skipped undefined keys.
 * 4. Require equals and notEquals to give opposite verdicts for every case.
 *
 * @evidence contracts/testing.md#behavioral-verification Both public comparison operations execute the actual shared walker; acceptance and their specific comparison-error messages distinguish identity-based record checks, same-realm array checks and one-sided array/record classification.
 * @evidence contracts/testing.md#independent-expectations Authored literal verdicts follow from record values, array order and length, and the documented allowance for extra actual record keys. node:vm constructs actual foreign-realm values but does not supply an expected verdict or replace runtime methods.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary/null-prototype/foreign-realm records, foreign and nested arrays, equal/changed leaves, unequal lengths, both array/record directions, extra actual/expected keys and undefined keys cover independent classification and preserved record-key boundaries.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching test-unit entry and calls the built public operations in-process; the short-lived vm context owns no server, installed consumer, native build or child process.
 */
export function test_validate_equals_representations(): void {
  const record = Object.assign(Object.create(null), { value: 1 });
  const cases: Array<[string, unknown, unknown, boolean]> = [
    ["ordinary record", { value: 1 }, { value: 1 }, true],
    ["changed ordinary record", { value: 1 }, { value: 2 }, false],
    [
      "null-prototype records",
      record,
      Object.assign(Object.create(null), { value: 1 }),
      true,
    ],
    ["null-prototype first", record, { value: 1 }, true],
    ["null-prototype second", { value: 1 }, record, true],
    ["changed null-prototype record", record, { value: 2 }, false],
    ["foreign record", runInNewContext("({ value: 1 })"), { value: 1 }, true],
    ["foreign array first", runInNewContext("[1, 2]"), [1, 2], true],
    ["foreign array second", [1, 2], runInNewContext("[1, 2]"), true],
    [
      "nested foreign array",
      runInNewContext("({ values: [1, 2] })"),
      { values: [1, 2] },
      true,
    ],
    ["changed foreign array", runInNewContext("[1, 2]"), [1, 3], false],
    ["shorter foreign array", runInNewContext("[1]"), [1, 2], false],
    ["longer foreign array", runInNewContext("[1, 2]"), [1], false],
    ["record against array", {}, [], false],
    ["array against record", [], {}, false],
    ["extra actual key", { value: 1 }, { value: 1, extra: 2 }, true],
    ["extra expected key", { value: 1, extra: 2 }, { value: 1 }, false],
    [
      "undefined expected key",
      { value: 1, extra: undefined },
      { value: 1 },
      true,
    ],
  ];
  for (const [title, expected, actual, equal] of cases)
    for (const inequality of [false, true]) {
      let error: unknown;
      try {
        if (inequality) TestValidator.notEquals(title, expected, actual);
        else TestValidator.equals(title, expected, actual);
      } catch (exp) {
        error = exp;
      }
      const accepts = inequality ? !equal : equal;
      if (
        accepts
          ? error !== undefined
          : !(error instanceof Error) ||
            !error.message.includes(
              inequality
                ? "values should be different"
                : "found different values",
            )
      )
        throw new Error(
          `${title} (${inequality ? "notEquals" : "equals"}) gave the wrong verdict: ${String(error)}.`,
        );
    }
}
