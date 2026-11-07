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
 * 4. Contrast SDK-disabled and standalone typia reuse with an unsupported host.
 *
 * @evidence contracts/testing.md#behavioral-verification Independent installed ttsx processes must execute real transformed validators and preserve __filename. Cold and invalidated runs start native producers; an unchanged warm run starts neither lint nor aggregate emission. Failed diagnostics cannot execute a stale successful entry.
 * @evidence contracts/testing.md#independent-expectations Authored string/number shapes establish literal validator results. The compiler's opt-in process trace records actual private observation arguments; output equality alone is never the warm-hit oracle.
 * @evidence contracts/testing.md#distinguishing-cases Nestia-only and explicit composed typia configurations contrast cold/warm execution for the entry and a linked source package. Their shared type-only DTO and the linked source itself change actual validator/value results. Source, config, package, plugin and external lint mutations, damaged cache and semantic failure retain separate assertions. SDK-disabled and supported standalone typia reuse omit metadata; an independently selected unobserved-input transform keeps the entry fresh.
 * @evidence contracts/testing.md#execution-ownership The SDK public integration owner calls this case once with its shared ordinary packed installation and compiler cache. Actual ttsx processes establish the producer-negotiation and runtime-cache boundary.
 * @evidence contracts/e2e.md#necessary-boundary Only the installed descriptor, native host, lint host and ttsx runtime together can prove negotiation skips whole-program analysis and emit while still running transformed application code.
 * @evidence contracts/e2e.md#shared-execution Both plugin spellings and all invalidation cases share one installed graph, native binary cache and authored project. The private config workspace supplies the frozen installed lint package, copied unchanged once into the owned fixture so its peer resolves through the same consumer; it adds no auto-discovery dependency to other consumers. A linked source package shares the same installation and requires its own runtime ownership connection. Only new input states require additional runtime launches; no package manager or packing command runs here.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One contained project and one assigned temporary trace directory own mutable inputs. The selected lint tool uses private copied files rather than mutable store hardlinks. A per-invocation source generation requires actual cold entry/dependency emission. Stable trace environment preserves warm equivalence; per-project counts cannot substitute a linked rebuild for entry invalidation. A successful launcher cleanup event and absence of trace integrity failure qualify zero-start claims. Corruption targets only newly created documents with this invocation's source provenance; completed children precede mutation and cleanup. The trace is acquired before fixture preparation; all later acquisitions share cleanup that attempts both owned roots and retains preparation and cleanup failures.
 * @evidence contracts/e2e.md#preserved-coverage This adds checked runtime reuse and invalidation assertions; existing public compiler, SDK generation, adapter and native unit cases retain their own connection and semantic assertions.
 */
