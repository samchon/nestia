const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const { prepare } = require("./internal/consumer.cjs");
const { test_sdk_producer_metadata } = require("./internal/test_sdk_producer_metadata.cjs");
const { run: runBenchmark } = require("./internal/benchmark.cjs");
const { prepareMigration, prepareMigrationConsumer, testMigrationConsumer } = require("./internal/migration.cjs");

/**
 * Runs the installed rich producer and its generated consumer.
 *
 * The producer and consumer each own one TypeScript program. Generation reads
 * the caller-owned running application, avoiding an additional controller
 * compilation and independent feature backends.
 *
 * 1. Install the freshly packed packages once and copy the authored inputs.
 * 2. Compile the producer, start one app and generate its SDK and Swagger.
 * 3. Compile the combined consumer, execute its cases and release resources.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed public TtscCompiler emits both real programs, installed NestiaSdkApplication generates artifacts from the emitted app and the consumer exercises actual requests; compile, generation and request failures propagate.
 * @evidence contracts/testing.md#independent-expectations Request cases retain authored DTO, arithmetic and status expectations; the harness requires nonempty emitted files and guards their containment rather than manufacturing an expected product snapshot.
 * @evidence contracts/testing.md#distinguishing-cases The combined input retains separate scenario routes, types and request failures; incompatible diagnostic/noEmit and worker cases remain explicit pending transfers in the ledger.
 * @evidence contracts/testing.md#execution-ownership The sole test-e2e workspace entry invokes this exported operation. It uses installed public compiler and SDK APIs, and never calls legacy workspace starts or compiles projects per feature.
 * @evidence contracts/e2e.md#necessary-boundary One actual packed installation connects published exports, the composed native producer, generator, generated client and HTTP/WebSocket/MCP runtime. Pure operation calls cannot prove that connection.
 * @evidence contracts/e2e.md#shared-execution Exactly one producer and one consumer program share a single installation and running application. Application-input generation reuses the producer's reflected metadata without ConfigAnalyzer's source-input recompilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique sandbox owns immutable input copies and phase outputs. Explicit route/type namespaces isolate scenarios, an ephemeral port avoids collisions and finally closes the backend before removing the installation and sandbox.
 * @evidence contracts/e2e.md#preserved-coverage The per-assertion campaign ledger identifies request destinations and pending legacy transfers. The rich program does not certify untransferred cases; originals remain until verified ownership exists.
 */
const main = async () => {
  process.env.TTSC_CACHE_DIR = path.resolve(__dirname,
    process.env.TTSC_CACHE_DIR ?? "../../node_modules/.cache/ttsc");
  const processCases = path.join(__dirname, "evidence/src/features");
  const processes = cp.spawnSync(process.execPath, [
    "--test",
    "--test-concurrency=1",
    ...fs.readdirSync(processCases).filter((name) => name.startsWith("test_") && name.endsWith(".mjs")).map((name) => path.join(processCases, name)),
  ], { cwd: __dirname, stdio: "inherit", windowsHide: true });
  const processFailure = processes.error || processes.signal || processes.status !== 0;
  const failures = [];
  if (processFailure) failures.push("process boundaries");
  const sandbox = fs.mkdtempSync(path.join(__dirname, ".tmp-rich-"));
  let installation;
  let backend;
  try {
    installation = await prepare(__dirname);
    installation.mount(sandbox);
    fs.writeFileSync(path.join(sandbox, "package.json"), JSON.stringify({ private: true, type: "commonjs" }));
    fs.cpSync(path.join(__dirname, "fixture"), path.join(sandbox, "fixture"), { recursive: true });
    fs.cpSync(path.join(__dirname, "consumer"), path.join(sandbox, "consumer"), { recursive: true });
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
    try {
      await prepareMigration({ installation, sandbox });
    } catch (error) {
      failures.push("migration CLI arguments/archiving");
      console.error(error);
    }
    const { TtscCompiler } = require(require.resolve("ttsc", { paths: [installation.directory] }));
    const { NestiaSdkApplication } = require(require.resolve("@nestia/sdk", { paths: [installation.directory] }));
    const common = {
      extends: path.resolve(__dirname, "../config/tsconfig.json"),
      compilerOptions: {
        noEmit: false,
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
      const result = new TtscCompiler({ cwd: sandbox, tsconfig: project }).compile();
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
    const application = await backend.open();
    const generation = new NestiaSdkApplication({
      input: async () => application,
      clone: true,
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
    await generation.all();
    const migrationCompilerOptions = await prepareMigrationConsumer({
      installation,
      sandbox,
      swagger: JSON.parse(fs.readFileSync(path.join(sandbox, "swagger.json"), "utf8")),
    });
    console.log("Rich compiler: consumer (one generated program)");
    compile("consumer", "consumer", migrationCompilerOptions);
    const address = application.getHttpServer().address();
    if (address === null || typeof address === "string")
      throw new Error("Common application has no TCP address.");
    const host = `http://127.0.0.1:${address.port}`;
    const { main: consume } = require(path.join(sandbox, ".consumer/index.js"));
    try {
      await consume(host, authoredCases);
    } catch (error) {
      failures.push("rich request consumer");
      console.error(error);
    }
    try {
      await runBenchmark({ sandbox, host, installation, application });
    } catch (error) {
      failures.push("benchmark worker/HTTP connection");
      console.error(error);
    }
    try {
      await testMigrationConsumer({ sandbox });
    } catch (error) {
      failures.push("migration generated consumer");
      console.error(error);
    }
    if (failures.length) throw new Error(`E2E failed: ${failures.join(", ")}`);
  } finally {
    try {
      if (backend !== undefined) await backend.close();
    } finally {
      if (installation !== undefined) installation.close();
      if (path.dirname(sandbox) !== __dirname) throw new Error("Rich sandbox escaped its owner.");
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  }
};

module.exports = { main };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
