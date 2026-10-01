import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IParty as Cloned } from "@api/lib/structures/IParty";

import { IParty as Source } from "../../structures/IParty";
import { PartyId } from "../../structures/PartyId";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type ParameterOf<F extends (...args: any[]) => any> = Parameters<F>[1];

/**
 * Verifies a cloned SDK types an alias-backed scalar path parameter as the
 * alias's own structure, the same as a body property of that alias.
 *
 * `export type PartyId = string & tags.Format<"uuid">` reaches a
 * `@TypedParam()` through the SDK's resolved metadata and a `@TypedBody()`
 * property through its primitive metadata, and #1661 reported the parameter
 * degrading to `any` in a cloned SDK. Both metadata carry the same structure
 * for every scalar alias shape, so the invariant is pinned here: the parameter
 * is typed exactly as its source alias, never `any`, whether the alias is
 * imported from another module or written inline.
 *
 * 1. Assert at compile time that both routes' cloned parameter types equal the
 *    source alias and the cloned body property type, and that neither is
 *    `any`.
 * 2. Validate boundary values against the cloned and the source types and assert
 *    the same verdicts.
 *
 * @evidence contracts/testing.md#behavioral-verification The real generated consumer must compile both imported/inline parameter aliases equal to PartyId and cloned id, and unequal to any. Both generated and authored UUID validators must produce the independent true/false/false/false verdict list.
 * @evidence contracts/testing.md#independent-expectations Authored PartyId is a UUID-tagged string and PartyController accepts the imported and inline equivalent spellings. A valid UUID, malformed text, number and null independently establish expected verdicts; comparing two generated validators alone would share their defects.
 * @evidence contracts/testing.md#distinguishing-cases Imported and inline UUID aliases, cloned body-property identity, any exclusion and four neighboring values distinguish degradation to any or loss of UUID format. Other clone cases own mapped/optional fields.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This owns generated declaration compatibility and compiled validation of cloned types; its fixture generation and installed native/compiler/runtime connection cannot be proved by source-type equality alone.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity All type controls and validators share the generated feature consumer compilation and runtime. No additional installation/compiler/server is started; values are local and there is no retained mutable request state.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
 */
export const test_clone_alias_parameters = (): void => {
  type Imported = ParameterOf<typeof api.functional.parties.at>;
  type Inline = ParameterOf<typeof api.functional.parties.inline>;
  const types: [
    Equal<Imported, PartyId>,
    Equal<Inline, PartyId>,
    Equal<Imported, Cloned["id"]>,
    Equal<Cloned["id"], Source["id"]>,
    Equal<Imported, any>,
    Equal<Inline, any>,
  ] = [true, true, true, true, false, false];
  types;

  const values: unknown[] = [
    "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a",
    "not-a-uuid",
    1,
    null,
  ];
  TestValidator.equals("verdicts", values.map(typia.createIs<Imported>()), [
    true,
    false,
    false,
    false,
  ]);
  TestValidator.equals(
    "source verdicts",
    values.map(typia.createIs<PartyId>()),
    [true, false, false, false],
  );
};
