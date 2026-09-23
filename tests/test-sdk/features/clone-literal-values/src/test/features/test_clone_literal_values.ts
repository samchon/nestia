import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { ILiteralValues as Cloned } from "@api/lib/structures/ILiteralValues";

import { ILiteralValues as Source } from "../../structures/ILiteralValues";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Verifies the cloned DTO keeps the bigint and non-finite values its source
 * declares.
 *
 * JSON holds neither, and the SDK metadata once carried a bigint as a JSON
 * number, which lost digits past 2^53 and printed `5` for `5n`, and a
 * non-finite number as null, which made the clone writer throw (#1655). The
 * clone is checked against its source: literal types must be the same type, and
 * each tagged type must accept exactly what the source accepts.
 *
 * 1. Assert at compile time that every literal property of the clone is the
 *    source's type.
 * 2. Validate boundary values against the tagged properties of both types and
 *    assert the same verdicts.
 */
export const test_clone_literal_values = (): void => {
  const literals: [
    Equal<Cloned["literal"], Source["literal"]>,
    Equal<Cloned["negative"], Source["negative"]>,
    Equal<Cloned["huge"], Source["huge"]>,
    Equal<Cloned["infinite"], Source["infinite"]>,
    Equal<Cloned["union"], Source["union"]>,
  ] = [true, true, true, true, true];
  literals;

  const verdicts = (validate: (input: unknown) => boolean, values: unknown[]) =>
    values.map(validate);
  const numbers: number[] = [-Infinity, -1, 0, 3, 1e308, Infinity];
  const bigints: bigint[] = [2n, 3n, 9007199254740992n, 9007199254740993n];
  TestValidator.equals(
    "ranged",
    verdicts(typia.createIs<Cloned["ranged"]>(), bigints),
    verdicts(typia.createIs<Source["ranged"]>(), bigints),
  );
  TestValidator.equals(
    "bounded",
    verdicts(typia.createIs<Cloned["bounded"]>(), numbers),
    verdicts(typia.createIs<Source["bounded"]>(), numbers),
  );
  TestValidator.equals(
    "low",
    verdicts(typia.createIs<Cloned["low"]>(), numbers),
    verdicts(typia.createIs<Source["low"]>(), numbers),
  );
  TestValidator.equals(
    "finite",
    verdicts(typia.createIs<Cloned["finite"]>(), numbers),
    verdicts(typia.createIs<Source["finite"]>(), numbers),
  );
  TestValidator.equals(
    "upper",
    verdicts(typia.createIs<Cloned["upper"]>(), numbers),
    verdicts(typia.createIs<Source["upper"]>(), numbers),
  );
};
