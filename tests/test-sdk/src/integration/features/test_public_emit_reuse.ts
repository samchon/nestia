import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Verifies checked aggregate runtime reuse through independent ttsx launches.
 *
 * A warm result must skip lint and the entire native aggregate, rather than
 * reusing only a dependency or returning unchanged bytes after recompilation.
 * The opt-in compiler trace records actual process arguments for that
 * distinction.
 *
 * 1. Launch a typed route and typia validator with lint from installed tarballs.
 * 2. Require an unchanged launch to execute under its original source identity
 *    without starting either producer.
 * 3. Change source, type-only, config, package and external lint inputs, then
 *    corrupt task-owned runtime documents and reject a diagnostic failure.
 * 4. Contrast SDK-disabled reuse and an independently selected old typia host.
 *
 * @evidence contracts/testing.md#behavioral-verification Independent installed ttsx processes must execute real transformed validators and preserve __filename. Cold and invalidated runs start native producers; an unchanged warm run starts neither lint nor aggregate emission. Failed diagnostics cannot execute a stale successful entry.
 * @evidence contracts/testing.md#independent-expectations Authored string/number shapes establish literal validator results. The compiler's opt-in process trace records actual private observation arguments; output equality alone is never the warm-hit oracle.
 * @evidence contracts/testing.md#distinguishing-cases Nestia-only and explicit composed typia configurations contrast cold/warm execution, including a linked source package. Source, type-only declaration, config, package, plugin configuration and external lint configuration mutations, damaged cache and semantic failure retain separate assertions. SDK-disabled cold/warm execution must omit metadata, and standalone unsupported typia must keep lint running.
 * @evidence contracts/testing.md#execution-ownership The SDK public integration owner calls this case once with its shared ordinary packed installation and compiler cache. Actual ttsx processes establish the producer-negotiation and runtime-cache boundary.
 * @evidence contracts/e2e.md#necessary-boundary Only the installed descriptor, native host, lint host and ttsx runtime together can prove negotiation skips whole-program analysis and emit while still running transformed application code.
 * @evidence contracts/e2e.md#shared-execution Both plugin spellings and all invalidation cases share one installed graph, native binary cache and authored project. The private config workspace supplies the explicitly selected installed lint tool without adding auto-discovery dependencies to other consumers. A linked source package shares the same installation and requires its own runtime ownership connection. Only new input states require additional runtime launches; no package is installed or packed here.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One contained project and one assigned temporary trace directory own mutable inputs. Stable trace environment preserves cache equivalence; completed children precede mutation and cleanup. Only runtime documents whose snapshot names this project may be corrupted.
 * @evidence contracts/e2e.md#preserved-coverage This adds checked runtime reuse and invalidation assertions; existing public compiler, SDK generation, adapter and native unit cases retain their own connection and semantic assertions.
 */
