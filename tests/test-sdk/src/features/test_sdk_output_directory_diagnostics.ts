import fs from "node:fs";
import path from "node:path";

import type { INestiaConfig } from "../../../../packages/sdk/lib/INestiaConfig";
import { NestiaSdkApplication } from "../../../../packages/sdk/lib/NestiaSdkApplication";

/**
 * Verifies a missing or misplaced output directory is reported by name.
 *
 * Why: `sdk()`, `e2e()`, and `swagger()` meant to reject a missing output
 * directory with their own message, but `fs.promises.lstat()` threw first, so
 * the user saw a bare `ENOENT ... lstat` naming no configuration property
 * (#1678).
 *
 * 1. Configure outputs whose directory is missing, and ones where a file stands in
 *    its place.
 * 2. Assert each generator names the property, the configured location, and
 *    whether the directory is missing or not a directory.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct built application calls reject all five authored missing-directory and file-as-directory configurations, name their owning option and avoid raw ENOENT/lstat diagnostics.
 * @evidence contracts/testing.md#independent-expectations Literal configured paths and public option names establish each expected diagnostic independently of generated output. A real file distinguishes not-a-directory from an absent path.
 * @evidence contracts/testing.md#distinguishing-cases SDK missing parent and file parent, E2E missing parent, Swagger file destination and directory destination retain the original five rejection distinctions.
 * @evidence contracts/testing.md#execution-ownership The matching unit export is discovered under src/features. It invokes the built configuration boundary directly and removes its unique filesystem fixture; no installation, compilation or listening application occurs.
 */
export const test_sdk_output_directory_diagnostics =
  async (): Promise<void> => {
    const cache = path.join(
      process.cwd(),
      "node_modules",
      ".cache",
      "test-sdk",
    );
    await fs.promises.mkdir(cache, { recursive: true });
    const directory = await fs.promises.mkdtemp(
      path.join(cache, "nestia-output-directory-"),
    );
    const file = path.join(directory, "file");
    await fs.promises.writeFile(file, "", "utf8");
    const missing = path.join(directory, "missing");
    const cases: {
      method: "sdk" | "e2e" | "swagger";
      config: INestiaConfig;
      expected: string;
    }[] = [
      {
        method: "sdk",
        config: { input: [], output: path.join(missing, "src") },
        expected: `of INestiaConfig.output ${JSON.stringify(path.join(missing, "src"))} does not exist.`,
      },
      {
        method: "sdk",
        config: { input: [], output: path.join(file, "src") },
        expected: "is not a directory.",
      },
      {
        method: "e2e",
        config: {
          input: [],
          output: path.join(directory, "api"),
          e2e: path.join(missing, "test"),
        },
        expected: `of INestiaConfig.e2e ${JSON.stringify(path.join(missing, "test"))} does not exist.`,
      },
      {
        method: "swagger",
        config: {
          input: [],
          swagger: { output: path.join(missing, "swagger.json") },
        },
        expected: `of INestiaConfig.swagger.output ${JSON.stringify(path.join(missing, "swagger.json"))} does not exist.`,
      },
      {
        method: "swagger",
        config: { input: [], swagger: { output: missing } },
        expected: `of INestiaConfig.swagger.output ${JSON.stringify(missing)} does not exist.`,
      },
    ];
    try {
      for (const { method, config, expected } of cases) {
        const message = await new NestiaSdkApplication(config)[method]().then(
          () => null,
          (error: unknown) =>
            error instanceof Error ? error.message : String(error),
        );
        if (message === null || message.includes(expected) === false)
          throw new Error(
            `${method}() with ${JSON.stringify(config)} must report ${JSON.stringify(expected)}, got: ${message}`,
          );
        if (message.includes("ENOENT") || message.includes("lstat"))
          throw new Error(
            `${method}() leaked a raw file system error: ${message}`,
          );
      }
    } finally {
      await fs.promises.rm(directory, { force: true, recursive: true });
    }
  };
