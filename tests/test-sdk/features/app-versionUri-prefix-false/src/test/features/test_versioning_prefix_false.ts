import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";
import { IVersioned } from "@api/lib/structures/IVersioned";

/**
 * Verifies URI versioning with `prefix: false` is described and served at the
 * bare version, as NestJS routes it.
 *
 * NestJS's `RoutePathFactory.getVersionPrefix()` returns no prefix when the
 * option is `false`, so the routes live at `/1/ver`. nestia mapped `false` to
 * the default `"v"`, so the SDK and Swagger described `/v1/ver`, where every
 * call failed with 404, and the WebSocket adaptor served its routes there
 * (#1670).
 *
 * 1. Assert the server answers `/1/ver` and not `/v1/ver`.
 * 2. Assert the Swagger document lists the bare-version paths.
 * 3. Call both HTTP routes and the WebSocket route through the SDK.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks bare /1 routes versus rejected /v1 routes, exact Swagger paths, two HTTP echoes and WebSocket version.
 * @evidence contracts/testing.md#independent-expectations Nest URI prefix=false removes the v prefix; authored controllers supply versions and echo values.
 * @evidence contracts/testing.md#distinguishing-cases Bare and prefixed paths are opposite controls; HTTP and WebSocket clients must retain the same version decision.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks bare /1 routes versus rejected /v1 routes, exact Swagger paths, two HTTP echoes and WebSocket version. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Bare and prefixed paths are opposite controls; HTTP and WebSocket clients must retain the same version decision. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_versioning_prefix_false = async (
  connection: api.IConnection,
): Promise<void> => {
  const status = async (location: string): Promise<number> =>
    (await fetch(`${connection.host}${location}`)).status;
  TestValidator.equals("bare", await status("/1/ver"), 200);
  TestValidator.equals("prefixed", await status("/v1/ver"), 404);

  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths).sort(), [
    "/1/ver",
    "/2/ver/{id}",
  ]);

  TestValidator.equals("index", await api.functional._1.ver.index(connection), {
    version: "1",
    id: null,
  } satisfies IVersioned);
  TestValidator.equals("at", await api.functional._2.ver.at(connection, "7"), {
    version: "2",
    id: "7",
  } satisfies IVersioned);

  const { connector, driver } = await api.functional._1.ver.socket(
    { host: connection.host },
    null,
  );
  try {
    TestValidator.equals("socket", await driver.version(), "1");
  } finally {
    await connector.close();
  }
};
