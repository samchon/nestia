import { HttpError } from "@nestia/fetcher";
import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies the generated HEAD request validates its UUID and remains bodyless.
 *
 * Both real decoding and the generated simulator must accept the bodiless
 * success while retaining parameter validation.
 *
 * 1. Call real and generated simulated HEAD requests with a valid UUID.
 * 2. Require both malformed UUID requests to reject with HTTP400.
 *
 * @evidence contracts/testing.md#behavioral-verification Real and simulated valid UUID calls resolve undefined; both malformed UUID calls reject an installed HttpError with status400.
 * @evidence contracts/testing.md#independent-expectations The authored UUID tag and Nest HEAD void contract independently establish acceptance, undefined and400.
 * @evidence contracts/testing.md#distinguishing-cases Real versus generated simulation and valid versus malformed UUID retain all four original HEAD controls.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one matching named export after its single compilation and awaits the shared connection case; compile controls fail that same program.
 * @evidence contracts/e2e.md#necessary-boundary Native parameter validation, generated HEAD metadata, installed fetcher and emitted simulator must connect; real transport alone does not establish generated simulator validation.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, producer, generated consumer and backend; it creates no compiler, installation or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The sdk_boundary routes and DTO names isolate stateless handlers; request specimens and generated artifact reads belong to this case. The shared entry closes the host after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage The original valid undefined and malformed400 server/simulator controls execute through the shared primary SDK generated with simulate:true; actual execution remains pending.
 */
export const test_sdk_boundary_head_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const head = api.functional.sdk_boundary.transport.head;
  for (const simulate of [false, true]) {
    assert.equal(
      await head(
        { ...connection, simulate },
        "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69",
      ),
      undefined,
      `simulate ${simulate} bodyless success`,
    );
    await assert.rejects(
      () => head({ ...connection, simulate }, "not-a-uuid"),
      (error: unknown) => error instanceof HttpError && error.status === 400,
      `simulate ${simulate} invalid UUID`,
    );
  }
};
