import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Verifies template reuse invalidates changed inputs and incomplete outputs.
 *
 * A warm build can skip fetching immutable templates only while both generated
 * outputs retain their identity. Failed preparation must remain a failure and
 * must not publish a manifest that certifies its partial output.
 *
 * 1. Generate two literal outputs, then reuse the same input without generation.
 * 2. Change inputs, edit or remove an output and corrupt metadata to force misses.
 * 3. Reject partial generation, recover and verify empty output sets never hit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual template cache operation and observes generation count, output contents, hit/miss results and propagation of the original failed-generation error.
 * @evidence contracts/testing.md#independent-expectations Literal authored output values and invocation counts establish whether actual generation was skipped; the expected result is not obtained from the cache's own fingerprint calculation.
 * @evidence contracts/testing.md#distinguishing-cases Equal inputs/outputs hit, while changed inputs, edited/missing outputs and invalid metadata miss. Failure retains the prior manifest and cannot authorize the next changed-input call; empty output sets never certify reuse.
 * @evidence contracts/testing.md#execution-ownership The migrate entry invokes this filesystem cache unit directly; an authored writer supplies files without Git, a compiler, CLI process, installed consumer or host. Finally releases its unique temporary root.
 */
export const test_migrate_template_bundle_cache = async (): Promise<void> => {
  const {
    run,
  } = require("../../../../packages/migrate/src/executable/TemplateBundleCache.ts");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-template-cache-"));
  try {
    const outputs = [path.join(root, "nest.ts"), path.join(root, "sdk.ts")];
    const stampFile = path.join(root, "manifest.json");
    let generations = 0;
    let input = "first";
    const generate = async (): Promise<void> => {
      ++generations;
      for (const file of outputs) fs.writeFileSync(file, input);
    };
    const execute = () =>
      run({ inputs: [input], outputs, stampFile, generate });
    assert.equal(await execute(), false);
    assert.equal(await execute(), true);
    assert.equal(generations, 1);

    input = "second";
    assert.equal(await execute(), false);
    assert.equal(generations, 2);
    assert.equal(fs.readFileSync(outputs[0]!, "utf8"), "second");
    fs.writeFileSync(outputs[0]!, "edited");
    assert.equal(await execute(), false);
    assert.equal(generations, 3);
    assert.equal(fs.readFileSync(outputs[0]!, "utf8"), "second");
    fs.rmSync(outputs[1]!);
    assert.equal(await execute(), false);
    assert.equal(generations, 4);
    assert.equal(fs.readFileSync(outputs[1]!, "utf8"), "second");
    fs.writeFileSync(stampFile, "invalid JSON");
    assert.equal(await execute(), false);
    assert.equal(generations, 5);

    const previous = fs.readFileSync(stampFile, "utf8");
    input = "third";
    const failure = new Error("partial generation");
    await assert.rejects(
      run({
        inputs: [input],
        outputs,
        stampFile,
        generate: async () => {
          fs.writeFileSync(outputs[0]!, input);
          throw failure;
        },
      }),
      (error: unknown) => error === failure,
    );
    assert.equal(fs.readFileSync(stampFile, "utf8"), previous);
    assert.equal(await execute(), false);
    assert.equal(generations, 6);
    assert.equal(await execute(), true);
    for (let i = 0; i < 2; ++i)
      assert.equal(
        await run({ inputs: [], outputs: [], stampFile, generate }),
        false,
      );
    assert.equal(generations, 8);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
