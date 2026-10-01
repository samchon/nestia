import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Verifies repeated watch generations release their module realms and outputs.
 *
 * A small fixture compiler emits authored JavaScript-compatible configuration
 * input; real SDK loader, Swagger generation and child IPC execute normally.
 * Native compiler integration remains with the installed CLI watch feature.
 *
 * 1. Prepare five generations, verify artifacts wait for the handshake, and
 *    execute them with fresh CommonJS/ESM process state.
 * 2. Check both array input and a nonserializable application factory preserve
 *    their behavior without retaining modules in the watcher process.
 * 3. Refuse preparation, refuse generation and cancel a prepared generation;
 *    require original errors and no surviving owned temporary directories.
 *
 * @evidence contracts/testing.md#behavioral-verification The real watch-generation operation forks Node children, loads an emitted ESM configuration and invokes the Swagger application after its explicit second phase. Exact parent module-count stability, distinct child process realms, factory invocation traces, emitted document values and zero owned child directories distinguish repeated in-parent loading, missing handshake and cleanup failures.
 * @evidence contracts/testing.md#independent-expectations Five handwritten generation inputs prescribe five distinct process realms and five valid Swagger outputs. The mutable fixture compiler records actual parent PIDs and emits the authored config; an application factory writes its own invocation record. Expected content and failures come from fixture values rather than loader or watcher calculations.
 * @evidence contracts/testing.md#distinguishing-cases Array input exercises configuration and runtime materialization; alternating application factories exercise nonserializable callback input and src watch-plan fallback. Preparation refusal, invalid output parent and prepared cancellation cover three release paths, and artifact absence before generate proves the handshake's ordering.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching test-boundaries export; it invokes the built internal watch operation and real child processes against an owned fixture project. Its compiler is an explicit fixture tool, not a patched foreign process method or resolver, and full ttsc assembly remains in the existing CLI watch case.
 * @evidence contracts/e2e.md#necessary-boundary Real child process realms and IPC are necessary to prove that ESM configurations and application factories execute without moving nonserializable functions into the watcher, and that success/failure/cancellation end module retention and temporary output ownership.
 * @evidence contracts/e2e.md#shared-execution One tiny fixture compiler and project serve all preparation, generation and cancellation states without installation or native compilation. Each request needs its own child because ending that process realm is the resource behavior being tested.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each request starts a fresh child with an immutable authored config for that phase. The prior output is removed before preparation, traces are append-only observations and parent environment values are restored in finally. Every prepared child is closed before its fixture files are removed.
 * @evidence contracts/e2e.md#preserved-coverage Existing CLI watch tests retain edits, debouncing, output ignores and installed compiler behavior. This adds bounded retention, watcher-before-artifact ordering and all generation release paths without replacing those real CLI assertions with fixture-tool success.
 */
