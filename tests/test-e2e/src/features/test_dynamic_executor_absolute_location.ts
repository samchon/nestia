import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
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
 * The system temp directory is the vehicle because it is the ordinary way to
 * land on another volume: on a Windows checkout outside the system drive this
 * case is genuinely cross-drive and reproduces the defect, while on the POSIX
 * CI runner it degrades to a long `../..` chain and still proves the common
 * path keeps working. The suite's own `src/features` run is the near-location
 * control.
 *
 * 1. Write a fixture into a fresh directory under the system temp root.
 * 2. Discover it through `DynamicExecutor` by absolute path.
 * 3. Assert the function was found and actually executed.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `DynamicExecutor` on a fixture in a fresh temp directory and asserts the function was found and executed, which fails with `MODULE_NOT_FOUND` when the specifier is neither relative nor absolute.
 * @evidence contracts/testing.md#independent-expectations The expectation is that the fixture's function runs and reports its own result, which follows from the contract of discovery and not from how the specifier is built.
 * @evidence contracts/testing.md#distinguishing-cases The cross-volume temp location is the case that a `./` prefix breaks on Windows; on POSIX it degrades to a long relative chain, which is stated in the test, and the suite's own `src/features` run is the near-location control.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_dynamic_executor_absolute_location(): Promise<void> {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-e2e-location-"),
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
