import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies DynamicExecutor follows directory links without cycling or
 * duplication.
 *
 * A linked test directory must be discoverable like a plain directory, while an
 * ancestor link must not repeatedly execute the same test or exhaust paths.
 *
 * 1. Link an otherwise unreachable test directory twice and back to its parent.
 * 2. Execute the directory through the public executor.
 * 3. Assert exactly one authored test result and no mismatching extension.
 *
 * @evidence contracts/testing.md#behavioral-verification DynamicExecutor executes the single linked test and reports its value once, distinguishing skipped links, repeated aliases and unbounded ancestor recursion.
 * @evidence contracts/testing.md#independent-expectations The fixture exports one accepted function returning a literal, so the one execution follows independently from the executor's naming contract.
 * @evidence contracts/testing.md#distinguishing-cases Linked-only discovery is positive, duplicate aliases and an ancestor link must not add executions, and a prefixed file of the wrong extension is excluded.
 * @evidence contracts/testing.md#execution-ownership Unit: this discoverable export calls DynamicExecutor in-process over inert CommonJS fixtures and deletes only its unique temporary tree in finally; it starts no compiler or product host.
 */
export const test_dynamic_executor_link_cycles = async (): Promise<void> => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-executor-links-"));
  try {
    const input = path.join(root, "input");
    const target = path.join(root, "external");
    fs.mkdirSync(input);
    fs.mkdirSync(target);
    fs.writeFileSync(
      path.join(target, "test_linked.js"),
      'exports.test_linked = () => "linked";',
    );
    fs.writeFileSync(path.join(target, "test_wrong.txt"), "not JavaScript");
    fs.symlinkSync(target, path.join(input, "first"), "junction");
    fs.symlinkSync(target, path.join(input, "second"), "junction");
    fs.symlinkSync(input, path.join(target, "cycle"), "junction");
    const report = await DynamicExecutor.assert({
      location: input,
      extension: "js",
      prefix: "test",
      parameters: () => [],
    });
    TestValidator.equals(
      "one linked execution",
      report.executions.map((execution) => [execution.name, execution.value]),
      [["test_linked", "linked"]],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
