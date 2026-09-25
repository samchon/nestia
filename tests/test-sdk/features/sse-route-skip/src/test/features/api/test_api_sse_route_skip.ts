import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";

/**
 * Verifies a server-sent events route is left out of the SDK and the Swagger
 * document, beside a JSON route of the same controller.
 *
 * `@Sse()` answers `text/event-stream`, but the route was composed as JSON of
 * its `MessageEvent` return type, so the SDK function threw a `SyntaxError` on
 * `id: 1\ndata: ...` and the document described `application/json` (#1745).
 *
 * 1. Assert the server streams events at `/events/stream`.
 * 2. Assert the SDK has no function for it and still calls the JSON route.
 * 3. Assert the Swagger document lists only the JSON route.
 */
export const test_api_sse_route_skip = async (
  connection: api.IConnection,
): Promise<void> => {
  const response: Response = await fetch(`${connection.host}/events/stream`);
  TestValidator.equals(
    "stream",
    response.headers.get("content-type")?.startsWith("text/event-stream"),
    true,
  );
  await response.body?.cancel();

  TestValidator.equals("sdk", Object.keys(api.functional.events).sort(), [
    "count",
  ]);
  TestValidator.equals(
    "count",
    await api.functional.events.count(connection),
    1,
  );

  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths), [
    "/events/count",
  ]);
};
