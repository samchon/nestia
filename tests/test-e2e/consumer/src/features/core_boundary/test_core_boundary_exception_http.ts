import { HttpError } from "@nestia/fetcher";
import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies local exception filters and registered conversions preserve HTTP
 * errors.
 *
 * An in-process specificity permutation cannot prove that converted errors and
 * parameter failures reach the installed Nest filter and generated client.
 *
 * 1. Run valid, malformed and recovery inputs through the five original filter
 *    paths.
 * 2. Require each original domain conversion and repeat descendant/ancestor
 *    requests after failure.
 * 3. Observe a successful unfiltered health response after intentional errors.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated calls require filter statuses400/422/400/400/500 and the original customized message, then manager statuses400/409/404/410 and literal converter messages.
 * @evidence contracts/testing.md#independent-expectations Original feature closures and HttpException constructors provide literal status/message expectations; submitted article/query/UUID values supply positive results.
 * @evidence contracts/testing.md#distinguishing-cases Body, path and query each have valid/rejected/recovery controls. Typed422 and ordinary Nest500 sources distinguish filter assembly, while deepest/ancestor/unrelated manager requests distinguish specificity and recovery.
 * @evidence contracts/testing.md#execution-ownership The sole generated consumer discovers this matching named export and awaits it against each shared adapter connection. Private error helpers remain reviewed within this operation.
 * @evidence contracts/e2e.md#necessary-boundary Method-local Nest filters, native validators, route_error conversion and generated HttpError wrapping must connect over real HTTP.
 * @evidence contracts/e2e.md#shared-execution All requests reuse the single packed installation, rich producer, generated consumer and sequential Express/Fastify applications; this case adds no compiler, generator, backend or client process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Filter methods have no mutable request state. Controller initialization installs only feature-local constructors in the original order and destruction erases only those identities before the next adapter; this case never mutates the registry.
 * @evidence contracts/e2e.md#preserved-coverage The original exception-filter HTTP5 statuses plus MESSAGE and exception-manager-order HTTP4 statuses remain here. The portable 24-order specificity matrix remains in the canonical pure unit; this does not claim that matrix runs over HTTP.
 */
export const test_core_boundary_exception_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const filtered = api.functional.core_boundary.filter;
  const manager = api.functional.core_boundary.manager;
  const expectError = async (
    task: () => Promise<unknown>,
    status: number,
    message: string,
  ): Promise<void> => {
    const error: unknown = await task().then(
      () => null,
      (caught: unknown) => caught,
    );
    assert.ok(
      error instanceof HttpError,
      "generated call must reject as HttpError",
    );
    assert.equal(error.status, status);
    assert.ok(error.message.includes(message), error.message);
  };
  const message = "Customized error message.";
  const input = { title: "valid article", body: "text", files: [] };
  assert.deepEqual(await filtered.typedBody(connection, input), input);
  await expectError(
    () => filtered.typedBody(connection, {} as typeof input),
    400,
    message,
  );
  assert.deepEqual(await filtered.typedBody(connection, input), input);
  const id = "00000000-0000-4000-8000-000000000000";
  assert.equal(await filtered.typedParam(connection, id), id);
  await expectError(
    () => filtered.typedParam(connection, "abcd"),
    400,
    message,
  );
  assert.equal(await filtered.typedParam(connection, id), id);
  const attachment = {
    name: "file",
    extension: "txt",
    url: "https://example.com/file.txt",
  };
  assert.deepEqual(
    await filtered.typedQuery(connection, attachment),
    attachment,
  );
  await expectError(
    () => filtered.typedQuery(connection, {} as typeof attachment),
    400,
    message,
  );
  assert.deepEqual(
    await filtered.typedQuery(connection, attachment),
    attachment,
  );
  await expectError(() => filtered.typedManual(connection), 422, message);
  assert.deepEqual(await filtered.health(connection), { healthy: true });
  await expectError(() => filtered.internal(connection), 500, message);
  assert.deepEqual(await filtered.health(connection), { healthy: true });
  for (const [task, status, label] of [
    [() => manager.domain(connection), 400, "domain"],
    [() => manager.other(connection), 409, "other"],
    [() => manager.notFound(connection), 404, "not found"],
    [() => manager.gone(connection), 410, "gone"],
    [() => manager.gone(connection), 410, "gone"],
    [() => manager.notFound(connection), 404, "not found"],
    [() => manager.domain(connection), 400, "domain"],
    [() => manager.other(connection), 409, "other"],
  ] as const)
    await expectError(task, status, label);
  assert.deepEqual(await filtered.health(connection), { healthy: true });
};
