import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { CloneShapesLiteralILiteralValues as Source } from "../../../../../../structures/clone_shapes/literal/CloneShapesLiteralILiteralValues";
import { CloneShapesLiteralILiteralValues as Cloned } from "../../api/structures/CloneShapesLiteralILiteralValues";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type TagValue<T extends { "typia.tag"?: { value: unknown } }> = NonNullable<
  T["typia.tag"]
>["value"];

/**
 * Verifies the cloned DTO keeps the bigint and non-finite values its source
 * declares.
 *
 * JSON holds neither, and the SDK metadata once carried a bigint as a JSON
 * number, which lost digits past 2^53 and printed `5` for `5n`, and a
 * non-finite number as null, which made the clone writer throw (#1655). The
 * clone is checked against its source: literal types must be the same type,
 * each tag value the same value, even where its type is not the tagged type's,
 * and each tagged type must accept exactly what the source accepts.
 *
 * 1. Assert at compile time that every literal property of the clone is the
 *    source's type.
 * 2. Assert at compile time that the tags whose values are a number on a bigint or
 *    a string on a number or bigint carry the source's values.
 * 3. Validate boundary values against the tagged properties of both types, the NaN
 *    bound an enum member spells included, and assert the same verdicts.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual cloned SDK generation and consumer compilation feed the original transport or clone/source equality assertions.
 * @evidence contracts/testing.md#independent-expectations The authored source DTO and literal type, status and boundary expectations establish equivalence independently of emitted clone text.
 * @evidence contracts/testing.md#distinguishing-cases The original five literal type equalities, three tag-value equalities and six number/bigint boundary verdict comparisons retain bigint precision, infinities and enum NaN bounds.
 * @evidence contracts/testing.md#execution-ownership The matching exported original case is discovered in the shared installed clone_shapes consumer profile.
 * @evidence contracts/e2e.md#necessary-boundary The installed native metadata and public clone generator must emit TypeScript that compiles and preserves source meaning; the HTTP case also executes its generated connection.
 * @evidence contracts/e2e.md#shared-execution Three original fixtures have identical clone-only generation options and combine into one actual SDK generation graph; they share installation, producer, consumer and listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate each original source graph; immutable generated clones and stateless handlers remain valid across all three cases.
 * @evidence contracts/e2e.md#preserved-coverage The complete original assertion body and source graph remain after reversible imports, type identities, routes and discovery names; no additional generated random calls or Swagger outputs are introduced.
 */
export const test_clone_shapes_literal_clone_literal_values = (): void => {
  const literals: [
    Equal<Cloned["literal"], Source["literal"]>,
    Equal<Cloned["negative"], Source["negative"]>,
    Equal<Cloned["huge"], Source["huge"]>,
    Equal<Cloned["infinite"], Source["infinite"]>,
    Equal<Cloned["union"], Source["union"]>,
  ] = [true, true, true, true, true];
  literals;
  const tagged: [
    Equal<TagValue<Cloned["sequenced"]>, TagValue<Source["sequenced"]>>,
    Equal<TagValue<Cloned["named"]>, TagValue<Source["named"]>>,
    Equal<TagValue<Cloned["digits"]>, TagValue<Source["digits"]>>,
  ] = [true, true, true];
  tagged;

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
  TestValidator.equals(
    "nanBound",
    verdicts(typia.createIs<Cloned["nanBound"]>(), numbers),
    verdicts(typia.createIs<Source["nanBound"]>(), numbers),
  );
};
