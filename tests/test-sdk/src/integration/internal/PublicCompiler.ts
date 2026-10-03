import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

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
export async function compilePublicProgram(
  TtscCompiler: typeof import("ttsc").TtscCompiler,
  fixture: string,
  tsconfig: string,
  cache: string,
  phase: string,
  env?: NodeJS.ProcessEnv,
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
    return [destination, text] as const;
  });
  for (const [destination, text] of files) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, text);
  }
  console.log(
    `Public HTTP ${phase}: ${entries.length} outputs; ${Date.now() - started} ms`,
  );
}

/**
 * Executes the installed compiler CLI and retains its completed first result.
 *
 * Callers own expected success or diagnostic failure. A launch failure or
 * termination is never interchangeable with a compiler rejecting its input.
 *
 * @evidence contracts/common.md#principled-implementation The installed ttsc manifest supplies its actual binary entry, invoked through this Node executable. Launch errors, signals and absent numeric exit status reject before a caller interprets diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design One boundary resolves the installed binary, starts it and validates completion; each case owns arguments, diagnostics, output and fixture lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual installed CLI runs once with ordinary resolution and unchanged output. No resolver, compiler result or foreign method is replaced and failures are not retried.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why completed compiler failure differs from inability to execute and identifies the caller's assertion ownership.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths resolve the installed JavaScript binary and cwd. Node receives an argument array without a shell or Windows command shim, and loader overrides are cleared for ordinary installed resolution.
 * @evidence contracts/performance.md#efficient-algorithms One synchronous CLI invocation returns its first captured stdout, stderr and status; no additional project discovery or native preparation is requested here.
 * @evidence contracts/performance.md#reuse-equivalent-work All callers supply the existing installed artifact graph and absolute compiler cache rather than installing or rebuilding toolchains per case.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The child settles before the result returns. Callers consume the bounded diagnostic result and release their own projects; this operation creates no host or retained worker.
 */
export function runPublicCompilerCli(
  consumer: { requirePublic: NodeRequire },
  fixture: string,
  cache: string,
  args: readonly string[],
) {
  const manifest = consumer.requirePublic.resolve("ttsc/package.json");
  const pack = consumer.requirePublic("ttsc/package.json");
  const bin = typeof pack.bin === "string" ? pack.bin : pack.bin.ttsc;
  const result = spawnSync(
    process.execPath,
    [path.resolve(path.dirname(manifest), bin), "--cache-dir", cache, ...args],
    {
      cwd: fixture,
      encoding: "utf8",
      env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
    },
  );
  if (result.error) throw result.error;
  assert.equal(result.signal, null, "The compiler was terminated by a signal.");
  assert(
    Number.isInteger(result.status),
    "The compiler returned no exit status.",
  );
  return result;
}
