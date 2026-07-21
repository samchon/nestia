import { DynamicExecutor, TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies discovery matches the whole extension, not a fixed-width slice.
 *
 * Locks the file gate of `DynamicExecutor.iterate`. It used to compare the last
 * three characters of the name against `"." + extension`, which is only correct
 * for a two-character extension — every longer one ("mjs", "cjs", "tsx")
 * matched nothing, so `validate` returned an empty, passing report and the
 * suite looked green while running no test at all. The cross-exclusion rows are
 * the negative twin: a gate repaired into a loose suffix test would pass the
 * "cjs" row while silently pulling unrelated files into every run.
 *
 * 1. Write sibling fixtures that differ only in extension into a temp directory.
 * 2. Discover with each extension in turn.
 * 3. Assert each run finds exactly its own file and none of the others.
 */
export async function test_dynamic_executor_extension_width(): Promise<void> {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-e2e-extension-"),
  );
  try {
    const fixtures: [string, string][] = [
      ["test_two.js", "test_two"],
      ["test_three.cjs", "test_three"],
      ["test_one.j", "test_one"],
    ];
    for (const [file, name] of fixtures)
      fs.writeFileSync(
        path.join(directory, file),
        `exports.${name} = async () => ${JSON.stringify(name)};\n`,
        "utf8",
      );

    const discover = async (extension: string): Promise<string[]> => {
      const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
        prefix: "test",
        location: directory,
        parameters: () => [],
        extension,
      });
      return report.executions.map((exec) => exec.name).sort();
    };

    // Two characters: the only width that already worked.
    TestValidator.equals("two-character extension", await discover("js"), [
      "test_two",
    ]);
    // Three characters: the reported defect. Note this also proves the gate is
    // not a loose suffix test, since "test_two.js" does not end with ".cjs".
    TestValidator.equals("three-character extension", await discover("cjs"), [
      "test_three",
    ]);
    // One character: the opposite boundary of the same fixed-width assumption.
    TestValidator.equals("one-character extension", await discover("j"), [
      "test_one",
    ]);
    // No fixture carries this extension, so the run is legitimately empty.
    TestValidator.equals("unmatched extension", await discover("mjs"), []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