export function test_public_emit_reuse(
  consumer: { root: string; requirePublic: NodeRequire },
  cache: string,
): void {
  const fixture = path.join(consumer.root, "projects/emit-reuse");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  const trace = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-emit-trace-"));
  let failure: { error: unknown } | undefined;
  const cleanupFailures: unknown[] = [];
  try {
    fs.rmSync(fixture, { recursive: true, force: true });
    fs.mkdirSync(fixture, { recursive: true });
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
    const lintRoot = path.join(fixture, "node_modules/@ttsc/lint");
    fs.cpSync(
      path.dirname(
        require.resolve("@ttsc/lint/package.json", {
          paths: [path.resolve(__dirname, "../../../../../config")],
        }),
      ),
      lintRoot,
      { recursive: true, force: false, errorOnExist: true },
    );
    const lint = require.resolve("@ttsc/lint", {
      paths: [fixture],
    });
    const linkedRoot = path.join(fixture, "node_modules/nestia-emit-linked");
    const linkedSource = path.join(linkedRoot, "index.ts");
    let linkedValue = 17;
    const generation = crypto.randomUUID();
    const documents = path.join(cache, "runtime-builds");
    const previousDocuments = new Set(
      fs.existsSync(documents) ? fs.readdirSync(documents) : [],
    );
    const failures: unknown[] = [];
    // Language preparation by an outer ttsx supplies its own compiler locator.
    // These independent launches must resolve the compiler installed beside the
    // public consumer, whose package authority permits completed emit reuse.
    const runtimeEnvironment = {
      ...process.env,
      NODE_PATH: "",
      NODE_OPTIONS: "",
      TTSC_TSGO_BINARY: undefined,
      TTSC_E2E_TRACE: trace,
    };
    let executable = false;
    const check = (label: string, action: () => void) => {
      try {
        action();
      } catch (error) {
        failures.push({ label, error });
        console.error(`Public emit reuse case failed: ${label}`, error);
      }
    };
    const program = `import "@nestjs/core";
import { TypedRoute } from "@nestia/core";
import typia from "typia";
import type { Shape } from "./shape";
import { linked, linkedFile, linkedValid } from "nestia-emit-linked";
export class Controller { @TypedRoute.Get() get(): Shape { throw new Error("unused"); } }
console.log(JSON.stringify({valid: typia.is<Shape>({value: "ok"}), file: __filename, marker: 1, sdk: Reflect.hasMetadata("nestia/OperationMetadata", Controller.prototype, "get"), linked, linkedFile, linkedValid}));
// Authored generation ${generation}
`;
    const config = {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noUnusedLocals: false,
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
    const traceEvents = () =>
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
        );
    const starts = (project: string) => {
      const rows = traceEvents().filter(
        (row) =>
          row.event === "process-attempt" &&
          row.cwd === project &&
          Array.isArray(row.argv),
      );
      return {
        emit: rows.filter((row) =>
          row.argv.some((arg: string) =>
            arg.startsWith("--emit-observations-json="),
          ),
        ).length,
        check: rows.filter((row) =>
          row.argv.some((arg: string) =>
            arg.startsWith("--check-observations-json="),
          ),
        ).length,
      };
    };
    const launch = (
      label: string,
      fresh: boolean,
      expectedValid = true,
      expectedMarker = 1,
      options: {
        sdk?: boolean;
        linkedFresh?: boolean;
      } = {},
    ) =>
      check(label, () => {
        const sdk = options.sdk ?? true;
        const before = starts(fixture);
        const linkedBefore = starts(linkedRoot);
        const result = spawnSync(
          process.execPath,
          [launcher, "--cache-dir", cache, "--tsconfig", configPath, source],
          {
            cwd: fixture,
            encoding: "utf8",
            maxBuffer: 16 * 1024 * 1024,
            env: {
              ...runtimeEnvironment,
              NESTIA_SDK_TRANSFORM: sdk ? "1" : "",
            },
          },
        );
        if (result.error) throw result.error;
        assert.equal(result.signal, null, label);
        assert.equal(result.status, 0, `${label}: ${result.stderr}`);
        executable = true;
        const events = traceEvents();
        assert(
          !events.some((row) => row.event === "integrity-failure"),
          `${label}: trace integrity failed`,
        );
        assert(
          events.some(
            (row) =>
              row.writerPid === result.pid &&
              row.event === "runtime-cleanup" &&
              row.data?.phase === "completed",
          ),
          `${label}: launcher trace did not complete`,
        );
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
            linked: linkedValue,
            linkedFile: linkedSource,
            linkedValid: expectedValid,
          },
          label,
        );
        const after = starts(fixture);
        const count = {
          emit: after.emit - before.emit,
          check: after.check - before.check,
        };
        assert(
          fresh
            ? count.check >= 1 && count.emit >= 1
            : count.check === 0 && count.emit === 0,
          `${label}: incorrect entry producer starts: ${JSON.stringify(count)}`,
        );
        const linkedAfter = starts(linkedRoot);
        const linkedCount = {
          emit: linkedAfter.emit - linkedBefore.emit,
          check: linkedAfter.check - linkedBefore.check,
        };
        if (options.linkedFresh === true)
          assert(
            linkedCount.emit >= 1 && linkedCount.check >= 1,
            `${label}: linked input change did not rebuild its program: ${JSON.stringify(linkedCount)}`,
          );
        if (options.linkedFresh === false || !fresh)
          assert.equal(
            linkedCount.emit + linkedCount.check,
            0,
            `${label}: linked program was not reused`,
          );
        console.log(
          `Public emit reuse: ${label}; entry ${JSON.stringify(count)}; linked ${JSON.stringify(linkedCount)}`,
        );
      });
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
      `import typia from "typia"; import type { Shape } from "../../shape"; export const linked = 17; export const linkedFile = __filename; export const linkedValid = typia.is<Shape>({value: "ok"}); // ${generation}`,
    );
    fs.writeFileSync(
      path.join(linkedRoot, "tsconfig.json"),
      JSON.stringify({ ...config, files: ["index.ts"] }),
    );
    launch("nestia-only cold", true, true, 1, { linkedFresh: true });
    if (!executable)
      throw new AggregateError(
        failures,
        "Runtime fixture preparation failed; dependent reuse cases cannot execute.",
      );
    launch("nestia-only warm", false);
    config.compilerOptions.plugins.push({ transform: "typia/lib/transform" });
    fs.writeFileSync(configPath, JSON.stringify(config));
    launch("explicit composed typia cold", true);
    launch("explicit composed typia warm", false);
    fs.writeFileSync(source, program.replace("marker: 1", "marker: 2"));
    launch("source change", true, true, 2);
    fs.writeFileSync(shape, "export interface Shape { value: number }");
    launch("shared type-only change", true, false, 2, { linkedFresh: true });
    fs.writeFileSync(
      linkedSource,
      fs
        .readFileSync(linkedSource, "utf8")
        .replace("linked = 17", "linked = 18"),
    );
    linkedValue = 18;
    launch("linked source change", true, false, 2, { linkedFresh: true });
    config.compilerOptions.noUnusedLocals = true;
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
    launch("SDK-disabled cold", true, false, 2, { sdk: false });
    launch("SDK-disabled warm", false, false, 2, { sdk: false });
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
            ...runtimeEnvironment,
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
      `import typia from "typia"; import type { Shape } from "./shape"; import { linked, linkedFile, linkedValid } from "nestia-emit-linked"; console.log(JSON.stringify({valid: typia.is<Shape>({value: "ok"}), file: __filename, marker: 2, sdk: false, linked, linkedFile, linkedValid}));`,
    );
    launch("standalone typia cold", true, false, 2, {
      sdk: false,
    });
    launch("standalone typia warm", false, false, 2, {
      sdk: false,
    });
    const external = path.join(fixture, "unsupported-input.txt");
    fs.writeFileSync(external, "allow");
    config.compilerOptions.plugins = [
      { transform: lint, configFile: lintPath },
      { transform: "@nestia/core/native/transform.cjs" },
      {
        transform: path.resolve(
          __dirname,
          "../../../fixtures/emit-unsupported/descriptor.cjs",
        ),
        external,
      },
    ];
    fs.writeFileSync(configPath, JSON.stringify(config));
    fs.writeFileSync(source, program.replace("marker: 1", "marker: 2"));
    launch("independent unsupported transform cold", true, false, 2);
    launch("independent unsupported transform fresh again", true, false, 2);
    check("unobserved external input failure", () => {
      fs.writeFileSync(external, "reject");
      const failed = spawnSync(
        process.execPath,
        [launcher, "--cache-dir", cache, "--tsconfig", configPath, source],
        {
          cwd: fixture,
          encoding: "utf8",
          env: {
            ...runtimeEnvironment,
            NESTIA_SDK_TRANSFORM: "1",
          },
        },
      );
      if (failed.error) throw failed.error;
      assert.equal(failed.signal, null);
      assert.notEqual(
        failed.status,
        0,
        "Unsupported external input replayed stale success.",
      );
      assert.match(
        failed.stderr,
        /unsupported contributor rejected external input/,
      );
      assert(!failed.stdout.includes('"marker"'));
    });
    if (failures.length)
      throw new AggregateError(failures, "Public emit reuse cases failed.");
  } catch (error) {
    failure = { error };
  } finally {
    for (const directory of [fixture, trace])
      try {
        fs.rmSync(directory, { recursive: true, force: true });
      } catch (error) {
        cleanupFailures.push(error);
      }
  }
  if (cleanupFailures.length)
    throw new AggregateError(
      failure ? [failure.error, ...cleanupFailures] : cleanupFailures,
      "Public emit reuse cleanup failed.",
    );
  if (failure) throw failure.error;
}
