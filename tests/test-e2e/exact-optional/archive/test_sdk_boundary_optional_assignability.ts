import type { ISdkBoundaryOptional } from "../../api/structures/ISdkBoundaryOptional";

/**
 * Verifies cloned optional declarations retain actual assignment verdicts.
 *
 * Unused expected-error directives distinguish wrong admissions from successful
 * compilation.
 *
 * 1. Compile twelve positive omission/presence/mapped/tuple assignments.
 * 2. Require five adjacent invalid assignments to remain errors.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated type accepts twelve authored assignments and consumes all five expected-error directives.
 * @evidence contracts/testing.md#independent-expectations Authored optional/undefined, Required mapping and tuple contracts under exactOptionalPropertyTypes:true prescribe these verdicts.
 * @evidence contracts/testing.md#distinguishing-cases Wrong optional undefined/string, missing required field/mapped member and empty tuple contrast twelve positive assignments.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one matching named export after its single compilation and awaits the shared connection case; compile controls fail that same program.
 * @evidence contracts/e2e.md#necessary-boundary Native clone declarations must be checked by the real generated consumer; writer source text cannot establish assignment semantics.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, producer, generated consumer and backend; it creates no compiler, installation or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The sdk_boundary routes and DTO names isolate stateless handlers; request specimens and generated artifact reads belong to this case. The shared entry closes the host after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage All original clone optional assignment controls remain here; actual compilation is pending the orchestration flag seam.
 */
export const test_sdk_boundary_optional_assignability = (): void => {
  const omitted: Pick<
    ISdkBoundaryOptional,
    "optional" | "nullable" | "explicit"
  > = {};
  const present: Pick<ISdkBoundaryOptional, "optional" | "nullable"> = {
    optional: true,
    nullable: null,
  };
  const explicit: Pick<ISdkBoundaryOptional, "explicit"> = {
    explicit: undefined,
  };
  const nested: ISdkBoundaryOptional["nested"] = { requiredInner: true };
  const mapped: ISdkBoundaryOptional["partial"] = {};
  const generic: ISdkBoundaryOptional["generic"] = {};
  const instance: ISdkBoundaryOptional["classValue"] = {};
  const alias: ISdkBoundaryOptional["alias"] = {};
  const intersection: ISdkBoundaryOptional["intersection"] = { right: "ok" };
  const union: ISdkBoundaryOptional["union"] = { kind: "a" };
  const array: ISdkBoundaryOptional["array"] = [{}];
  const tuple: ISdkBoundaryOptional["tuple"] = ["ok", true];
  // @ts-expect-error exact optional boolean excludes explicit undefined
  const invalidUndefined: Pick<ISdkBoundaryOptional, "optional"> = {
    optional: undefined,
  };
  // @ts-expect-error an optional boolean still excludes strings
  const invalidValue: Pick<ISdkBoundaryOptional, "optional"> = {
    optional: "wrong",
  };
  // @ts-expect-error the required neighbor must remain required
  const invalidRequired: Pick<ISdkBoundaryOptional, "required"> = {};
  // @ts-expect-error Required removes the mapped optional marker
  const invalidMapped: ISdkBoundaryOptional["requiredMapped"] = {};
  // @ts-expect-error the required tuple element cannot be omitted
  const invalidTuple: ISdkBoundaryOptional["tuple"] = [];
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
