import assert from "node:assert/strict";
import typia, { tags } from "typia";

import api from "../../api";
import type { ISdkBoundaryParty } from "../../api/structures/ISdkBoundaryParty";

type SdkBoundaryPartyId = string & tags.Format<"uuid">;
type SourceParty = { id: SdkBoundaryPartyId; name: string };
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type ParameterOf<F extends (...args: any[]) => any> = Parameters<F>[1];

/**
 * Verifies cloned imported and inline UUID parameters retain alias identity.
 *
 * Scalar alias degradation to any is invisible to a valid-looking UUID call;
 * independent type controls and rejected literal verdicts distinguish it.
 *
 * 1. Compile six equality/nonany controls against the authored UUID contract.
 * 2. Require cloned and authored validators to accept only the valid UUID.
 * 3. Call imported/inline path routes and the body echo with that same party.
 *
 * @evidence contracts/testing.md#behavioral-verification Six consumer type controls require both imported/inline path types to equal the UUID alias, imported type to equal cloned id, cloned id to equal the source-contract id, and both parameters to differ from any. Two emitted validators must produce true/false/false/false; actual path/body calls return the exact party.
 * @evidence contracts/testing.md#independent-expectations The original PartyId contract is string intersected with typia Format uuid, authored equivalently in this consumer to avoid recompiling producer source. The valid UUID, malformed text, number and null establish independent literal verdicts; the source controller returns id/name or echoes its submitted body.
 * @evidence contracts/testing.md#distinguishing-cases Imported and inline aliases contrast any degradation; four scalar values distinguish UUID constraints, and body-property equality contrasts parameter/body metadata channels.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers and awaits this one named export after the single native-backed consumer compilation; compile-time controls fail that same program and validator/call assertions fail the case.
 * @evidence contracts/e2e.md#necessary-boundary Native resolved parameter metadata, clone type declarations and emitted typia validators must connect to actual generated HTTP requests. A writer-only property check cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution This case shares the one packed installation, producer, generated consumer and backend. It imports no producer TypeScript source and starts no compiler or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity SDK boundary route/type namespaces and stateless original handlers isolate the fixed specimen; no state or connector survives this case. The common entry closes the host after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All original six compile controls and both four-value verdict lists remain, with the equivalent source contract inside the existing consumer. Actual imported/inline/body HTTP echoes strengthen that original generated-declaration/validator connection.
 */
export const test_sdk_boundary_clone_alias_parameters = async (
  connection: api.IConnection,
): Promise<void> => {
  const route = api.functional.sdk_boundary.parties;
  type Imported = ParameterOf<typeof route.at>;
  type Inline = ParameterOf<typeof route.inline>;
  const types: [
    Equal<Imported, SdkBoundaryPartyId>,
    Equal<Inline, SdkBoundaryPartyId>,
    Equal<Imported, ISdkBoundaryParty["id"]>,
    Equal<ISdkBoundaryParty["id"], SourceParty["id"]>,
    Equal<Imported, any>,
    Equal<Inline, any>,
  ] = [true, true, true, true, false, false];
  assert.deepEqual(types, [true, true, true, true, false, false]);
  const values: unknown[] = [
    "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a",
    "not-a-uuid",
    1,
    null,
  ];
  assert.deepEqual(values.map(typia.createIs<Imported>()), [
    true,
    false,
    false,
    false,
  ]);
  assert.deepEqual(values.map(typia.createIs<SdkBoundaryPartyId>()), [
    true,
    false,
    false,
    false,
  ]);
  const party = {
    id: "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a" as SdkBoundaryPartyId,
    name: "party",
  };
  assert.deepEqual(await route.at(connection, party.id), party);
  assert.deepEqual(await route.inline(connection, party.id), party);
  assert.deepEqual(await route.create(connection, party), party);
};
