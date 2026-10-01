import { HttpError } from "@nestia/fetcher";
import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies range and permission metadata remain connected to actual error
 * transport.
 *
 * The current SDK is nonpropagating, so generated rejection and raw literal
 * wire bodies complement the alternate SDK's resolved propagation verdicts.
 *
 * 1. Require range404 with message missing through the real host and generated
 *    client.
 * 2. Exercise all eight permission route/member specimens with exact401 literal
 *    bodies.
 *
 * @evidence contracts/testing.md#behavioral-verification Real range response has status404/message missing and generated range.get rejects HttpError404; eight raw permission requests retain exact401 literals. Each route/member failure is aggregated without preventing the remaining specimens.
 * @evidence contracts/testing.md#independent-expectations The original handlers throw NotFoundException(missing) or UnauthorizedException(permission); the scoped original filter returns exception.message verbatim.
 * @evidence contracts/testing.md#distinguishing-cases Range status family metadata differs from literal401 permission unions; all original success/get,success/union,fail/get and fail/composite members remain as actual raw controls.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer discovers this one matching named export and awaits its actual connection/artifact assertions after the single consumer compilation.
 * @evidence contracts/e2e.md#necessary-boundary Authored TypedException metadata, native route analysis, installed generated error behavior and actual exception filter must connect.
 * @evidence contracts/e2e.md#shared-execution One packed installation, producer, generated consumer and backend supply these observations; no additional compiler or host is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity SDK boundary routes and type names isolate these stateless specimens. Reads concern only the current sandbox artifacts and every acquired response/reader is consumed or released before the common host closes.
 * @evidence contracts/e2e.md#preserved-coverage Original error specimens and wire status/body controls have these destinations. Resolved propagation success:false/data, generated quoted range-key syntax and five type bounds belong to test_sdk_boundary_error_propagation; neither case has executed in the shared gate yet.
 */
export const test_sdk_boundary_error_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const failures: Error[] = [];
  try {
    const range = await fetch(`${connection.host}/sdk_boundary/range`);
    assert.equal(range.status, 404);
    assert.equal((await range.json()).message, "missing");
    await assert.rejects(
      () => api.functional.sdk_boundary.range.get(connection),
      (error: unknown) => error instanceof HttpError && error.status === 404,
    );
  } catch (error) {
    failures.push(
      new Error("range status/body/generated rejection", { cause: error }),
    );
  }
  for (const [route, value] of [
    ["success", "INVALID_PERMISSION"],
    ["success/REQUIRED_PERMISSION", "REQUIRED_PERMISSION"],
    ["success/EXPIRED_PERMISSION", "EXPIRED_PERMISSION"],
    ["fail/INVALID_PERMISSION", "INVALID_PERMISSION"],
    ["fail/EXPIRED_PERMISSION", "EXPIRED_PERMISSION"],
    ["fail/composite/REQUIRED_PERMISSION", "REQUIRED_PERMISSION"],
    ["fail/composite/INVALID_PERMISSION", "INVALID_PERMISSION"],
    ["fail/composite/EXPIRED_PERMISSION", "EXPIRED_PERMISSION"],
  ] as const) {
    try {
      const response = await fetch(
        `${connection.host}/sdk_boundary/permission/${route}`,
      );
      const body = await response.text();
      assert.equal(response.status, 401, route);
      assert.equal(body, value, route);
    } catch (error) {
      failures.push(new Error(`permission ${route}`, { cause: error }));
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "SDK boundary error transport");
};
