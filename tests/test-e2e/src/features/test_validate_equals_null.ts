import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `null` is compared as a value instead of being walked into.
 *
 * Locks the null branch of the deep comparator. `typeof null` is `"object"`, so
 * the type-mismatch guard does not separate an object from `null`, and the
 * object branch used to dereference it — `TestValidator.equals(object, null)`
 * threw a raw `TypeError` instead of reporting a difference, and
 * `notEquals(object, null)` failed the very case it exists to accept. The
 * nested row is the one that bites in practice: any DTO with a nullable object
 * member hits it whenever the server legitimately answers `null`. The
 * `undefined`, array, and swapped-operand rows are controls, because they
 * already behaved correctly and must keep doing so.
 *
 * 1. Compare an object against `null`, at the top level and nested under a key.
 * 2. Assert each reports a difference rather than throwing, and that `notEquals`
 *    accepts the same pair.
 * 3. Re-assert the neighboring spellings that were already correct.
 */
export function test_validate_equals_null(): void {
  // A difference must be REPORTED, not thrown.
  TestValidator.error("object vs null", () =>
    TestValidator.equals("", { name: "x" }, null),
  );
  TestValidator.error("nested object vs null", () =>
    TestValidator.equals("", { a: { b: 1 } }, { a: null } as any),
  );
  TestValidator.error("array element vs null", () =>
    TestValidator.equals("", [{ b: 1 }], [null] as any),
  );

  // notEquals exists to ACCEPT this pair; it must not throw.
  TestValidator.notEquals("object differs from null", { name: "x" }, null);
  TestValidator.notEquals("nested object differs from null", { a: { b: 1 } }, {
    a: null,
  } as any);

  // null against null is not a difference.
  TestValidator.equals("null vs null", null, null);
  TestValidator.equals("nested null vs null", { a: null }, { a: null });

  // Controls: these already behaved correctly and must be unchanged.
  TestValidator.error("null vs object", () =>
    TestValidator.equals("", null, { name: "x" } as any),
  );
  TestValidator.error("object vs undefined", () =>
    TestValidator.equals("", { name: "x" }, undefined),
  );
  TestValidator.error("array vs null", () =>
    TestValidator.equals("", [1, 2], null),
  );
  TestValidator.error("primitive vs null", () =>
    TestValidator.equals("", 1, null),
  );
  TestValidator.equals("equal objects", { a: { b: 1 } }, { a: { b: 1 } });

  // A key excluded by the exception filter is not compared at all, so a null
  // there stays invisible.
  TestValidator.equals(
    "excluded null key",
    { a: { b: 1 }, skipped: { c: 2 } },
    { a: { b: 1 }, skipped: null } as any,
    (key) => key === "skipped",
  );
}
