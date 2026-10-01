import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies Swagger formatting changes indentation without changing the
 * document.
 *
 * The beautify fixtures repeated body generation and HTTP checks but never
 * inspected their formatting option. Formatting is a generator decision; direct
 * calls retain file-writing behavior without a compiler or server.
 *
 * 1. Generate documents with omitted, false, zero, true and numeric indentation.
 * 2. Require compact, two-space, four-space and capped ten-space output.
 * 3. Check authored document values and release the owned output directory.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SwaggerGenerator.generate writes each selected format to an owned filesystem fixture; exact line prefixes distinguish compact, boolean-default, numeric and JSON indentation-cap branches. Parsed authored info and empty paths/schemas must remain unchanged.
 * @evidence contracts/testing.md#independent-expectations The public beautify option selects compact JSON, two spaces for true or the supplied numeric JSON indentation. Literal prefixes follow JSON serialization's space argument, including its ten-space cap; authored info and empty routes establish content independently of generator output.
 * @evidence contracts/testing.md#distinguishing-cases Omitted, false and zero are compact controls; true, four and twenty distinguish default spacing, numeric spacing and clamping. Body's SDK boundary retains the duplicate fixtures' valid/invalid body, void health and nonempty performance requests; this case adds the previously missing format assertions.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered and awaited by the unit runner. It calls the built owning generator in-process and removes only its unique temporary output root in finally; no consumer installation, native artifact or application host is prepared.
 */
export const test_sdk_swagger_beautify = async (): Promise<void> => {
  const { SwaggerGenerator } = require(
    path.resolve(
      process.cwd(),
      "../../packages/sdk/lib/generates/SwaggerGenerator",
    ),
  ) as typeof import("../../../../../packages/sdk/lib/generates/SwaggerGenerator");
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-swagger-format-"),
  );
  const info = {
    title: "Formatting fixture",
    version: "1.0.0",
    description: "Authored content",
    license: { name: "MIT" },
  };
  try {
    const cases: [string, boolean | number | undefined, string][] = [
      ["omitted", undefined, '{"openapi":"3.2.0",'],
      ["false", false, '{"openapi":"3.2.0",'],
      ["zero", 0, '{"openapi":"3.2.0",'],
      ["true", true, '{\n  "openapi": "3.2.0",'],
      ["four", 4, '{\n    "openapi": "3.2.0",'],
      ["twenty", 20, '{\n          "openapi": "3.2.0",'],
    ];
    for (const [name, beautify, prefix] of cases) {
      const output = path.join(directory, `${name}.json`);
      await SwaggerGenerator.generate({
        project: {
          config: {
            input: [],
            swagger: { output, openapi: "3.2", beautify, info, servers: [] },
          },
          input: { controllers: [] },
          errors: [],
          warnings: [],
        },
        collection: {
          objects: new Map(),
          aliases: new Map(),
          arrays: new Map(),
          tuples: new Map(),
        },
        routes: [],
      });
      const text = fs.readFileSync(output, "utf8");
      assert.ok(
        text.startsWith(prefix),
        `${name}: unexpected JSON indentation`,
      );
      if (beautify === undefined || beautify === false || beautify === 0)
        assert.equal(
          text.includes("\n"),
          false,
          `${name}: compact JSON has a newline`,
        );
      const document = JSON.parse(text);
      assert.deepEqual(document.info, info, `${name}: authored info changed`);
      assert.deepEqual(document.paths, {}, `${name}: empty paths changed`);
      assert.deepEqual(
        document.components.schemas,
        {},
        `${name}: empty schemas changed`,
      );
      assert.deepEqual(document.servers, [], `${name}: empty servers changed`);
    }
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    assert.ok(path.basename(directory).startsWith("nestia-swagger-format-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
