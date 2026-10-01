const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const { prepare } = require("./internal/consumer.cjs");
const { test_sdk_producer_metadata } = require("./internal/test_sdk_producer_metadata.cjs");
const { run: runBenchmark } = require("./internal/benchmark.cjs");
const { prepareMigration, prepareMigrationConsumer, testMigrationConsumer } = require("./internal/migration.cjs");
const { test_sdk_cli_argument_diagnostics } = require("./internal/boundary/test_sdk_cli_argument_diagnostics.cjs");
const { test_sdk_cli_dependencies } = require("./internal/boundary/test_sdk_cli_dependencies.cjs");
const { test_sdk_distribution_cwd_restore } = require("./internal/boundary/test_sdk_distribution_cwd_restore.cjs");
const { test_sdk_bundle_preserves_customized_output } = require("./internal/boundary/test_sdk_bundle_preserves_customized_output.cjs");
const { test_sdk_exact_optional_compiler } = require("./internal/exact_optional/test_sdk_exact_optional_compiler.cjs");
const { test_core_compiler_wrappers } = require("./internal/core_wrappers/test_core_compiler_wrappers.cjs");

/**
 * Runs the installed rich producer and its generated consumer.
 *
 * The ordinary producer and consumer each run once under their original false
 * optional-property premise. One minimal exact-optional producer/consumer pair
 * retains the contradictory original true premise. Generation reads public
 * caller-owned applications instead of compiling controller inputs again.
 *
 * 1. Install the freshly packed packages once and copy the authored inputs.
 * 2. Execute explicit compiler-wrapper and exact-optional boundaries, then compile the rich producer and generate from its app.
 * 3. Compile the combined consumer once, execute its complete cases against sequential Express/Fastify backends and release resources.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed public TtscCompiler emits both real programs, installed NestiaSdkApplication generates artifacts from the emitted app and the consumer exercises actual requests; compile, generation and request failures propagate.
 * @evidence contracts/testing.md#independent-expectations Request cases consume independent authored DTO copies under consumer/src/oracle, arithmetic and status expectations; the harness requires nonempty emitted files and guards their containment rather than manufacturing an expected product snapshot.
 * @evidence contracts/testing.md#distinguishing-cases The combined input retains separate scenario routes, types and request failures; incompatible diagnostic/noEmit and worker cases remain explicit pending transfers in the ledger.
 * @evidence contracts/testing.md#execution-ownership The sole test-e2e workspace entry invokes this exported operation. It uses installed public compiler and SDK APIs, and never calls legacy workspace starts or compiles projects per feature.
 * @evidence contracts/e2e.md#necessary-boundary One actual packed installation connects published exports, the composed native producer, generator, generated client and HTTP/WebSocket/MCP runtime. Pure operation calls cannot prove that connection.
 * @evidence contracts/e2e.md#shared-execution One ordinary producer and consumer share a single installation under the original false flag. The contradictory exact-optional boundary adds only two public compiler requests and one application-input All invocation (SDK and Swagger generation) with a no-listen app. Nine named diagnostic/noEmit wrapper requests are recorded separately (API two, CLI seven); they reuse the same installation/native cache and create no backend. Primary SDK/Swagger/E2E generation and the necessary incompatible propagated SDK ABI are two explicit generation operations on the same reflected application; both outputs enter that single consumer program. The original customized bundle is prepared by one direct filesystem bundle call; existing All refills its deleted file and the same consumer compile consumes the preserved exports without another generator or compiler. Application-input generation reuses the producer's reflected metadata without ConfigAnalyzer's source-input recompilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique sandbox owns immutable input copies and phase outputs. Express closes after all request and benchmark clients settle; Fastify then acquires a fresh application over the same emitted controller classes and compiled consumer, with its own MCP client. Conflicting HTTP parser/adapter configuration requires these two backend lifetimes, while compiler/install/generation inputs remain identical. Explicit route/type namespaces isolate scenarios, an ephemeral port avoids collisions and finally closes the backend before removing the installation and sandbox. An evidence directory keyed by that unique sandbox retains compiler result buffers, emitted sources, raw operation metadata and packed hashes before cleanup; dependencies are not copied and failed compiler buffers are never published as runnable artifacts.
 * @evidence contracts/e2e.md#preserved-coverage The per-assertion campaign ledger identifies request destinations and pending legacy transfers. The rich program does not certify untransferred cases; originals remain until verified ownership exists.
 */
