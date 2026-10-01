import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies original inferred object and void outputs through generated
 * requests.
 *
 * Explicit response annotations bypass the inference branch, and including the
 * Nest Request parameter would corrupt the SDK call signature and transport.
 *
 * 1. Call the generated inferred store with only connection and authored body.
 * 2. Check copied fields and UUID, then invoke the inferred void update.
 * 3. Reject a malformed raw body and successfully store a fresh body afterward.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual generated store/update must compile without a Nest Request argument, echo independent title/body values with a UUID id, and return undefined for inferred void. A raw malformed body must produce400 and the next generated request must recover.
 * @evidence contracts/testing.md#independent-expectations Original source spreads title/body, generates uuid v4 and omits an update return. Authored field literals and a UUID lexical pattern establish expected values without validating against a generated clone of the same metadata.
 * @evidence contracts/testing.md#distinguishing-cases Inferred object versus inferred void and ignored Nest Request versus SDK body distinguish the original generated population. Valid bodies contrast an invalid title type and a subsequent valid request.
 * @evidence contracts/testing.md#execution-ownership One matching export is discovered and awaited in both adapter consumer runs; its generated calls are checked by the existing consumer compile and HTTP mismatches reject its report. The fresh generated population also includes these endpoints.
 * @evidence contracts/e2e.md#necessary-boundary Native return inference and Nest parameter exclusion must reach generated declaration ABI, installed fetcher and actual handler behavior. An authored metadata unit cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution The existing main producer, All generation, consumer compilation, packed installation and sequential adapter hosts supply every request. This case starts no compiler, generator, installation or backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Stateless original handlers use local bodies and a fresh UUID. The native_boundary prefix isolates routes; raw response is consumed before recovery and no persistent fixture state is changed.
 * @evidence contracts/e2e.md#preserved-coverage Original clone-implicit inferred store and void update plus ignored Nest Request source annotations are retained and remain in fresh generated E2E discovery. Independent literal/malformed/recovery checks strengthen this connection; original source-input loader remains separately pending and no legacy feature is removed.
 */
export const test_native_implicit_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = {
    title: "original inferred title",
    body: "original inferred body",
  };
  const article = await api.functional.native_boundary.implicit.store(
    connection,
    input,
  );
  assert.equal(article.title, input.title);
  assert.equal(article.body, input.body);
  assert.match(
    article.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.equal(
    await api.functional.native_boundary.implicit.update(
      connection,
      article.id,
      input,
    ),
    undefined,
  );
  const invalid = await fetch(`${connection.host}/native_boundary/implicit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: 42, body: input.body }),
  });
  await invalid.arrayBuffer();
  assert.equal(invalid.status, 400);
  const recovery = await api.functional.native_boundary.implicit.store(
    connection,
    { title: "recovery", body: "after invalid input" },
  );
  assert.equal(recovery.title, "recovery");
  assert.equal(recovery.body, "after invalid input");
};
