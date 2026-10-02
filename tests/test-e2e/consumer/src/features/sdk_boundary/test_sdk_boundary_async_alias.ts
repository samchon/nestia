import assert from "node:assert/strict";
import path from "node:path";
import "reflect-metadata";

import api from "../../api";
import type { ISdkBoundaryPoint } from "../../api/structures/ISdkBoundaryPoint";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Verifies awaited aliases connect generated payload declarations to HTTP
 * echoes.
 *
 * The client supplies its outer Promise; the wire payload and its imported type
 * must not contain the controller alias wrapper.
 *
 * 1. Read emitted metadata and compile three exact payload controls plus array
 *    assignability.
 * 2. Call all four generated functions and compare their complete submitted
 *    points.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct/chained/defaulted aliases yield exactly ISdkBoundaryPoint, and readonly compound alias yields a point array assignable to its readonly payload; actual HTTP calls echo every submitted field. Actual emitted OperationMetadata has the awaited scalar identities and valid readonly array syntax/imports.
 * @evidence contracts/testing.md#independent-expectations Library Promise awaiting exposes its type argument; controller methods return the submitted points independently of generated metadata.
 * @evidence contracts/testing.md#distinguishing-cases Direct, chained, defaulted and readonly-array aliases contrast scalar versus array payloads; native units retain foreign-wrapper, nested, conditional and width controls. Array assignability does not demand a particular cloned mutability spelling.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one matching named export after its single compilation and awaits the shared connection case; compile controls fail that same program.
 * @evidence contracts/e2e.md#necessary-boundary Resolved native payload reflection, clone DTO imports, generated outer Promise and real fetcher decoding must connect.
 * @evidence contracts/e2e.md#shared-execution This case reuses the sole packed installation, producer, generated consumer and backend; it creates no compiler, installation or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The sdk_boundary routes and DTO names isolate stateless handlers; request specimens and generated artifact reads belong to this case. The shared entry closes the host after all consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage This adds the actual installed/generated consumer consequence of the confirmed async-alias repair; it does not claim every native projection input has a separate HTTP case.
 */
export const test_sdk_boundary_async_alias = async (
  connection: api.IConnection,
): Promise<void> => {
  const route = api.functional.sdk_boundary.alias;
  const producer = path.resolve(
    __dirname,
    "../../../../../.producer/scenarios/sdk_boundary/controllers/SdkBoundaryAliasController.js",
  );
  const { SdkBoundaryAliasController } = require(producer);
  for (const name of ["direct", "chained", "defaulted", "readonlyPayload"]) {
    const metadata = Reflect.getMetadata(
      "nestia/OperationMetadata",
      SdkBoundaryAliasController.prototype,
      name,
    );
    assert.ok(metadata, `${name} emitted SDK metadata`);
    const expected =
      name === "readonlyPayload"
        ? "readonly ISdkBoundaryPoint[]"
        : "ISdkBoundaryPoint";
    assert.equal(
      metadata.success.type.name.replace(/\s/g, ""),
      expected.replace(/\s/g, ""),
    );
    assert.ok(
      metadata.success.imports.some((entry: { elements: string[] }) =>
        entry.elements.includes("ISdkBoundaryPoint"),
      ),
      `${name} payload import`,
    );
  }
  const types: [
    Equal<Awaited<ReturnType<typeof route.direct>>, ISdkBoundaryPoint>,
    Equal<Awaited<ReturnType<typeof route.chained>>, ISdkBoundaryPoint>,
    Equal<Awaited<ReturnType<typeof route.defaulted>>, ISdkBoundaryPoint>,
    Awaited<
      ReturnType<typeof route.readonly.readonlyPayload>
    > extends readonly ISdkBoundaryPoint[]
      ? true
      : false,
  ] = [true, true, true, true];
  assert.deepEqual(types, [true, true, true, true]);
  const point = { x: 17, y: -29 };
  assert.deepEqual(await route.direct(connection, point), point);
  assert.deepEqual(await route.chained(connection, point), point);
  assert.deepEqual(await route.defaulted(connection, point), point);
  const points = [point, { x: 0, y: 31 }];
  assert.deepEqual(
    await route.readonly.readonlyPayload(connection, points),
    points,
  );
};
