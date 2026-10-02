const assert = require("node:assert/strict");
const path = require("node:path");
const sdk = path.resolve(__dirname, "../../packages/sdk");
const { TsPrinter } = require(
  require.resolve("@ttsc/factory", { paths: [sdk] }),
);
const {
  SdkAliasCollection,
} = require("../../packages/sdk/lib/generates/internal/SdkAliasCollection");
const {
  ImportDictionary,
} = require("../../packages/sdk/lib/generates/internal/ImportDictionary");

/**
 * Verifies propagation exception aliases follow their own JSON wire format.
 *
 * A plain-text success does not change the JSON encoding of TypedException. The
 * source Date type therefore needs Primitive even when the success uses
 * Resolved. Authored primitive metadata tests clone selection without claiming
 * to verify native Date analysis.
 *
 * 1. Compose propagation aliases for plain, JSON, encrypted and binary successes.
 * 2. Assert the exception independently uses its JSON primitive source type.
 * 3. Contrast source-preserving primitive=false and supplied clone metadata.
 */
const metadata = {
  size: 1,
  any: false,
  nullable: false,
  required: true,
  constants: [],
  templates: [],
  atomics: [{ type: "string", tags: [] }],
  tuples: [],
  arrays: [],
  objects: [],
  aliases: [],
  natives: [],
  sets: [],
  maps: [],
};
const types = (
  config,
  contentType = "text/plain",
  encrypted = false,
  binary = false,
) => {
  const route = {
    method: "GET",
    success: {
      contentType,
      encrypted,
      binary,
      status: 200,
      type: { name: "string" },
      metadata,
    },
    exceptions: { 400: { type: { name: "Date" }, metadata } },
  };
  const result = SdkAliasCollection.response({
    config: { propagate: true, ...config },
  })(new ImportDictionary(path.join(sdk, "lib", "fixture.ts")))(route);
  const printer = new TsPrinter();
  return result.typeArguments[0].members.map((member) =>
    printer.print(member.type),
  );
};
assert.deepEqual(types({}), ["Resolved<string>", "Primitive<Date>"]);
assert.deepEqual(types({}, "application/json"), [
  "Primitive<string>",
  "Primitive<Date>",
]);
assert.deepEqual(types({}, "text/plain", true), [
  "Primitive<string>",
  "Primitive<Date>",
]);
assert.deepEqual(types({}, "application/octet-stream", false, true), [
  "ReadableStream<Uint8Array<ArrayBufferLike>>",
  "Primitive<Date>",
]);
assert.deepEqual(types({ primitive: false }), ["string", "Date"]);
assert.deepEqual(types({ clone: true }), ["string", "string"]);
