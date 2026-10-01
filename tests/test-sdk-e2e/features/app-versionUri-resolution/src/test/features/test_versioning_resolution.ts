import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";

/**
 * Verifies URI versioning resolves each route's versions as NestJS does: the
 * method's own, else the controller's, else the default, else none.
 *
 * Nestia joined the controller's and the method's versions, so a method
 * overriding its controller's version was described at both, and a route with
 * no version and no default got no path at all: the SDK and Swagger left it out
 * and the WebSocket adaptor never served it (#1735).
 *
 * 1. Assert the server answers the unversioned and overriding paths only.
 * 2. Assert the Swagger document lists exactly those paths.
 * 3. Call every HTTP and WebSocket route through the SDK.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct unversioned/override/inherited paths must return 200 while the overridden controller path returns 404; exact Swagger paths, generated HTTP version payloads and both WebSocket versions must match.
 * @evidence contracts/testing.md#independent-expectations The authored OverrideController has controller version one, index/socket method override two and an inherited method; PlainController has no version and Backend sets no default. Nest precedence establishes the independently listed expected routes.
 * @evidence contracts/testing.md#distinguishing-cases Unversioned, inherited and overridden routes contrast the forbidden v1 override route. Both unversioned and method-override WebSocket connections remain; an explicit default-version branch is outside this fixture.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers and awaits this matching exported function against its generated clients and actual backend; each mismatch rejects the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects real Nest method/controller version precedence, generated HTTP/WebSocket accessors, WebSocketAdaptor and Swagger. Pure precedence decisions cannot prove client, document and actual host agree.
 * @evidence contracts/e2e.md#shared-execution All route assertions reuse the feature SDK, generated document and backend. Compatible cohorts share CLI loading and runtime compilation; application-input configuration retains its real configured Nest application rather than a synthetic file-only substitute.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored applications and outputs belong to the isolated feature port/tree. The feature entry finally closes its backend after success, discovery or assertion failure; any WebSocket connector in this case closes in its own finally.
 * @evidence contracts/e2e.md#preserved-coverage Every original direct status, document path, generated payload and WebSocket assertion remains executable. Neighboring prefix and versioning fixtures retain their distinct configurations and routes.
 */
export const test_versioning_resolution = async (
  connection: api.IConnection,
): Promise<void> => {
  const status = async (location: string): Promise<number> =>
    (await fetch(`${connection.host}${location}`)).status;
  TestValidator.equals("plain", await status("/plain"), 200);
  TestValidator.equals("override", await status("/v2/override"), 200);
  TestValidator.equals("overridden", await status("/v1/override"), 404);
  TestValidator.equals("inherit", await status("/v1/override/inherit"), 200);

  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths).sort(), [
    "/plain",
    "/v1/override/inherit",
    "/v2/override",
  ]);

  TestValidator.equals(
    "index",
    (await api.functional.plain.index(connection)).version,
    "none",
  );
  TestValidator.equals(
    "override",
    (await api.functional.v2.override.index(connection)).version,
    "2",
  );
  TestValidator.equals(
    "inherit",
    (await api.functional.v1.override.inherit(connection)).version,
    "1",
  );
  for (const [name, connect] of [
    [
      "none",
      () => api.functional.plain.socket({ host: connection.host }, null),
    ],
    [
      "2",
      () => api.functional.v2.override.socket({ host: connection.host }, null),
    ],
  ] as const) {
    const { connector, driver } = await connect();
    try {
      TestValidator.equals(`socket ${name}`, await driver.version(), name);
    } finally {
      await connector.close();
    }
  }
};
