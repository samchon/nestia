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
 * @evidence contracts/testing.md#behavioral-verification Checks generated parameter types equal PartyId and not any, then compares UUID and invalid-input verdicts.
 * @evidence contracts/testing.md#independent-expectations The authored PartyId alias and TypeScript type equality establish the expected parameter representation.
 * @evidence contracts/testing.md#distinguishing-cases Imported and inline aliases, UUID, non-UUID, number and null distinguish lost alias provenance and validation domains.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks generated parameter types equal PartyId and not any, then compares UUID and invalid-input verdicts. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Imported and inline aliases, UUID, non-UUID, number and null distinguish lost alias provenance and validation domains. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
  TestValidator.equals(
    "verdicts",
    values.map(typia.createIs<Imported>()),
    values.map(typia.createIs<PartyId>()),
  );
};
