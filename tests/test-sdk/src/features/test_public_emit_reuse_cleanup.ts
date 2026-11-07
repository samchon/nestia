import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { test_public_emit_reuse } from "../integration/features/test_public_emit_reuse";

/**
 * Verifies runtime acceptance preparation releases its roots on early failure.
 *
 * Setup can fail before a compiler or application exists. The fixture and trace
 * must still be released, and successful cleanup must retain the original
 * preparation error rather than replace it with a cleanup wrapper.
 *
 * 1. Use a real exports-blocked compiler manifest to fail package resolution.
 * 2. Use a file as the temporary parent to fail trace-directory acquisition.
 * 3. Require both failures to leave no acquired fixture or trace directory.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual runtime case is called through two ordinary filesystem failures before any compiler launch. Its original resolution or native filesystem error remains observable, while fixture and trace state must be absent afterward.
 * @evidence contracts/testing.md#independent-expectations Node package exports deny package.json even if an ancestor has ttsc installed, and a regular file cannot contain a trace directory. Neither failed preparation may retain owned directories.
 * @evidence contracts/testing.md#distinguishing-cases Package resolution fails after acquiring the trace and fixture, whereas trace acquisition fails before the fixture is changed. The same resource assertions distinguish uncovered setup from a cleanup scope that covers the entire lifetime.
 * @evidence contracts/testing.md#execution-ownership The serial SDK unit entry discovers this matching function. It calls the setup owner directly against a small temporary filesystem, with no installation, product compilation or host; supported temporary-directory environment variables are scoped and restored before its owned root is removed.
 */
export function test_public_emit_reuse_cleanup(): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-reuse-cleanup-"));
  const variables = ["TMPDIR", "TMP", "TEMP"] as const;
  const previous = variables.map((name) => [name, process.env[name]] as const);
  const outcomes = [];
  try {
    for (const mode of ["resolution", "trace-creation"]) {
      const scope = path.join(root, mode);
      const consumer = path.join(scope, "consumer");
      const traceParent = path.join(scope, "traces");
      fs.mkdirSync(path.join(consumer, "node_modules/ttsc"), {
        recursive: true,
      });
      fs.writeFileSync(path.join(consumer, "package.json"), '{"private":true}');
      fs.writeFileSync(
        path.join(consumer, "node_modules/ttsc/package.json"),
        JSON.stringify({ name: "ttsc", exports: { ".": "./index.js" } }),
      );
      if (mode === "resolution") fs.mkdirSync(traceParent);
      else fs.writeFileSync(traceParent, "blocks trace directory");
      for (const name of variables) process.env[name] = traceParent;
      let errorCode: string | undefined;
      try {
        test_public_emit_reuse(
          {
            root: consumer,
            requirePublic: createRequire(path.join(consumer, "package.json")),
          },
          path.join(scope, "cache"),
        );
      } catch (error) {
        errorCode = (error as NodeJS.ErrnoException).code;
      }
      outcomes.push({
        mode,
        errorCode,
        fixtureExists: fs.existsSync(
          path.join(consumer, "projects/emit-reuse"),
        ),
        traceChildren:
          mode === "resolution" ? fs.readdirSync(traceParent) : null,
      });
    }
    assert.equal(outcomes[0]!.errorCode, "ERR_PACKAGE_PATH_NOT_EXPORTED");
    assert(["ENOENT", "ENOTDIR"].includes(outcomes[1]!.errorCode ?? ""));
    assert.deepEqual(
      outcomes.map(({ fixtureExists, traceChildren }) => ({
        fixtureExists,
        traceChildren,
      })),
      [
        { fixtureExists: false, traceChildren: [] },
        { fixtureExists: false, traceChildren: null },
      ],
    );
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    fs.rmSync(root, { recursive: true });
  }
}
