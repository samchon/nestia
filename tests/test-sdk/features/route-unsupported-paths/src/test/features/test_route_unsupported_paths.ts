import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";
import { WebSocketConnector } from "tgrid";

import api from "@api";
import { IPathEcho } from "@api/lib/structures/IPathEcho";

/**
 * Verifies routes the SDK and Swagger cannot describe are left out whole, while
 * the others are generated.
 *
 * A NestJS 11 wildcard (`files/*path`) spans several segments and an optional
 * segment (`users{/:id}`) may be absent; neither is one OpenAPI path parameter
 * or one SDK argument. The SDK warned it did not compose a wildcard method but
 * kept the operation with no path, so Swagger described it at the controller's
 * own path with a parameter the path lacks and `nestia sdk` crashed; it read
 * the optional segment as a required parameter; and a controller whose only
 * path was a wildcard was mounted at the root (#1677).
 *
 * 1. Assert the server serves every route as Express 5 routes it.
 * 2. Assert the Swagger document and the SDK hold the describable route only.
 * 3. Call that route through the SDK.
 */
export const test_route_unsupported_paths = async (
  connection: api.IConnection,
): Promise<void> => {
  const text = async (location: string): Promise<unknown> =>
    (await fetch(`${connection.host}${location}`)).json();
  TestValidator.equals(
    "wildcard",
    await text("/paths/files/a/b.txt"),
    "a,b.txt",
  );
  TestValidator.equals("optional absent", await text("/paths/users"), "none");
  TestValidator.equals("optional present", await text("/paths/users/7"), "7");
  TestValidator.equals("controller", await text("/assets/x/y"), "x,y");

  const raw: WebSocketConnector<undefined, null, IPathEcho> =
    new WebSocketConnector(undefined, null);
  await raw.connect(
    `${connection.host.replace(/^http/, "ws")}/paths/socket/a/b`,
  );
  try {
    TestValidator.equals("socket", await raw.getDriver().echo(), "a/b");
  } finally {
    await raw.close();
  }

  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths), ["/paths/ping"]);
  TestValidator.equals("sdk", Object.keys(api.functional), ["paths"]);
  TestValidator.equals("sdk paths", Object.keys(api.functional.paths), [
    "ping",
  ]);
  TestValidator.equals(
    "ping",
    await api.functional.paths.ping(connection),
    "pong",
  );
};
