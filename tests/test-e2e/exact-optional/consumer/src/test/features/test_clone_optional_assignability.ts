import type { IOptional } from "../../api/structures/IOptional";

/**
 * Verifies the original cloned optional type's seventeen assignment verdicts.
 *
 * Exact optional markers differ from explicit undefined only when both the
 * producer and consumer use the original exact flag. These controls consume the
 * actual SDK generated from that same contradictory source premise.
 *
 * 1. Compile the twelve original valid omission and populated assignments.
 * 2. Require all five adjacent invalid assignments to consume their directives.
 * 3. Invoke this matching emitted function after compilation succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual cloned SDK type must accept all twelve authored valid assignments and consume all five expected-error directives in the exact consumer compilation. Wrong acceptance produces an unused-directive failure and wrong rejection produces an ordinary compiler diagnostic.
 * @evidence contracts/testing.md#independent-expectations Original IOptional source semantics under exactOptionalPropertyTypes:true establish omission versus explicitly undefinable values, required neighbors and mappings, and the required tuple element. Literal assignments are copied from the original case rather than inferred from generated output.
 * @evidence contracts/testing.md#distinguishing-cases Omission, present optional/nullable and explicit undefined positives combine with nested, Partial/generic/class/alias/intersection/union/array/tuple shapes. Forbidden optional undefined/string, missing required/mapped fields and empty tuple are the original five negatives.
 * @evidence contracts/testing.md#execution-ownership The sole exact-optional boundary compiles this file with the actual generated SDK and then requires and invokes this matching export. It is not discovered in the ordinary false rich consumer.
 * @evidence contracts/e2e.md#necessary-boundary Native extraction and clone generation must produce declarations with the original actual TypeScript assignment behavior; writer fragment checks alone cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution The exact boundary shares the campaign installation/native cache and owns only two necessary compiler requests and one application-input SDK generation. This function creates no process, host or compiler of its own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One exact producer and consumer preserve the same true flag and independent output roots. The public no-listen app closes in the boundary owner's cleanup and the parent retains raw results/source before sandbox teardown.
 * @evidence contracts/e2e.md#preserved-coverage All original twelve positive and five negative controls remain verbatim below. The general rich consumer retains its own original false premise; no directive is deleted to make that contradictory population compile.
 */
export const test_clone_optional_assignability = (): void => {
  const omitted: Pick<IOptional, "optional" | "nullable" | "explicit"> = {};
  const present: Pick<IOptional, "optional" | "nullable"> = {
    optional: true,
    nullable: null,
  };
  const explicit: Pick<IOptional, "explicit"> = { explicit: undefined };
  const nested: IOptional["nested"] = { requiredInner: true };
  const mapped: IOptional["partial"] = {};
  const generic: IOptional["generic"] = {};
  const instance: IOptional["classValue"] = {};
  const alias: IOptional["alias"] = {};
  const intersection: IOptional["intersection"] = { right: "ok" };
  const union: IOptional["union"] = { kind: "a" };
  const array: IOptional["array"] = [{}];
  const tuple: IOptional["tuple"] = ["ok", true];
  // @ts-expect-error exact optional boolean excludes explicit undefined
  const invalidUndefined: Pick<IOptional, "optional"> = { optional: undefined };
  // @ts-expect-error an optional boolean still excludes strings
  const invalidValue: Pick<IOptional, "optional"> = { optional: "wrong" };
  // @ts-expect-error the required neighbor must remain required
  const invalidRequired: Pick<IOptional, "required"> = {};
  // @ts-expect-error Required removes the mapped optional marker
  const invalidMapped: IOptional["requiredMapped"] = {};
  // @ts-expect-error the required tuple element cannot be omitted
  const invalidTuple: IOptional["tuple"] = [];
  void [
    omitted,
    present,
    explicit,
    nested,
    mapped,
    generic,
    instance,
    alias,
    intersection,
    union,
    array,
    tuple,
    invalidUndefined,
    invalidValue,
    invalidRequired,
    invalidMapped,
    invalidTuple,
  ];
};
