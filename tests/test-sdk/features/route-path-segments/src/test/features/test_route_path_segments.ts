import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";
import { ISegmentEcho } from "@api/lib/structures/ISegmentEcho";

/**
 * Verifies path parameters are placed where the router reads them, beside
 * literal text in their segment and beside a parameter whose name they prefix.
 *
 * The SDK path templates split `route.path` at `:` and took each name up to the
 * next `/`, so `files/:id.json` named a parameter `id.json` that did not exist
 * and `nestia sdk` crashed. Swagger replaced `:${field}` by its first text
 * match, so `pair/:identity/:id` became `/pair/{id}entity/:id` (#1705).
 *
 * 1. Assert the Swagger paths, one `{name}` per parameter where it stands.
 * 2. Call each HTTP route and the WebSocket route through the SDK with values
 *    holding characters the URL must encode.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks generated Swagger parameter positions and calls file, range, prefix-name and reversed-name routes plus WebSocket parameter echo.
 * @evidence contracts/testing.md#independent-expectations Authored controller paths and echoed argument order establish literal expected paths and values independently of emitted path interpolation.
 * @evidence contracts/testing.md#distinguishing-cases Space-containing file id, adjacent range parameters, identity versus id in both orders and slash-bearing WebSocket id detect misplaced substitution and missing encoding.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route-path-segments/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route-path-segments fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data. The WebSocket connector closes in finally after its parameter echo.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Space-containing file id, adjacent range parameters, identity versus id in both orders and slash-bearing WebSocket id detect misplaced substitution and missing encoding.
 */
export const test_route_path_segments = async (
  connection: api.IConnection,
): Promise<void> => {
  const document: { paths: Record<string, unknown> } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  TestValidator.equals("swagger", Object.keys(document.paths).sort(), [
    "/segments/files/{id}.json",
    "/segments/pair/{identity}/{id}",
    "/segments/range/{from}-{to}",
    "/segments/reverse/{id}/{identity}",
  ]);

  const segments = api.functional.segments;
  TestValidator.equals("file", await segments.files.file(connection, "a b"), {
    values: ["a b"],
  } satisfies ISegmentEcho);
  TestValidator.equals("range", await segments.range(connection, "1", "9"), {
    values: ["1", "9"],
  });
  // each value arrives as the parameter it is passed for, wherever the path
  // writes that parameter
  TestValidator.equals(
    "pair",
    await segments.pair(connection, "the-id", "the-identity"),
    { values: ["the-identity", "the-id"] },
  );
  TestValidator.equals(
    "reverse",
    await segments.reverse(connection, "the-identity", "the-id"),
    { values: ["the-id", "the-identity"] },
  );

  const { connector, driver } = await segments.socket(
    { host: connection.host },
    "x/y",
    null,
  );
  try {
    TestValidator.equals("socket", await driver.get(), { values: ["x/y"] });
  } finally {
    await connector.close();
  }
};