const main = async () => {
  const started = Date.now();
  process.env.TTSC_CACHE_DIR = path.resolve(__dirname,
    process.env.TTSC_CACHE_DIR ?? "../../node_modules/.cache/ttsc");
  const processCases = path.join(__dirname, "evidence/src/features");
  const processes = cp.spawnSync(process.execPath, [
    "--test",
    "--test-concurrency=1",
    ...fs.readdirSync(processCases).filter((name) => name.startsWith("test_") && name.endsWith(".mjs")).map((name) => path.join(processCases, name)),
  ], { cwd: __dirname, stdio: "inherit", windowsHide: true });
  const processFailure = processes.error || processes.signal || processes.status !== 0;
  const processMilliseconds = Date.now() - started;
  const failures = [];
  if (processFailure) failures.push("process boundaries");
  const sandbox = fs.mkdtempSync(path.join(__dirname, ".tmp-rich-"));
  const artifacts = path.resolve(__dirname, "../../.wiki/evidence-lean/1775-rich-artifacts", path.basename(sandbox));
  const record = (file, value) => {
    const locations = new WeakMap();
    fs.writeFileSync(path.join(artifacts, file), JSON.stringify(value, function (key, entry) {
      if (entry === undefined) return { kind: "undefined" };
      if (typeof entry === "bigint") return { kind: "bigint", value: entry.toString() };
      if (typeof entry === "function") return { kind: "function", name: entry.name };
      if (entry !== null && typeof entry === "object") {
        const previous = locations.get(entry);
        if (previous !== undefined) return { $ref: previous };
        const parent = locations.get(this);
        locations.set(entry, parent === undefined ? "$" : `${parent}[${JSON.stringify(key)}]`);
        if (entry instanceof Error)
          return { name: entry.name, message: entry.message, stack: entry.stack, cause: entry.cause, errors: entry.errors };
      }
      return entry;
    }, 2));
  };
  const phaseTimings = [{ phase: "process boundaries", milliseconds: processMilliseconds, status: processFailure ? "failure" : "success" }];
  const measure = async (phase, operation) => {
    const begin = Date.now();
    let status = "failure";
    try {
      const output = await operation();
      status = Array.isArray(output?.failures) && output.failures.length ? "failure" : "success";
      return output;
    } finally {
      phaseTimings.push({ phase, milliseconds: Date.now() - begin, status });
    }
  };
  const collectMetadata = () => {
    const metadata = [];
    const producer = path.join(sandbox, ".producer") + path.sep;
    for (const [file, module] of Object.entries(require.cache)) {
      if (!file.startsWith(producer)) continue;
      for (const [name, property] of Object.entries(Object.getOwnPropertyDescriptors(module.exports))) {
        const controller = property.value;
        if (typeof controller !== "function" || !controller.prototype) continue;
        for (const method of Object.getOwnPropertyNames(controller.prototype)) {
          if (method === "constructor") continue;
          const operation = Reflect.getMetadata?.("nestia/OperationMetadata", controller.prototype, method);
          if (operation !== undefined) metadata.push({ file: path.relative(sandbox, file), name, method, operation });
        }
      }
    }
    return metadata;
  };
  const snapshot = () => {
    const errors = [];
    for (const file of ["fixture/src", "consumer/src", "exact-optional", ".producer", ".consumer", "swagger.json", "package.json", ...fs.readdirSync(sandbox).filter((name) => /^tsconfig\..*\.json$/.test(name))]) {
      const source = path.join(sandbox, file);
      try {
        if (fs.existsSync(source)) fs.cpSync(source, path.join(artifacts, file), { recursive: true });
      } catch (error) { errors.push(error); }
    }
    try {
      const metadata = collectMetadata();
      record("operation-metadata.json", metadata);
      console.log(`Rich evidence artifacts: ${artifacts}; ${metadata.length} actual operation metadata records.`);
    } catch (error) { errors.push(error); }
    try { record("timings.json", { totalMilliseconds: Date.now() - started, phases: phaseTimings }); }
    catch (error) { errors.push(error); }
    if (errors.length) throw new AggregateError(errors, "Rich artifact capture failed.");
  };
  let installation;
  let backend;
  let primaryError;
  const secondaryErrors = [];
  try {
    fs.mkdirSync(artifacts, { recursive: true });
    installation = await measure("packed installation", () => prepare(__dirname));
    const packs = path.join(installation.directory, "packs");
    record("tarballs.json", fs.readdirSync(packs).filter((name) => name.endsWith(".tgz")).map((name) => ({
      name, sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(packs, name))).digest("hex"),
    })));
    installation.mount(sandbox);
    fs.writeFileSync(path.join(sandbox, "package.json"), JSON.stringify({ private: true, type: "commonjs" }));
    fs.cpSync(path.join(__dirname, "fixture"), path.join(sandbox, "fixture"), { recursive: true });
    fs.cpSync(path.join(__dirname, "consumer"), path.join(sandbox, "consumer"), { recursive: true });
    const scenarios = path.join(sandbox, "fixture/src/scenarios");
    for (const scenario of fs.readdirSync(scenarios, { withFileTypes: true })) {
      if (!scenario.isDirectory()) continue;
      for (const folder of ["structures", "interfaces"]) {
        const source = path.join(scenarios, scenario.name, folder);
        if (fs.existsSync(source)) fs.cpSync(source,
          path.join(sandbox, "consumer/src/oracle", scenario.name, folder), { recursive: true });
      }
    }
    const authoredCases = [];
    const caseRoot = path.join(sandbox, "consumer/src/features");
    const inventoryCases = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const location = path.join(directory, entry.name);
        if (entry.isDirectory()) inventoryCases(location);
        else if (entry.name.startsWith("test_") && entry.name.endsWith(".ts"))
          authoredCases.push({
            file: path.relative(caseRoot, location).split(path.sep).join("/").replace(/\.ts$/, ".js"),
            name: entry.name.slice(0, -3),
          });
      }
    };
    inventoryCases(caseRoot);
    for (const [name, operation] of [
      ["sdk_cli_argument_diagnostics", test_sdk_cli_argument_diagnostics],
      ["sdk_cli_dependencies", test_sdk_cli_dependencies],
      ["sdk_distribution_cwd_restore", test_sdk_distribution_cwd_restore],
    ]) {
      try {
        await measure(name, () => operation({ installation, sandbox, record }));
        console.log(` - ${name}: passed`);
      } catch (error) {
        failures.push(name);
        console.error(error);
      }
    }
    try {
      await measure("migration CLI arguments", () => prepareMigration({ installation, sandbox }));
    } catch (error) {
      failures.push("migration CLI arguments/archiving");
      console.error(error);
    }
    const { TtscCompiler } = require(require.resolve("ttsc", { paths: [installation.directory] }));
    const { NestiaSdkApplication } = require(require.resolve("@nestia/sdk", { paths: [installation.directory] }));
    try {
      const wrappers = await measure("core wrapper compiler requests (API 2, CLI 7)", () => test_core_compiler_wrappers({
        installation, sandbox, record, TtscCompiler, cacheDir: process.env.TTSC_CACHE_DIR,
      }));
      failures.push(...wrappers.failures.map((name) => `core wrapper ${name}`));
    } catch (error) {
      failures.push("core compiler wrapper preparation");
      console.error(error);
    }
    try {
      await measure("exact optional (compiler 2, All 1: SDK+Swagger, unlistened app 1)", () => test_sdk_exact_optional_compiler({
        installation, sandbox, record, TtscCompiler, cacheDir: process.env.TTSC_CACHE_DIR,
      }));
    } catch (error) {
      failures.push("exact optional producer/generator/consumer boundary");
      console.error(error);
    }
    const common = {
      extends: path.resolve(__dirname, "../config/tsconfig.json"),
      compilerOptions: {
        noEmit: false,
        exactOptionalPropertyTypes: false,
        types: ["node"],
        noUnusedLocals: false,
        noUnusedParameters: false,
        plugins: [{ transform: "@nestia/core/native/transform.cjs" }],
      },
    };
    const compile = (phase, source, options = {}) => {
      const outputRoot = path.join(sandbox, `.${phase}`);
      const project = `tsconfig.${phase}.json`;
      fs.writeFileSync(path.join(sandbox, project), JSON.stringify({
        ...common,
        compilerOptions: { ...common.compilerOptions, ...options, rootDir: `${source}/src`, outDir: `.${phase}` },
        include: [`${source}/src/**/*.ts`],
      }));
      const begin = Date.now();
      const result = new TtscCompiler({ cwd: sandbox, tsconfig: project }).compile();
      phaseTimings.push({ phase: `compiler ${phase}`, milliseconds: Date.now() - begin, status: result.type });
      record(`${phase}.compiler-result.json`, result);
      if (result.type === "exception") throw result.error;
      if (result.type !== "success") throw new Error(JSON.stringify(result.diagnostics));
      if (Object.keys(result.output).length === 0) throw new Error(`${phase} emitted no artifacts.`);
      for (const [file, text] of Object.entries(result.output)) {
        const destination = path.resolve(sandbox, file);
        const relative = path.relative(outputRoot, destination);
        if (!relative || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
          throw new Error(`Compiler output escapes ${phase}: ${file}`);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, text);
      }
    };
    const sdkTransform = process.env.NESTIA_SDK_TRANSFORM;
    try {
      process.env.NESTIA_SDK_TRANSFORM = "1";
      console.log("Rich compiler: producer (one program, SDK environment opt-in)");
      compile("producer", "fixture");
    } finally {
      if (sdkTransform === undefined) delete process.env.NESTIA_SDK_TRANSFORM;
      else process.env.NESTIA_SDK_TRANSFORM = sdkTransform;
    }
    test_sdk_producer_metadata(path.join(sandbox, ".producer"));
    const { Backend } = require(path.join(sandbox, ".producer/Backend.js"));
    backend = new Backend();
    const application = await measure("backend express", () => backend.open());
    record("operation-metadata-before-generation.json", collectMetadata());
    let verifyCustomizedBundle;
    try {
      verifyCustomizedBundle = await measure("bundle customization (direct bundle 1, existing All refill 1)", () => test_sdk_bundle_preserves_customized_output({
        installation, output: path.join(sandbox, "consumer/src/api"), record,
      }));
    } catch (error) {
      failures.push("SDK bundle customization preparation");
      console.error(error);
    }
    const generation = new NestiaSdkApplication({
      input: async () => application,
      clone: true,
      simulate: true,
      output: path.join(sandbox, "consumer/src/api"),
      e2e: path.join(sandbox, "consumer/src/features/generated"),
      swagger: {
        output: path.join(sandbox, "swagger.json"),
        beautify: true,
        openapi: "3.1",
        decompose: true,
        security: {
          bearer: { type: "http", scheme: "bearer" },
          apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
        },
      },
    });
    await measure("generation all (SDK, Swagger, E2E)", () => generation.all());
    if (verifyCustomizedBundle !== undefined) {
      try {
        verifyCustomizedBundle();
      } catch (error) {
        failures.push("SDK bundle preserved output");
        console.error(error);
      }
    }
    await measure("generation SDK propagated ABI", () => new NestiaSdkApplication({
      input: async () => application,
      clone: true,
      simulate: true,
      propagate: true,
      output: path.join(sandbox, "consumer/src/api_propagate"),
    }).sdk());
    const migrationCompilerOptions = await measure("migration generated source", () => prepareMigrationConsumer({
      installation,
      sandbox,
      swagger: JSON.parse(fs.readFileSync(path.join(sandbox, "swagger.json"), "utf8")),
    }));
    console.log("Rich compiler: consumer (one generated program)");
    compile("consumer", "consumer", {
      ...migrationCompilerOptions,
    });
    const address = application.getHttpServer().address();
    if (address === null || typeof address === "string")
      throw new Error("Common application has no TCP address.");
    const host = `http://127.0.0.1:${address.port}`;
    const { main: consume } = require(path.join(sandbox, ".consumer/index.js"));
    try {
      await measure("consumer express", () => consume(host, authoredCases, "express"));
    } catch (error) {
      failures.push("rich request consumer");
      console.error(error);
    }
    try {
      await measure("benchmark connections", () => runBenchmark({ sandbox, host, installation, application }));
    } catch (error) {
      failures.push("benchmark worker/HTTP connection");
      console.error(error);
    }
    try {
      await backend.close();
      const fastify = await measure("backend fastify", () => backend.open("fastify"));
      const fastifyAddress = fastify.getHttpServer().address();
      if (fastifyAddress === null || typeof fastifyAddress === "string")
        throw new Error("Fastify application has no TCP address.");
      await measure("consumer fastify", () => consume(`http://127.0.0.1:${fastifyAddress.port}`, authoredCases, "fastify"));
    } catch (error) {
      failures.push("rich Fastify request consumer");
      console.error(error);
    }
    try {
      await measure("migration simulator", () => testMigrationConsumer({ sandbox }));
    } catch (error) {
      failures.push("migration generated consumer");
      console.error(error);
    }
    if (failures.length) throw new Error(`E2E failed: ${failures.join(", ")}`);
  } catch (error) {
    primaryError = error;
    try { record("failure.json", error); }
    catch (captureError) { secondaryErrors.push(captureError); }
  } finally {
    try { snapshot(); }
    catch (error) { secondaryErrors.push(error); }
    try { if (backend !== undefined) await backend.close(); }
    catch (error) { secondaryErrors.push(error); }
    try { if (installation !== undefined) installation.close(); }
    catch (error) { secondaryErrors.push(error); }
    try {
      if (path.dirname(sandbox) !== __dirname) throw new Error("Rich sandbox escaped its owner.");
      fs.rmSync(sandbox, { recursive: true, force: true });
    } catch (error) { secondaryErrors.push(error); }
    if (secondaryErrors.length) {
      try { record("secondary-errors.json", secondaryErrors); }
      catch (error) { console.error("Secondary error record failed:", error); }
    }
  }
  if (secondaryErrors.length)
    throw new AggregateError(primaryError === undefined ? secondaryErrors : [primaryError, ...secondaryErrors],
      primaryError === undefined ? "E2E artifact or cleanup failure." : `E2E failed: ${primaryError.message}; additional artifact or cleanup failures.`,
      { cause: primaryError });
  if (primaryError !== undefined) throw primaryError;
};

module.exports = { main };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
