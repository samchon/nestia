import type { IOptional } from "../../api/structures/IOptional";

/**
 * Verifies cloned optional declarations obey TypeScript assignment semantics.
 *
 * These controls belong to the generated consumer's actual compilation, so
 * omission and adjacent invalid values are checked without another compiler. An
 * unused expected-error directive fails that same compilation.
 *
 * 1. Compile omitted, present, explicit-undefined, nested and tuple assignments.
 * 2. Require wrong optional values and missing required members to remain errors.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual generated-consumer compilation accepts twelve authored omission/presence/nested/mapped/class/alias/intersection/union/array/tuple assignments and consumes five required expected-error directives. Wrong admission or rejection fails that same compile before runtime.
 * @evidence contracts/testing.md#independent-expectations Authored IOptional and exactOptionalPropertyTypes establish optional versus explicit-undefined, required-neighbor, Required mapping and required tuple element semantics. The invalid controls are authored independently of generated declarations.
 * @evidence contracts/testing.md#distinguishing-cases Omission, explicit undefined and populated positives contrast invalid undefined/string values, missing required object/mapped fields and empty required tuple. The inline runtime case owns transport and adapters.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This checks declarations produced by the native generator through the actual TypeScript consumer checker. Its type assertions belong to that E2E compilation, not a portable in-process utility call.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Every original assignment and expected-error directive now lives in the ordinary feature consumer program with exactOptionalPropertyTypes enabled. This removes the redundant isolated compiler/process/temporary tree while keeping all controls; no resources or mutable state belong to the runtime function.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
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
