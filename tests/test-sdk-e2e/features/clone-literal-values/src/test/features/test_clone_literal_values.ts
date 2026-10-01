import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { ILiteralValues as Cloned } from "@api/lib/structures/ILiteralValues";

import { ILiteralValues as Source } from "../../structures/ILiteralValues";

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
 * @evidence contracts/testing.md#behavioral-verification Generated clone literal/tag types must compile equal to their authored counterparts, both bigint range validators must produce false/true/true/false, and the remaining selected clone/source numeric-bound verdict lists must agree.
 * @evidence contracts/testing.md#independent-expectations Authored ILiteralValues supplies 5n/-7n/large bigint/infinity literals and cross-kind tag values. Inclusive minimum3n/maximum2^53 independently establish the bigint verdict list. Other numeric checks share the typia validator oracle and cannot independently certify its infinity/NaN rules.
 * @evidence contracts/testing.md#distinguishing-cases Bigints below/at/beyond the inclusive bounds, digits above2^53, positive/negative infinity, finite boundaries and a NaN enum bound remain. Number/string tag arguments on bigint/number types contrast tag-value kinds rather than merely matching names.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This owns actual native metadata encoding, generated clone declarations and consumer compilation/runtime validation. Authored literal identities and generated-source validators cannot be replaced by a committed snapshot.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
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
    [false, true, true, false],
  );
  TestValidator.equals(
    "source ranged",
    verdicts(typia.createIs<Source["ranged"]>(), bigints),
    [false, true, true, false],
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
