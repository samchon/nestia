import { TestValidator } from "../../../../packages/e2e/lib";

/**
 * Verifies `equals` and `notEquals` compare dates by their JSON form.
 *
 * The comparison walked the keys of objects, and a `Date` has none, so any two
 * dates compared equal: `equals` passed for different instants and `notEquals`
 * threw for them (#1679).
 *
 * 1. Compare authored equal and distinct instants at top level and nested.
 * 2. Require different instants to reject equality and satisfy notEquals.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls equals and notEquals on dates and checks equality for identical instants and rejection for different instants.
 * @evidence contracts/testing.md#independent-expectations The authored epoch and one-day timestamps have independently distinct JSON representations.
 * @evidence contracts/testing.md#distinguishing-cases Equal and unequal instants are exercised at the top level, in an object and in an array; different dates also satisfy notEquals.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
 */

export async function test_validate_equals_date(): Promise<void> {
  const early: Date = new Date(0);
  const late: Date = new Date(86_400_000);

  TestValidator.error("top-level", () =>
    TestValidator.equals("date", early, late),
  );
  TestValidator.error("nested", () =>
    TestValidator.equals("nested", { at: early }, { at: late }),
  );
  TestValidator.error("array", () =>
    TestValidator.equals("array", [early], [late]),
  );
  TestValidator.notEquals("different", early, late);

  TestValidator.equals("same", early, new Date(0));
  TestValidator.equals("same nested", { at: early }, { at: new Date(0) });
  TestValidator.equals("same array", [early], [new Date(0)]);
}
