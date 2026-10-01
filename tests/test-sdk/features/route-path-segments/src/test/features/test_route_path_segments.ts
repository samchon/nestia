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
 * @evidence contracts/testing.md#behavioral-verification Generated Swagger must contain four exact parameterized literal-segment paths; file/range/pair/reverse HTTP and slash-bearing WebSocket values must return exact authored ordered echoes.
 * @evidence contracts/testing.md#independent-expectations Authored segment layouts and explicitly supplied values establish expected parameter positions and encoding independently of path-template output. Handwritten document paths retain id versus identity boundaries.
 * @evidence contracts/testing.md#distinguishing-cases Literal .json/hyphen suffixes, prefix-sharing id/identity in reversed positions, space and slash values contrast substitution/tokenization branches across HTTP and WebSocket.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated path functions, Swagger replacement, adapter parsing and WebSocket matching must agree. String replacement units alone cannot establish the handler sees the right parameter values.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
