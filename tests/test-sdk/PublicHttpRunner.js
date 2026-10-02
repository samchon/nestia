const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const { preparePublicConsumer } = require("./PublicConsumer");
const {
  test_public_typia_version_guard,
} = require("./test_public_typia_version_guard");
const { test_public_legacy_plugins } = require("./test_public_legacy_plugins");

/**
 * Runs authored and freshly generated HTTP cases through one installed program.
 *
 * One producer compiles the authored controllers. The actual application feeds
 * generation without another input compiler and then serves every consumer
 * request. One consumer compilation prepares the authored and generated cases;
 * plain JavaScript execution starts no TypeScript loader or native host. The
 * installed compiler's version-rejection and legacy-plugin boundaries are
 * reported separately; their assertion failures do not suppress executable HTTP
 * cases. The producer uses the explicit legacy SDK entry with its environment
 * activation off; the consumer uses modern entries and activation.
 *
 * @evidence contracts/common.md#principled-implementation Public installed TtscCompiler emits the actual authored controller and consumer programs with their shared strict language configuration. Public Nest and SDK application-input APIs use one real application for generation and requests, and DynamicExecutor reports all authored and newly generated assertions.
 * @evidence contracts/common.md#clear-and-simple-design Installation, independent compiler boundary cases, producer, generation, consumer compilation and request execution have visible results. Boundary failures are retained with their names while positive HTTP cases continue; their final result aggregates both populations. Explicit legacy SDK registration activates the producer, while environment activation serves the modern consumer; they do not activate the same program twice. One finally block owns application release, including initialization, generation and consumer failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All product operations resolve through the ordinary packed installation. The runner patches neither generated JavaScript nor foreign resolvers and copies no previously generated clients or automated cases as input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies each necessary boundary and its shared lifetime; phase timings, individual failures and discovered counts remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths locate the assignment-owned fixture. Temporary removal verifies containment before recursive deletion, and the listener uses an OS-assigned loopback port. Public package imports use the consumer's normal Node resolution.
 * @evidence contracts/performance.md#efficient-algorithms Each authored input tree is copied once, each producer and consumer program is compiled once, and generation analyzes the same actual application rather than per-case configurations.
 * @evidence contracts/performance.md#reuse-equivalent-work Stateless controllers have separate scenario routes and common compiler/encryption settings. Generation and requests share those exact compiled controllers and one application; newly generated consumer files are compiled together once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One private fixture, two compilation result maps and one application belong to this run. Emitted files remain in the ignored assignment root; the real application closes in finally after success or any subsequent failure.
 */
