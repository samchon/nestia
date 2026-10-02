import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `equals` and `notEquals` compare dates by their JSON form.
 *
 * The comparison walked the keys of objects, and a `Date` has none, so any two
 * dates compared equal: `equals` passed for different instants and `notEquals`
 * threw for them (#1679).
 *
 * @evidence contracts/testing.md#behavioral-verification TestValidator equals and notEquals distinguish Date instants.
 * @evidence contracts/testing.md#independent-expectations Dates serialize their instants rather than sharing empty enumerable-key identity.
 * @evidence contracts/testing.md#distinguishing-cases Different dates fail equality at top level, nested and array positions; equal instants pass each form.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
