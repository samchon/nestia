import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies SDK finder expansion respects literal brackets and native
 * separators.
 *
 * Directory names are literal filesystem inputs, while only the remaining
 * wildcard suffix is a glob. The previous SDK boundary mixed this portable
 * expansion rule with real controller loading and imported workspace sources.
 *
 * 1. Create a literal bracket-bearing directory and one inert controller file.
 * 2. Expand the directory and equivalent native/forward-slash globs.
 * 3. Assert the exact directory/file results and release the owned directory.
 *
 * @evidence contracts/testing.md#behavioral-verification Built SDK SourceFinder.expand must return the literal directory or exact single file for native and forward-slash glob forms; interpreting the brackets as a character class or backslashes as escapes yields a mismatch.
 * @evidence contracts/testing.md#independent-expectations The expected paths are the actual handwritten directory/file created by the test. They are not derived from the finder's output.
 * @evidence contracts/testing.md#distinguishing-cases Literal directory versus wildcard suffix and native versus forward-slash spelling retain all three former SDK expansion controls. The real module-loading/exclusion connection remains in test_dynamic_module_paths.
 * @evidence contracts/testing.md#execution-ownership This matching exported function runs in the shared unit process and loads the built private SDK utility by absolute path. It starts no compiler, CLI or Nest server and removes only its unique mkdtemp root in finally.
 */
export const test_sdk_source_finder_literal_paths = async (): Promise<void> => {
  const { SourceFinder } = require(
    path.resolve(process.cwd(), "../../packages/sdk/lib/utils/SourceFinder"),
  ) as { SourceFinder: { expand: (input: string) => Promise<string[]> } };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-source-finder-"));
  const directory = path.join(root, "app [v2]", "controllers");
  const file = path.join(directory, "ProbeController.js");
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      file,
      "exports.ProbeController = class ProbeController {};\n",
    );
    const native = path.join(root, "app [v2]", "**", "*.js");
    const posix = native.split(path.sep).join("/");
    for (const input of [directory, native, posix])
      TestValidator.equals(`sdk ${input}`, await SourceFinder.expand(input), [
        input === directory ? directory : file,
      ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
