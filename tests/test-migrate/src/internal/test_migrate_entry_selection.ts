import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Verifies standalone migration execution reaches its selection guard.
 *
 * The shared root imports this entry without executing it. Ttsx keeps its
 * bootstrap as require.main, so direct execution must also recognize argv's
 * actual entry filename. An empty selection must fail before installation.
 *
 * 1. Execute the actual standalone entry with an absent scenario filter.
 * 2. Require the authored selection diagnostic and a completed failure status.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual ttsx entry must execute migration main and reject an absent scenario. Exit zero, a signal, a launch failure or unrelated loader failure cannot satisfy the diagnostic assertion.
 * @evidence contracts/testing.md#independent-expectations No scenario contains the authored deliberately absent filter; the supported command requires nonempty execution. Its selection diagnostic establishes that main actually ran rather than the loader silently importing the file.
 * @evidence contracts/testing.md#distinguishing-cases An absent selection requires failure before preparation, while the surrounding positive migration main generates and compiles its real fixture. Root-imported main and standalone ttsx entry exercise distinct entrypoint conditions without recursively reaching this case in the negative child.
 * @evidence contracts/testing.md#execution-ownership Migration integration main invokes this matching export after successful selection. Direct units never launch this process; the negative child fails at its earlier selection guard.
 * @evidence contracts/e2e.md#necessary-boundary The actual ttsx bootstrap and standalone entry must connect to migration main; a direct selector unit cannot detect an entry that never invokes it.
 * @evidence contracts/e2e.md#shared-execution One no-plugins test-language child checks dispatch without packing, installation, native compilation, generated project preparation or another fixture CLI.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The negative filter rejects before output cleanup or installation, leaving the positive owner's generated state untouched. Ordinary Node arguments and cleared loader/search variables prevent inherited workspace preloads from supplying the result.
 * @evidence contracts/e2e.md#preserved-coverage This entry connection supplements the original migration fixture and project assertions; it preserves standalone nonempty-selection coverage after the root starts importing main.
 */
export const test_migrate_entry_selection = (): void => {
  const manifest = require.resolve("ttsc/package.json");
  const pack = JSON.parse(fs.readFileSync(manifest, "utf8"));
  const ttsx = path.resolve(path.dirname(manifest), pack.bin.ttsx);
  const result = spawnSync(
    process.execPath,
    [
      "--no-experimental-strip-types",
      "--no-experimental-detect-module",
      ttsx,
      "--no-plugins",
      path.resolve(__dirname, "../index.ts"),
      "--only",
      "definitely-no-migration-scenario",
    ],
    {
      cwd: path.resolve(__dirname, "../../.."),
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "", NODE_PATH: "" },
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  assert.equal(result.signal, null);
  assert(
    Number.isInteger(result.status) && result.status !== 0,
    "Standalone migration must execute and reject empty selection.",
  );
  assert.match(
    result.stderr,
    /No migration integration scenarios were selected\./,
  );
  console.log(
    "Migration standalone entry: empty selection rejected before preparation.",
  );
};
