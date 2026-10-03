import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

import { ImportDictionary } from "../../../../packages/sdk/lib/generates/internal/ImportDictionary";
import { SdkHttpFunctionProgrammer } from "../../../../packages/sdk/lib/generates/internal/SdkHttpFunctionProgrammer";
import { SwaggerUnitRoute } from "../internal/SwaggerUnitRoute";

/**
 * Verifies SDK assert and JSON flags select independent request operations.
 *
 * These flags belong to the TypeScript SDK writer, not native option dispatch
 * or npm package staging. Testing their four combinations must not install an
 * identical distribution package four times.
 *
 * 1. Author one required string body in JSON, encrypted JSON and three plain
 *    formats.
 * 2. Compose its SDK function under every assert/json flag pair.
 * 3. Compare assertion calls, JSON serializer arguments and typia imports.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual function writer emits exactly one typia assertion only when assert is enabled, passes its namespace stringify only for json-enabled JSON/encrypted requests, and imports typia only for the assertion it writes.
 * @evidence contracts/testing.md#independent-expectations The SDK flags independently request input assertion and JSON serialization. Literal JSON/encrypted versus text/form/multipart rows define serializer eligibility; one required authored body defines the single assertion site without compiling or reading generated fixture outputs.
 * @evidence contracts/testing.md#distinguishing-cases All four boolean combinations cross JSON, encrypted JSON, text, urlencoded and multipart bodies. Disabled assertion and non-JSON formats are adjacent controls against unconditional injection or conflating the two flags.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching TypeScript export with plugins off. Caller-built writers and printer consume authored route records directly; the case creates no installation, compiled product fixture, host or process. Necessary generated-helper compilation shares the configured SDK program; one actual distribution integration retains npm installation and package compilation.
 */
export const test_sdk_http_assert_json_options = (): void => {
  const sdk = path.resolve(__dirname, "../../../../packages/sdk");
  const { TsPrinter } = createRequire(path.join(sdk, "package.json"))(
    "@ttsc/factory",
  );
  for (const [contentType, encrypted, serializable] of [
    ["application/json", false, true],
    ["application/json", true, true],
    ["text/plain", false, false],
    ["application/x-www-form-urlencoded", false, false],
    ["multipart/form-data", false, false],
  ] as const)
    for (const inputAssert of [false, true])
      for (const json of [false, true]) {
        const route = SwaggerUnitRoute();
        route.name = "store";
        route.method = "POST";
        route.body = {
          category: "body",
          name: "input",
          index: 0,
          type: { name: "string" },
          metadata: {
            ...route.success.metadata,
            required: true,
            optional: false,
            atomics: [{ type: "string", tags: [] }],
          },
          contentType,
          encrypted,
          description: null,
          jsDocTags: [],
        };
        const importer = new ImportDictionary(
          path.join(sdk, "lib", "authored.ts"),
        );
        const node = SdkHttpFunctionProgrammer.write({
          config: { input: [], assert: inputAssert, json },
          input: { controllers: [] },
          errors: [],
          warnings: [],
        })(importer)(route);
        const printer = new TsPrinter();
        const source: string = printer.print(node);
        const imports: string = importer
          .toStatements(path.join(sdk, "lib"))
          .map((statement) => printer.print(statement))
          .join("\n");
        const label = `${contentType}/${encrypted}/assert=${inputAssert}/json=${json}`;
        assert.equal(
          (source.match(/typia\.assert/g) ?? []).length,
          inputAssert ? 1 : 0,
          label,
        );
        assert.equal(
          source.includes("store.stringify"),
          json && serializable,
          label,
        );
        assert.equal(imports.includes('"typia"'), inputAssert, label);
        assert(
          source.includes(
            encrypted ? "EncryptedFetcher.fetch" : "PlainFetcher.fetch",
          ),
          label,
        );
      }
};
