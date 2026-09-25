import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "../../api";
import { IVersioned } from "../../api/structures/IVersioned";

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
