import assert from "node:assert/strict";

import api from "../../api";
import type { ISdkBoundaryOptional } from "../../api/structures/ISdkBoundaryOptional";

/**
 * Verifies optional cloned wire shapes retain body/query/header transport.
 *
 * Exact body echoes distinguish omission from fabricated defaults and retain
 * mapped/nested members.
 *
 * 1. Send omitted and populated optional bodies plus the inline response.
 * 2. Reject three invalid bodies and omit optional query/header fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated echo returns exactly both specimens; inline returns only required:ok; missing required, wrong optional string and null return400; query/header returns queryheader.
 * @evidence contracts/testing.md#independent-expectations The authored handler echoes its inputs; the original independent specimens and required/boolean contracts prescribe exact values and400.
 * @evidence contracts/testing.md#distinguishing-cases Omission and presence contrast invalid missing required/wrong/null values, plus inline and optional query/header boundaries.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one matching named export after its single compilation and awaits the shared connection case; compile controls fail that same program.
 * @evidence contracts/e2e.md#necessary-boundary Generated cloned request types, emitted validator/serializer and actual HTTP handler must agree.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, producer, generated consumer and backend; it creates no compiler, installation or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The sdk_boundary routes and DTO names isolate stateless handlers; request specimens and generated artifact reads belong to this case. The shared entry closes the host after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage Original Express optional runtime controls are preserved here. Fastify execution remains with adapter orchestration owner and is not claimed by this case.
 */
export const test_sdk_boundary_optional_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: ISdkBoundaryOptional = {
    required: "ok",
    nested: { requiredInner: true },
    partial: {},
    requiredMapped: { fixed: "ok" },
    generic: {},
    classValue: {},
    alias: {},
    intersection: { right: "ok" },
    union: { kind: "a" },
    array: [{}],
    tuple: ["ok", true],
  };
  assert.deepEqual(
    await api.functional.sdk_boundary.optional.echo(connection, input),
    input,
  );
  const populated = {
    ...input,
    optional: true,
    nullable: null,
    explicit: "value",
  };
  assert.deepEqual(
    await api.functional.sdk_boundary.optional.echo(connection, populated),
    populated,
  );
  assert.deepEqual(
    await api.functional.sdk_boundary.optional.inline(connection),
    { required: "ok" },
  );
  const { required: _required, ...missing } = input;
  for (const invalid of [
    missing,
    { ...input, optional: "wrong" },
    { ...input, optional: null },
  ]) {
    const response = await fetch(`${connection.host}/sdk_boundary/optional`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalid),
    });
    try {
      assert.equal(response.status, 400);
    } finally {
      await response.arrayBuffer();
    }
  }
  assert.equal(
    await api.functional.sdk_boundary.optional.query(
      { ...connection, headers: { "x-required": "header" } },
      { required: "query" },
    ),
    "queryheader",
  );
};
