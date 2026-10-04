import fs from "fs";
import path from "path";

import { DynamicExecutor, TestValidator } from "../../../../packages/e2e/lib";

/**
 * Verifies discovery loads from an absolute location outside the package tree.
 *
 * Locks the module-specifier construction of `DynamicExecutor`. It builds a
 * relative specifier so the same string works both as a native ESM `import()`
 * and as the `require()` a CommonJS build downlevels that into. `path.relative`
 * cannot express a path between two Windows drive roots and returns the
 * absolute target instead, so the `"./"` prefix produced `"./C:/..."` — neither
 * relative nor absolute — and every discovered file failed with
 * `MODULE_NOT_FOUND`.
 *
 * A fixture under the ignored workspace cache exercises an absolute location
 * outside the package tree. It covers same-volume relative resolution;
 * cross-volume Windows resolution is not exercised by this fixture. The suite's
 * own `src/features` run is the near-location control.
 *
 * 1. Write a fixture into a fresh directory under the ignored workspace cache.
 * 2. Discover it through `DynamicExecutor` by absolute path.
 * 3. Assert the function was found and actually executed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls DynamicExecutor.validate on an absolute fixture path and checks the discovered export, return value and absence of an error.
 * @evidence contracts/testing.md#independent-expectations The authored JavaScript export has a literal name and result, independently of the executor discovery algorithm.
 * @evidence contracts/testing.md#distinguishing-cases An absolute directory outside the package resolves on the current volume; this case does not exercise a different Windows volume.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package executor case; fixture files exercise the resolver without product compilation, consumer installation or a host.
 */

export async function test_dynamic_executor_absolute_location(): Promise<void> {
  const cache: string = path.resolve(
    __dirname,
    "../../../../node_modules/.cache/test-e2e",
  );
  fs.mkdirSync(cache, { recursive: true });
  const directory: string = fs.mkdtempSync(
    path.join(cache, "nestia-e2e-location-"),
  );
  try {
    fs.writeFileSync(
      path.join(directory, "test_remote.js"),
      `exports.test_remote = async () => "remote";\n`,
      "utf8",
    );

    const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
      prefix: "test",
      location: directory,
      parameters: () => [],
      extension: "js",
    });

    TestValidator.equals(
      "discovered names",
      report.executions.map((exec) => exec.name),
      ["test_remote"],
    );
    TestValidator.equals("no error", report.executions[0]?.error ?? null, null);
    TestValidator.equals(
      "returned value",
      report.executions[0]?.value,
      "remote",
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
