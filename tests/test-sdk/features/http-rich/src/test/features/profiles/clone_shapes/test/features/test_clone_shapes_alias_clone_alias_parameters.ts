import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { CloneShapesAliasIParty as Source } from "../../../../../../structures/clone_shapes/alias/CloneShapesAliasIParty";
import { CloneShapesAliasPartyId } from "../../../../../../structures/clone_shapes/alias/CloneShapesAliasPartyId";
import api from "../../api";
import { CloneShapesAliasIParty as Cloned } from "../../api/structures/CloneShapesAliasIParty";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type ParameterOf<F extends (...args: any[]) => any> = Parameters<F>[1];

/**
 * Verifies a cloned SDK types an alias-backed scalar path parameter as the
 * alias's own structure, the same as a body property of that alias.
 *
 * `export type CloneShapesAliasPartyId = string & tags.Format<"uuid">` reaches
 * a `@TypedParam()` through the SDK's resolved metadata and a `@TypedBody()`
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
 * @evidence contracts/testing.md#behavioral-verification Actual cloned SDK generation and consumer compilation feed the original transport or clone/source equality assertions.
 * @evidence contracts/testing.md#independent-expectations The authored source DTO and literal type, status and boundary expectations establish equivalence independently of emitted clone text.
 * @evidence contracts/testing.md#distinguishing-cases The original six compile-time equal/not-any checks and four UUID/string/number/null verdicts retain imported versus inline scalar alias equivalence.
 * @evidence contracts/testing.md#execution-ownership The matching exported original case is discovered in the shared installed clone_shapes consumer profile.
 * @evidence contracts/e2e.md#necessary-boundary The installed native metadata and public clone generator must emit TypeScript that compiles and preserves source meaning; the HTTP case also executes its generated connection.
 * @evidence contracts/e2e.md#shared-execution Three original fixtures have identical clone-only generation options and combine into one actual SDK generation graph; they share installation, producer, consumer and listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate each original source graph; immutable generated clones and stateless handlers remain valid across all three cases.
 * @evidence contracts/e2e.md#preserved-coverage The complete original assertion body and source graph remain after reversible imports, type identities, routes and discovery names; no additional generated random calls or Swagger outputs are introduced.
 */
export const test_clone_shapes_alias_clone_alias_parameters = (): void => {
  type Imported = ParameterOf<
    typeof api.functional.http_rich.options.clone_shapes.alias.parties.at
  >;
  type Inline = ParameterOf<
    typeof api.functional.http_rich.options.clone_shapes.alias.parties.inline
  >;
  const types: [
    Equal<Imported, CloneShapesAliasPartyId>,
    Equal<Inline, CloneShapesAliasPartyId>,
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
    values.map(typia.createIs<CloneShapesAliasPartyId>()),
  );
};
