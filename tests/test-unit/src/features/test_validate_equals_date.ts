import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `equals` and `notEquals` compare dates by their JSON form.
 *
 * The comparison walked the keys of objects, and a `Date` has none, so any two
 * dates compared equal: `equals` passed for different instants and `notEquals`
 * threw for them (#1679).
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `equals` and `notEquals` on `Date` values and asserts the verdicts, which fails when dates are walked as objects with no keys and any two compare equal.
 * @evidence contracts/testing.md#independent-expectations Two dates are equal exactly when they name the same instant, which is the JSON form the doc states, and the test writes the instants literally.
 * @evidence contracts/testing.md#distinguishing-cases Equal and different dates at the top level, nested in an object, and in an array separate a comparison that handles only one position.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
