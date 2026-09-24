import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `equals` and `notEquals` compare dates by their JSON form.
 *
 * The comparison walked the keys of objects, and a `Date` has none, so any two
 * dates compared equal: `equals` passed for different instants and `notEquals`
 * threw for them (#1679).
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
