import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";

/**
 * Verifies a rendered view route is left out of the SDK and the Swagger
 * document, beside a JSON route of the same controller.
 *
 * `@Render()` answers the rendered page as `text/html`, but the route was
 * composed as JSON of its view model, so the SDK function threw a `SyntaxError`
 * on the HTML (#1747).
 *
 * 1. Assert the server renders `/page` as HTML.
 * 2. Assert the SDK has no function for it and still calls the JSON route.
 * 3. Assert the Swagger document lists only the JSON route.
 */
export const test_api_render_route_skip = async (
  connection: api.IConnection,
): Promise<void> => {
  const response: Response = await fetch(`${connection.host}/page`);
  TestValidator.equals(
    "page",
    response.headers.get("content-type")?.startsWith("text/html"),
    true,
  );
  TestValidator.equals("html", await response.text(), "<p>page</p>");

  TestValidator.equals("sdk", Object.keys(api.functional.page).sort(), [
    "count",
  ]);
  TestValidator.equals("count", await api.functional.page.count(connection), 1);

  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths), ["/page/count"]);
};
