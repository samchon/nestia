import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

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
 * @evidence contracts/testing.md#behavioral-verification DynamicExecutor.validate discovers and runs a function outside the workspace.
 * @evidence contracts/testing.md#independent-expectations The authored fixture exports one function returning the literal remote value.
 * @evidence contracts/testing.md#distinguishing-cases One remote JavaScript function must be found without errors and return remote; ordinary suite discovery supplies the nearby-location control.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
