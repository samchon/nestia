import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IParty as Cloned } from "../../api/structures/IParty";
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
