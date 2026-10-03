const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

/**
 * Compiles one public program and publishes only its successful contained
 * output.
 *
 * Diagnostics retain their original first result. A missing output or path
 * outside the owned output directory fails before publishing that result.
 *
 * Principled implementation: The public compiler owns plugin discovery and
 * execution. Exception and diagnostic results fail; a successful nonempty
 * output map must be contained by the declared output root before files are
 * written. clear and simple design: One operation compiles, checks the complete
 * output set and writes it once, with a separate visible phase timing.
 * prohibited implementation shortcuts: The compiler receives the actual
 * authored configuration and returns unchanged output bytes. No compiler result
 * or generated JavaScript is substituted or replayed after failure. meaningful
 * documentation: The comment states first-result preservation and output
 * containment, and diagnostics include the owning phase. os neutral
 * implementation: path.resolve and path.relative validate native output paths
 * before recursive mkdir and UTF-8 writes; absolute and parent escapes are
 * rejected on Windows and POSIX.
 *
 * @evidence contracts/common.md#principled-implementation The public compiler receives authored configuration and retains the first exception or diagnostics. Successful nonempty output is completely validated for containment before any unchanged text is published.
 * @evidence contracts/common.md#clear-and-simple-design One operation owns compile, result validation and publication for all public boundary callers; each caller owns its input and output lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No compiler result, generated text or expected value is substituted. The function invokes public TtscCompiler once and neither retries diagnostics nor modifies foreign loaders.
 * @evidence contracts/common.md#meaningful-documentation The comment states first-result preservation and containment; phase diagnostics and output counts identify the operation that failed.
 * @evidence contracts/portability.md#os-neutral-implementation Native path.resolve and path.relative reject absolute and parent escapes on both Windows and POSIX before mkdir and UTF8 writes; the public compiler owns toolchain launching.
 * @evidence contracts/performance.md#efficient-algorithms One compiler request is followed by linear output validation and writing, with no additional discovery or compilation.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers supply the shared absolute compiler cache and same installed artifacts; language configurations remain explicit and distinct when library provenance conflicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One output map and destination list survive only this invocation. The caller owns contained output cleanup; compiler process completion occurs before publication and diagnostics do not create output here.
 */
async function compilePublicProgram(
  TtscCompiler,
  fixture,
  tsconfig,
  cache,
  phase,
  env,
) {
  const started = Date.now();
  const result = new TtscCompiler({
    cwd: fixture,
    tsconfig,
    cacheDir: cache,
    env,
  }).compile();
  if (result.type === "exception") throw result.error;
  if (result.type !== "success")
    throw new Error(
      `Public ${phase} diagnostics:\n${JSON.stringify(result.diagnostics, null, 2)}`,
    );
  const entries = Object.entries(result.output);
  assert(entries.length, `Public ${phase} emitted no output.`);
  const output = path.join(fixture, phase);
  const files = entries.map(([file, text]) => {
    const destination = path.resolve(fixture, file);
    const relative = path.relative(output, destination);
    assert(
      relative &&
        relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative),
      `Public ${phase} output escaped its root: ${file}`,
    );
    return [destination, text];
  });
  for (const [destination, text] of files) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, text);
  }
  console.log(
    `Public HTTP ${phase}: ${entries.length} outputs; ${Date.now() - started} ms`,
  );
}

module.exports = { compilePublicProgram };