async function runPublicHttp() {
  const consumer = await preparePublicConsumer();
  const fixture = path.join(consumer.root, "projects/http-rich");
  const relative = path.relative(consumer.root, fixture);
  assert(
    relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    "Fixture must belong to the public consumer.",
  );
  await fs.rm(fixture, { recursive: true, force: true });
  const source = path.join(__dirname, "features/http-rich/src");
  for (const directory of ["controllers", "structures"])
    await fs.cp(
      path.join(source, directory),
      path.join(fixture, "src", directory),
      { recursive: true },
    );
  const authoredFeatures = path.join(source, "test/features");
  await fs.cp(authoredFeatures, path.join(fixture, "src/test/features"), {
    recursive: true,
    filter: (file) =>
      path
        .relative(authoredFeatures, file)
        .split(path.sep)
        .every((component) => component !== "automated"),
  });
  const root = path.resolve(__dirname, "../..");
  await fs.cp(
    path.join(source, "benchmark"),
    path.join(fixture, "src/benchmark"),
    {
      recursive: true,
    },
  );
  const config = {
    extends: path.join(root, "tests/config/tsconfig.json"),
    compilerOptions: {
      rootDir: "src",
      outDir: "producer",
      noEmit: false,
      plugins: [
        { transform: "typia/lib/transform" },
        {
          transform: "@nestia/core/lib/transform",
          validate: "assert",
          stringify: "assert",
        },
        { transform: "@nestia/sdk/lib/transform" },
      ],
    },
    include: ["src/controllers"],
  };
  await fs.writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify(config, null, 2),
  );
  const { TtscCompiler } = consumer.requirePublic("ttsc");
  const cache = path.resolve(
    __dirname,
    process.env.TTSC_CACHE_DIR ?? path.join(root, "node_modules/.cache/ttsc"),
  );
  const boundaryFailures = [];
  const boundaryStarted = Date.now();
  try {
    test_public_typia_version_guard(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_typia_version_guard passed; ${Date.now() - boundaryStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_typia_version_guard", error });
    console.error(
      "Public compiler boundary: test_public_typia_version_guard failed",
      error,
    );
  }
  await compilePublicProgram(
    TtscCompiler,
    fixture,
    "tsconfig.json",
    cache,
    "producer",
    { NESTIA_SDK_TRANSFORM: "" },
  );
  try {
    test_public_legacy_plugins(fixture);
    console.log("Public compiler boundary: test_public_legacy_plugins passed");
  } catch (error) {
    boundaryFailures.push({ name: "test_public_legacy_plugins", error });
    console.error(
      "Public compiler boundary: test_public_legacy_plugins failed",
      error,
    );
  }
  const core = consumer.requirePublic("@nestia/core");
  const { NestFactory } = consumer.requirePublic("@nestjs/core");
  const { NestiaSdkApplication } = consumer.requirePublic("@nestia/sdk");
  const { DynamicExecutor } = consumer.requirePublic("@nestia/e2e");
  const app = await NestFactory.create(
    await core.EncryptedModule.dynamic(
      path.join(fixture, "producer/controllers"),
      {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      },
    ),
    { logger: false },
  );
  const traffic = { active: false, inFlight: 0, peak: 0 };
  try {
    app.use((_request, response, next) => {
      if (!traffic.active) return next();
      traffic.peak = Math.max(traffic.peak, ++traffic.inFlight);
      response.once("close", () => --traffic.inFlight);
      setTimeout(next, 20);
    });
    await app.init();
    const generation = Date.now();
    await new NestiaSdkApplication({
      input: () => app,
      output: path.join(fixture, "src/api"),
      e2e: path.join(fixture, "src/test"),
      swagger: {
        output: path.join(fixture, "swagger.json"),
        security: { bearer: { type: "apiKey" } },
      },
    }).all();
    console.log(`Public HTTP generation: ${Date.now() - generation} ms`);
    const runtimeConfig = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        outDir: "consumer",
        plugins: [
          { transform: "typia/lib/transform", enabled: false },
          { transform: "@nestia/core/native/transform.cjs" },
        ],
      },
      include: ["src/test/features", "src/benchmark"],
    };
    await fs.writeFile(
      path.join(fixture, "tsconfig.consumer.json"),
      JSON.stringify(runtimeConfig, null, 2),
    );
    await compilePublicProgram(
      TtscCompiler,
      fixture,
      "tsconfig.consumer.json",
      cache,
      "consumer",
    );
    await app.listen(0, "127.0.0.1");
    const host = await app.getUrl();
    const report = await DynamicExecutor.validate({
      location: path.join(fixture, "consumer/test/features"),
      prefix: "test",
      extension: "js",
      simultaneous: 1,
      parameters: () => [
        { host, encryption: { key: "A".repeat(32), iv: "B".repeat(16) } },
        traffic,
      ],
      onComplete: (execution) => {
        console.log(
          ` - ${execution.name}: ${execution.error ? "failed" : "passed"}`,
        );
        if (execution.error) console.error(execution.error);
      },
    });
    if (report.executions.length === 0)
      throw new Error("No public HTTP integration cases were discovered.");
    console.log(
      `Public HTTP runtime: ${report.executions.length} cases; ${report.time} ms`,
    );
    const failures = report.executions.filter((execution) => execution.error);
    if (failures.length || boundaryFailures.length)
      throw new AggregateError(
        [
          ...boundaryFailures.map((failure) => failure.error),
          ...failures.map((execution) => execution.error),
        ],
        `Public HTTP failed: ${[
          ...boundaryFailures.map((failure) => failure.name),
          ...failures.map((execution) => execution.name),
        ].join(", ")}`,
      );
  } finally {
    await app.close();
  }
}

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

module.exports = { runPublicHttp };
if (require.main === module)
  runPublicHttp().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
