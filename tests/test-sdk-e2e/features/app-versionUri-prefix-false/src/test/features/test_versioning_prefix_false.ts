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
 * @evidence contracts/testing.md#behavioral-verification Direct bare-version HTTP must return 200 and v-prefixed HTTP 404; exact document paths, two complete SDK payloads and WebSocket version one must also agree.
 * @evidence contracts/testing.md#independent-expectations Backend explicitly enables URI versioning with prefix false. Authored route versions one/two and their literal handlers establish bare paths and payloads independently of generator output.
 * @evidence contracts/testing.md#distinguishing-cases Bare and wrongly prefixed paths differ by only v; two versions and one real WebSocket connection pin shared HTTP/WebSocket composition. The complete expected path list excludes unintended duplicates.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers and awaits this matching exported function against its generated clients and actual backend; each mismatch rejects the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects Nest URI version routing, generated HTTP/WebSocket accessors, WebSocketAdaptor and Swagger serialization. A version-prefix unit cannot establish the assembled host serves the generated path.
 * @evidence contracts/e2e.md#shared-execution All route assertions reuse the feature SDK, generated document and backend. Compatible cohorts share CLI loading and runtime compilation; application-input configuration retains its real configured Nest application rather than a synthetic file-only substitute.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored applications and outputs belong to the isolated feature port/tree. The feature entry finally closes its backend after success, discovery or assertion failure; any WebSocket connector in this case closes in its own finally.
 * @evidence contracts/e2e.md#preserved-coverage Every original direct status, document path, generated payload and WebSocket assertion remains executable. Neighboring prefix and versioning fixtures retain their distinct configurations and routes.
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
