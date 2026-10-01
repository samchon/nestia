import type { INestiaConfig } from "@nestia/sdk";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies generator output guards report configuration-specific path errors.
 *
 * These failures happen before input analysis and require neither a CLI nor a
 * Nest application. The former SDK child process therefore added no necessary
 * integration boundary to the same public application operations.
 *
 * 1. Create an owned temporary root and a file that cannot be a parent directory.
 * 2. Invoke SDK/e2e/Swagger operations with the five retained invalid outputs.
 * 3. Require the property/location diagnostic instead of a raw lstat failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SDK/e2e/Swagger output guards must reject missing parent paths or a file used as parent, naming the expected configuration property/location and never leaking ENOENT or lstat.
 * @evidence contracts/testing.md#independent-expectations Handwritten invalid configurations and the actual created file establish missing versus non-directory facts. Literal property/path fragments follow the public INestiaConfig fields, not current generator output.
 * @evidence contracts/testing.md#distinguishing-cases SDK missing/file-parent, e2e missing parent, Swagger missing file parent and missing directory retain all five original controls. Successful nested output creation remains in the actual SDK generator boundary.
 * @evidence contracts/testing.md#execution-ownership This matching export is discovered and awaited by the shared unit runner; it loads the built public SDK application by absolute path, runs guards in-process and removes only its unique temporary root in finally. No CLI, compiler or server is started.
 */
export const test_sdk_output_directory_diagnostics =
  async (): Promise<void> => {
    const { NestiaSdkApplication } = require(
      path.resolve(
        process.cwd(),
        "../../packages/sdk/lib/NestiaSdkApplication",
      ),
    ) as typeof import("@nestia/sdk");
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-output-directory-"),
    );
    try {
      const file = path.join(directory, "file");
      fs.writeFileSync(file, "");
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
      for (const { method, config, expected } of cases) {
        const message = await new NestiaSdkApplication(config)[method]().then(
          () => null,
          (error: unknown) =>
            error instanceof Error ? error.message : String(error),
        );
        if (message === null || !message.includes(expected))
          throw new Error(
            `${method}() with ${JSON.stringify(config)} must report ${JSON.stringify(expected)}, got: ${message}`,
          );
        if (message.includes("ENOENT") || message.includes("lstat"))
          throw new Error(
            `${method}() leaked a raw file system error: ${message}`,
          );
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  };
