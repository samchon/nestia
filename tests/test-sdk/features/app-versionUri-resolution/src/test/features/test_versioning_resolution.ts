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
