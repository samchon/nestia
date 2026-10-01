import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

import { SdkGenerator } from "../../../../../packages/sdk/lib/generates/SdkGenerator";

/**
 * Verifies SDK bundle emplacement preserves customized files and restores gaps.
 *
 * Regeneration must retain user exports while recreating missing scaffold
 * files. Direct filesystem inputs isolate this missing-only policy from
 * controller reflection; the common E2E separately compiles the customized
 * generated SDK.
 *
 * 1. Fill an empty output and compare the six original files to bundle assets.
 * 2. Customize module/index, add a type and remove only HttpError.
 * 3. Refill and compare both custom files, the restored file and three untouched
 *    files.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SdkGenerator.bundle must copy six absent files, preserve independently customized module/index bytes and restore only the missing HttpError while three untouched scaffold files remain identical.
 * @evidence contracts/testing.md#independent-expectations The original six filenames and source asset bytes establish baseline expectations. Original custom module/index literals establish preservation independently of the implementation's output.
 * @evidence contracts/testing.md#distinguishing-cases Empty output contrasts an existing customized file, an existing untouched file and a deliberately missing file. Byte equality catches overwrite as well as partial restoration; the custom type file must remain intact.
 * @evidence contracts/testing.md#execution-ownership Unit: the SDK DynamicExecutor awaits this matching export. Two direct bundle calls own only filesystem inputs and finally remove their unique directory; no compiler, process, installation or backend starts here.
 */
export const test_sdk_bundle_preserves_customized_files =
  async (): Promise<void> => {
    const directory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "nestia-bundle-"),
    );
    const assets = path.resolve(
      process.cwd(),
      "../../packages/sdk/assets/bundle/api",
    );
    const files = [
      "HttpError.ts",
      "IConnection.ts",
      "index.ts",
      "module.ts",
      "Primitive.ts",
      "Resolved.ts",
    ];
    const customModule = [
      'export type * from "./IConnection";',
      'export * from "./HttpError";',
      'export type * from "./custom";',
      "",
      'export * as functional from "./functional/index";',
      "",
    ].join("\n");
    const customIndex = [
      'import * as api from "./module";',
      "",
      'export * from "./module";',
      'export type * from "./custom";',
      "",
      "export default api;",
      "",
    ].join("\n");
    const custom = "export type Custom = { value: string };\n";
    try {
      await SdkGenerator.bundle(directory);
      for (const file of files)
        TestValidator.equals(
          `first bundle ${file}`,
          await fs.promises.readFile(path.join(directory, file), "utf8"),
          await fs.promises.readFile(path.join(assets, file), "utf8"),
        );
      await fs.promises.writeFile(path.join(directory, "custom.ts"), custom);
      await fs.promises.writeFile(
        path.join(directory, "module.ts"),
        customModule,
      );
      await fs.promises.writeFile(
        path.join(directory, "index.ts"),
        customIndex,
      );
      await fs.promises.unlink(path.join(directory, "HttpError.ts"));
      await SdkGenerator.bundle(directory);
      TestValidator.equals(
        "custom module preserved",
        await fs.promises.readFile(path.join(directory, "module.ts"), "utf8"),
        customModule,
      );
      TestValidator.equals(
        "custom index preserved",
        await fs.promises.readFile(path.join(directory, "index.ts"), "utf8"),
        customIndex,
      );
      TestValidator.equals(
        "custom type preserved",
        await fs.promises.readFile(path.join(directory, "custom.ts"), "utf8"),
        custom,
      );
      for (const file of [
        "HttpError.ts",
        "IConnection.ts",
        "Primitive.ts",
        "Resolved.ts",
      ])
        TestValidator.equals(
          `restored or untouched ${file}`,
          await fs.promises.readFile(path.join(directory, file), "utf8"),
          await fs.promises.readFile(path.join(assets, file), "utf8"),
        );
    } finally {
      await fs.promises.rm(directory, { recursive: true, force: true });
    }
  };