export const test_sdk_watch_generation_retention = async (): Promise<void> => {
  const repository = path.resolve(process.cwd(), "../..");
  const { NestiaSwaggerWatch } = require(
    path.join(
      repository,
      "packages/sdk/lib/executable/internal/NestiaSwaggerWatch",
    ),
  ) as {
    NestiaSwaggerWatch: {
      open: (props: {
        configFile: string;
        projectFile: string;
        signal?: AbortSignal;
      }) => Promise<{
        configurations: Array<{ input: unknown }>;
        generate: () => Promise<void>;
        close: () => Promise<void>;
      }>;
    };
  };
  const root = fs.mkdtempSync(
    path.join(process.cwd(), ".sdk-watch-retention-"),
  );
  const previousDirectory = process.cwd();
  const previousProject = process.env.NESTIA_PROJECT;
  const trace = path.join(root, "trace.jsonl");
  const output = path.join(root, "swagger.json");
  const config = path.join(root, "nestia.config.mts");
  const generations: Array<{ close: () => Promise<void> }> = [];
  try {
    const compiler = path.join(root, "node_modules/ttsc");
    fs.mkdirSync(compiler, { recursive: true });
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(
      path.join(compiler, "package.json"),
      JSON.stringify({ name: "ttsc", bin: { ttsc: "fixture.cjs" } }),
    );
    fs.writeFileSync(
      path.join(compiler, "fixture.cjs"),
      `
const fs = require("node:fs");
const path = require("node:path");
const options = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf("-p") + 1], "utf8"));
fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({ kind: "compile", pid: process.ppid }) + "\\n");
for (const file of options.include) {
  const source = path.resolve(process.cwd(), file);
  const relative = path.relative(options.compilerOptions.rootDir === "." ? process.cwd() : options.compilerOptions.rootDir, source);
  const destination = path.join(options.compilerOptions.outDir, relative.replace(/\\.mts$/, ".mjs"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
`,
    );
    fs.writeFileSync(
      path.join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { target: "ES2022", module: "NodeNext" },
      }),
    );
    const writeConfiguration = (
      factory: boolean,
      target = output,
      refusal = false,
    ): void => {
      fs.writeFileSync(
        config,
        `
import fs from "node:fs";
fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({ kind: "module", pid: process.pid, born: performance.timeOrigin }) + "\\n");
${refusal ? 'throw new Error("owned configuration refusal");' : ""}
export default {
  input: ${
    factory
      ? `async () => {
    fs.appendFileSync(${JSON.stringify(trace)}, JSON.stringify({ kind: "application", pid: process.pid }) + "\\n");
    return { container: { getModules: () => new Map() }, config: {} };
  }`
      : "[]"
  },
  swagger: { output: ${JSON.stringify(target)}, operationId: () => "owned-operation" },
};
`,
      );
    };
    const retainedDirectories = (): string[] => {
      const directories: string[] = [];
      for (const name of ["config-loader", "runtime"]) {
        const parent = path.join(root, "node_modules/.nestia", name);
        if (fs.existsSync(parent)) directories.push(...fs.readdirSync(parent));
      }
      return directories;
    };
    const moduleCount = Object.keys(require.cache).length;
    process.chdir(root);
    const request = {
      configFile: config,
      projectFile: path.join(root, "tsconfig.json"),
    };
    for (let index = 0; index < 5; ++index) {
      const factory = index % 2 === 1;
      writeConfiguration(factory);
      fs.rmSync(output, { force: true });
      const generation = await NestiaSwaggerWatch.open(request);
      generations.push(generation);
      assert.equal(
        fs.existsSync(output),
        false,
        "generation preceded the watcher handshake",
      );
      assert.deepEqual(
        generation.configurations[0].input,
        factory ? path.join(root, "src") : [],
      );
      await generation.generate();
      await generation.close();
      const document = JSON.parse(fs.readFileSync(output, "utf8"));
      assert.deepEqual(document.paths, {});
      assert.deepEqual(retainedDirectories(), []);
      assert.equal(Object.keys(require.cache).length, moduleCount);
    }
    const observations = fs
      .readFileSync(trace, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const loaded = observations.filter((entry) => entry.kind === "module");
    assert.equal(loaded.length, 5);
    assert.equal(
      new Set(loaded.map((entry) => `${entry.pid}:${entry.born}`)).size,
      5,
    );
    assert.equal(
      observations.filter((entry) => entry.kind === "application").length,
      2,
    );
    assert.equal(
      observations.filter((entry) => entry.kind === "compile").length,
      8,
    );

    writeConfiguration(false, output, true);
    await assert.rejects(
      NestiaSwaggerWatch.open(request),
      /owned configuration refusal/,
    );
    assert.deepEqual(retainedDirectories(), []);

    writeConfiguration(false, path.join(root, "missing/swagger.json"));
    const failed = await NestiaSwaggerWatch.open(request);
    generations.push(failed);
    await assert.rejects(failed.generate(), /directory/);
    assert.deepEqual(retainedDirectories(), []);

    writeConfiguration(false);
    fs.rmSync(output, { force: true });
    const cancelled = await NestiaSwaggerWatch.open(request);
    generations.push(cancelled);
    await cancelled.close();
    await cancelled.close();
    assert.equal(fs.existsSync(output), false);
    assert.deepEqual(retainedDirectories(), []);
    assert.equal(Object.keys(require.cache).length, moduleCount);

    // A configuration with top-level await keeps preparation in flight while
    // still allowing IPC cancellation. Stop must own that child immediately.
    writeConfiguration(false);
    const pausedFile = path.join(root, "preparation-paused");
    fs.appendFileSync(
      config,
      `
fs.writeFileSync(${JSON.stringify(pausedFile)}, "paused");
await new Promise(() => {});
`,
    );
    const controller = new AbortController();
    const preparing = NestiaSwaggerWatch.open({
      ...request,
      signal: controller.signal,
    });
    preparing.catch(() => {});
    try {
      const deadline = Date.now() + 5_000;
      while (!fs.existsSync(pausedFile)) {
        assert.ok(
          Date.now() < deadline,
          "configuration preparation never paused",
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.ok(
        retainedDirectories().length > 0,
        "paused preparation owns no emitted config",
      );
      assert.equal(fs.existsSync(output), false);
    } finally {
      controller.abort();
      await assert.rejects(preparing, { name: "AbortError" });
    }
    assert.deepEqual(retainedDirectories(), []);
    assert.equal(fs.existsSync(output), false);
    assert.equal(Object.keys(require.cache).length, moduleCount);
  } finally {
    const released = await Promise.allSettled(
      generations.map((generation) => generation.close()),
    );
    process.chdir(previousDirectory);
    if (previousProject === undefined) delete process.env.NESTIA_PROJECT;
    else process.env.NESTIA_PROJECT = previousProject;
    fs.rmSync(root, { recursive: true, force: true });
    for (const result of released)
      if (result.status === "rejected") throw result.reason;
  }
};