export function test_public_emit_reuse(
  consumer: { root: string; requirePublic: NodeRequire },
  cache: string,
): void {
  const fixture = path.join(consumer.root, "projects/emit-reuse");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(fixture, { recursive: true, force: true });
  fs.mkdirSync(fixture, { recursive: true });
  const trace = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-emit-trace-"));
  const manifest = consumer.requirePublic("ttsc/package.json");
  console.log(`Public emit reuse: ttsc ${manifest.version}`);
  const launcher = path.resolve(
    path.dirname(consumer.requirePublic.resolve("ttsc/package.json")),
    manifest.bin.ttsx,
  );
  const source = path.join(fixture, "main.ts");
  const shape = path.join(fixture, "shape.ts");
  const configPath = path.join(fixture, "tsconfig.json");
  const packagePath = path.join(fixture, "package.json");
  const lintPath = path.join(fixture, "lint.config.json");
  const lint = require.resolve("@ttsc/lint", {
    paths: [path.resolve(__dirname, "../../../../../config")],
  });
  const linkedRoot = path.join(fixture, "node_modules/nestia-emit-linked");
  const linkedSource = path.join(linkedRoot, "index.ts");
  const generation = crypto.randomUUID();
  const documents = path.join(cache, "runtime-builds");
  const previousDocuments = new Set(
    fs.existsSync(documents) ? fs.readdirSync(documents) : [],
  );
  const failures: unknown[] = [];
  const check = (label: string, action: () => void) => {
    try {
      action();
    } catch (error) {
      failures.push({ label, error });
    }
  };
  const program = `import "reflect-metadata";
import { TypedRoute } from "@nestia/core";
import typia from "typia";
import type { Shape } from "./shape";
import { linked, linkedFile } from "nestia-emit-linked";
export class Controller { @TypedRoute.Get() get(): Shape { throw new Error("unused"); } }
console.log(JSON.stringify({valid: typia.is<Shape>({value: "ok"}), file: __filename, marker: 1, sdk: Reflect.hasMetadata("nestia/OperationMetadata", Controller.prototype, "get"), linked, linkedFile}));
// Authored generation ${generation}
`;
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      skipLibCheck: true,
      experimentalDecorators: true,
      types: ["node"],
      ignoreDeprecations: "6.0",
      outDir: "out",
      noEmit: true,
      plugins: [
        { transform: lint, configFile: lintPath },
        { transform: "@nestia/core/native/transform.cjs" },
      ] as Record<string, unknown>[],
    },
    files: ["main.ts", "shape.ts"],
  };
  const attempts = () =>
    fs
      .readdirSync(trace)
      .filter((name) => name.endsWith(".jsonl"))
      .flatMap((name) =>
        fs
          .readFileSync(path.join(trace, name), "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((row) => JSON.parse(row)),
      )
      .filter(
        (row) =>
          row.event === "process-attempt" &&
          Array.isArray(row.argv) &&
          row.argv.some(
            (arg: string) =>
              arg.startsWith("--emit-observations-json=") ||
              arg.startsWith("--check-observations-json="),
          ),
      );
  const launch = (
    label: string,
    fresh: boolean,
    expectedValid = true,
    expectedMarker = 1,
    sdk = true,
    minimumStarts = 2,
  ) =>
    check(label, () => {
      const before = attempts().length;
      const result = spawnSync(
        process.execPath,
        [launcher, "--cache-dir", cache, "--tsconfig", configPath, source],
        {
          cwd: fixture,
          encoding: "utf8",
          maxBuffer: 16 * 1024 * 1024,
          env: {
            ...process.env,
            NODE_PATH: "",
            NODE_OPTIONS: "",
            TTSC_E2E_TRACE: trace,
            NESTIA_SDK_TRANSFORM: sdk ? "1" : "",
          },
        },
      );
      if (result.error) throw result.error;
      assert.equal(result.signal, null, label);
      assert.equal(result.status, 0, `${label}: ${result.stderr}`);
      const rows = result.stdout
        .trim()
        .split(/\r?\n/)
        .filter((row) => row.startsWith("{"));
      assert(
        rows.length,
        `${label}: missing application output: ${result.stdout}`,
      );
      const output = JSON.parse(rows[rows.length - 1]!);
      assert.deepEqual(
        output,
        {
          valid: expectedValid,
          file: source,
          marker: expectedMarker,
          sdk,
          linked: 17,
          linkedFile: linkedSource,
        },
        label,
      );
      const count = attempts().length - before;
      assert(
        fresh ? count >= minimumStarts : count === 0,
        `${label}: expected ${fresh ? `at least ${minimumStarts} producer starts` : "no producer starts"}, got ${count}`,
      );
      console.log(`Public emit reuse: ${label}; ${count} producer starts`);
    });
  try {
    fs.writeFileSync(source, program);
    fs.writeFileSync(shape, "export interface Shape { value: string }");
    fs.writeFileSync(
      packagePath,
      JSON.stringify({
        private: true,
        dependencies: { "@nestia/core": "*", "nestia-emit-linked": "0.0.0" },
      }),
    );
    fs.writeFileSync(lintPath, JSON.stringify({ rules: {} }));
    fs.writeFileSync(configPath, JSON.stringify(config));
    fs.mkdirSync(linkedRoot, { recursive: true });
    fs.writeFileSync(
      path.join(linkedRoot, "package.json"),
      JSON.stringify({
        name: "nestia-emit-linked",
        version: "0.0.0",
        type: "commonjs",
        exports: "./index.ts",
      }),
    );
    fs.writeFileSync(
      linkedSource,
      `export const linked = 17; export const linkedFile = __filename; // ${generation}`,
    );
    fs.writeFileSync(
      path.join(linkedRoot, "tsconfig.json"),
      JSON.stringify({ ...config, files: ["index.ts"] }),
    );
    launch("nestia-only cold", true);
    launch("nestia-only warm", false);
    config.compilerOptions.plugins.push({ transform: "typia/lib/transform" });
    fs.writeFileSync(configPath, JSON.stringify(config));
    launch("explicit composed typia cold", true);
    launch("explicit composed typia warm", false);
    fs.writeFileSync(source, program.replace("marker: 1", "marker: 2"));
    launch("source change", true, true, 2);
    fs.writeFileSync(shape, "export interface Shape { value: number }");
    launch("type-only change", true, false, 2);
    config.compilerOptions.strict = false;
    fs.writeFileSync(configPath, JSON.stringify(config));
    launch("config change", true, false, 2);
    fs.appendFileSync(packagePath, "\n");
    launch("package change", true, false, 2);
    config.compilerOptions.plugins[1]!.numeric = true;
    fs.writeFileSync(configPath, JSON.stringify(config));
    launch("plugin config change", true, false, 2);
    fs.appendFileSync(lintPath, "\n");
    launch("external lint config change", true, false, 2);
    launch("changed state warm", false, false, 2);
    launch("SDK-disabled cold", true, false, 2, false);
    launch("SDK-disabled warm", false, false, 2, false);
    launch("SDK-enabled restored", false, false, 2);
    check("damage owned cache", () => {
      let damaged = 0;
      for (const name of fs.readdirSync(documents)) {
        if (!name.endsWith(".json") || previousDocuments.has(name)) continue;
        const file = path.join(documents, name);
        const document = JSON.parse(fs.readFileSync(file, "utf8"));
        if (typeof document.payload !== "string") continue;
        const entry = JSON.parse(document.payload);
        const owners: unknown[] = Object.values(
          entry.result?.emittedSources ?? {},
        ).flat();
        if (
          owners.some(
            (owner) =>
              typeof owner === "string" &&
              [source, linkedSource].includes(path.resolve(owner)),
          )
        ) {
          fs.writeFileSync(file, "{damaged task-owned cache");
          damaged++;
        }
      }
      assert(
        damaged > 0,
        "No task-owned completed-runtime document was published.",
      );
    });
    launch("damaged cache", true, false, 2);
    check("failed diagnostics", () => {
      fs.appendFileSync(source, "\nexport const broken: string = 42;\n");
      const failed = spawnSync(
        process.execPath,
        [launcher, "--cache-dir", cache, "--tsconfig", configPath, source],
        {
          cwd: fixture,
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_PATH: "",
            NODE_OPTIONS: "",
            TTSC_E2E_TRACE: trace,
            NESTIA_SDK_TRANSFORM: "1",
          },
        },
      );
      if (failed.error) throw failed.error;
      assert.equal(failed.signal, null);
      assert.notEqual(
        failed.status,
        0,
        "A semantic failure replayed stale success.",
      );
      assert.match(failed.stderr, /not assignable/);
      assert(
        !failed.stdout.includes('"marker"'),
        "A rejected entry executed stale application output.",
      );
    });
    config.compilerOptions.plugins = [
      { transform: lint, configFile: lintPath },
      { transform: "@nestia/core/native/transform.cjs", enabled: false },
      { transform: "typia/lib/transform" },
    ];
    fs.writeFileSync(configPath, JSON.stringify(config));
    fs.writeFileSync(
      source,
      `import typia from "typia"; import type { Shape } from "./shape"; import { linked, linkedFile } from "nestia-emit-linked"; console.log(JSON.stringify({valid: typia.is<Shape>({value: "ok"}), file: __filename, marker: 2, sdk: false, linked, linkedFile}));`,
    );
    launch("standalone unsupported typia cold", true, false, 2, false, 1);
    launch(
      "standalone unsupported typia fresh again",
      true,
      false,
      2,
      false,
      1,
    );
    if (failures.length)
      throw new AggregateError(failures, "Public emit reuse cases failed.");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    fs.rmSync(trace, { recursive: true, force: true });
  }
}
